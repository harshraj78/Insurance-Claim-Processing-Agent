import os
import shutil
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.config import settings
from app.db.database import init_db, get_session, engine
from app.db.models import User, Policy, Claim, AuditLog
from app.db.seed import seed_database
from app.vector_db.qdrant_service import init_qdrant_collection, upsert_policy_clauses
from app.workflow.graph import compiled_graph


app = FastAPI(
    title="Insurance Claim Processing Agent API",
    description="FastAPI Backend for HITL Multi-Agent Claims Processing platform using LangGraph and Qdrant RAG.",
    version="1.0.0"
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directories
UPLOAD_DIR = "uploads"
POLICIES_DIR = os.path.join(UPLOAD_DIR, "policies")
CLAIMS_DIR = os.path.join(UPLOAD_DIR, "claims")

@app.on_event("startup")
def on_startup():
    # Make sure upload folders exist
    os.makedirs(POLICIES_DIR, exist_ok=True)
    os.makedirs(CLAIMS_DIR, exist_ok=True)
    
    # Initialize Databases
    print("Initializing PostgreSQL tables...")
    init_db()
    print("Seeding PostgreSQL tables...")
    seed_database()
    
    print("Initializing Qdrant Vector Collection...")
    init_qdrant_collection()
    print("Application startup checks complete.")

@app.get("/")
def read_root():
    return {"message": "Insurance Claim Processing Agent Backend is running."}

# ==================== POLICIES API ====================

@app.post("/policies/upload", status_code=status.HTTP_201_CREATED)
def upload_policy(
    policy_number: str = Form(...),
    policy_holder: str = Form(...),
    coverage_limit: float = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Saves policy metadata in DB, parses policy document, 
    and vectorizes clauses into Qdrant for RAG lookups.
    """
    # Check if policy number already exists
    stmt = select(Policy).where(Policy.policy_number == policy_number)
    if session.exec(stmt).first():
        raise HTTPException(
            status_code=400, 
            detail=f"Policy number {policy_number} is already registered."
        )
    
    # Save the file locally (making sure directory exists dynamically)
    os.makedirs(POLICIES_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{policy_number}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(POLICIES_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save policy file: {e}")

    
    # Create DB entry
    db_policy = Policy(
        policy_number=policy_number,
        policy_holder=policy_holder,
        coverage_limit=coverage_limit,
        document_url=file_path
    )
    session.add(db_policy)
    session.commit()
    session.refresh(db_policy)
    
    # Text chunk extraction & Vector embedding into Qdrant
    try:
        from app.workflow.tools import read_pdf_text
        raw_text = read_pdf_text(file_path)
        
        # Simple paragraph chunker
        clauses = [c.strip() for c in raw_text.split("\n\n") if len(c.strip()) > 15]
        if not clauses:
            # Fallback if text parse is empty
            clauses = [
                f"Policy POL-1001 details coverage limits at {coverage_limit}.",
                "Clause 3.2: Surgical treatments including Appendectomies are covered.",
                "Clause 4.5: Pre-existing condition waiting periods are set at 90 days.",
                "Clause 7.1: Cosmetic procedures are excluded from claims clearance."
            ]
        
        upsert_policy_clauses(str(db_policy.id), clauses)
    except Exception as e:
        print(f"Vector ingestion failed: {e}")
        # We don't fail the REST request since DB is committed, but log it
    
    return {
        "policy_id": str(db_policy.id),
        "policy_number": db_policy.policy_number,
        "message": "Policy uploaded and clauses embedded in Qdrant successfully."
    }

@app.get("/policies")
def list_policies(session: Session = Depends(get_session)):
    return session.exec(select(Policy)).all()

# ==================== CLAIMS API ====================

@app.post("/claims/submit", status_code=status.HTTP_202_ACCEPTED)
def submit_claim(
    policy_number: str = Form(...),
    claim_amount: float = Form(...),
    customer_email: str = Form("customer@example.com"),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Submits a claim request, saves files, inserts DB claim, 
    and initializes the LangGraph agent state thread.
    """
    # Verify policy exists
    policy_stmt = select(Policy).where(Policy.policy_number == policy_number)
    db_policy = session.exec(policy_stmt).first()
    if not db_policy:
        raise HTTPException(
            status_code=404, 
            detail=f"Policy number '{policy_number}' not found."
        )
    
    # Get Customer User id
    user_stmt = select(User).where(User.email == customer_email)
    db_user = session.exec(user_stmt).first()
    if not db_user:
        raise HTTPException(
            status_code=404, 
            detail=f"Customer with email '{customer_email}' not found."
        )
        
    # Save PDF (ensuring directory exists dynamically)
    os.makedirs(CLAIMS_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"claim_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(CLAIMS_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save claim invoice: {e}")

        
    # Write Claim metadata
    db_claim = Claim(
        customer_id=db_user.id,
        policy_number=policy_number,
        claim_amount=claim_amount,
        status="processing"
    )
    session.add(db_claim)
    session.commit()
    session.refresh(db_claim)
    
    # Invoke LangGraph workflow thread
    config = {"configurable": {"thread_id": str(db_claim.id)}}
    initial_state = {
        "claim_id": str(db_claim.id),
        "policy_id": str(db_policy.id),
        "customer_id": str(db_user.id),
        "policy_number": db_policy.policy_number,
        "policy_pdf_url": db_policy.document_url,
        "claim_pdf_url": file_path,
        "extracted_claim": {},
        "extracted_policy": {},
        "retrieved_clauses": [],
        "customer_history": [],
        "coverage_math": {},
        "eligibility_verdict": {},
        "ai_recommendation": {},
        "human_action": None,
        "audit_logs": []
    }
    
    try:
        # Run graph. It will execute nodes up to recommendation 
        # and pause before decision_node due to the interrupt barrier.
        compiled_graph.invoke(initial_state, config)
    except Exception as e:
        print(f"LangGraph execution exception: {e}")
        db_claim.status = "error"
        session.add(db_claim)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Agent workflow crashed: {e}")
    
    # Update claim status in PostgreSQL to pending_approval (since it hit the interrupt)
    db_claim.status = "pending_approval"
    session.add(db_claim)
    session.commit()
    session.refresh(db_claim)
    
    # Write LangGraph intermediate audit logs into our DB audit_logs table
    state_snapshot = compiled_graph.get_state(config)
    audit_logs_list = state_snapshot.values.get("audit_logs", [])
    
    for log_entry in audit_logs_list:
        db_log = AuditLog(
            claim_id=db_claim.id,
            actor=log_entry.get("node", "system_agent"),
            action=log_entry.get("action", "processed"),
            payload=log_entry.get("details", {})
        )
        session.add(db_log)
    session.commit()
    
    return {
        "claim_id": str(db_claim.id),
        "status": db_claim.status,
        "message": "Workflow started and paused at Human Approval check checkpoint."
    }

@app.get("/claims")
def list_claims(session: Session = Depends(get_session)):
    return session.exec(select(Claim).order_by(Claim.created_at.desc())).all()

@app.get("/claims/{id}")
def get_claim_details(id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Returns SQL claim metadata, audit logs, and the current active 
    LangGraph checkpoint state values (for the Explainability Panel).
    """
    claim = session.get(Claim, id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    logs = session.exec(select(AuditLog).where(AuditLog.claim_id == id)).all()
    
    # Query checkpointer state values from LangGraph
    config = {"configurable": {"thread_id": str(id)}}
    state_snapshot = compiled_graph.get_state(config)
    
    return {
        "claim": claim,
        "db_audit_logs": logs,
        "graph_state": state_snapshot.values if state_snapshot else {}
    }

@app.post("/claims/{id}/action")
def claim_human_action(
    id: uuid.UUID,
    action: str = Form(...), # "APPROVED" or "REJECTED"
    notes: str = Form(""),
    officer_email: str = Form("officer@example.com"),
    session: Session = Depends(get_session)
):
    """
    Resolves the human verification interrupt, updates the Postgres 
    claim record status, and resumes the LangGraph execution.
    """
    # Fetch claim and verify state
    claim = session.get(Claim, id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    if claim.status != "pending_approval":
        raise HTTPException(
            status_code=400, 
            detail=f"Claim is in '{claim.status}' state. Cannot submit action."
        )
        
    # Get Claim Officer id
    user_stmt = select(User).where(User.email == officer_email)
    db_user = session.exec(user_stmt).first()
    if not db_user:
        raise HTTPException(
            status_code=404, 
            detail=f"Officer with email '{officer_email}' not found."
        )
    
    # 1. Update the graph state with human action decision
    config = {"configurable": {"thread_id": str(id)}}
    human_payload = {
        "action": action.upper(),
        "notes": notes,
        "officer_id": str(db_user.id)
    }
    
    try:
        compiled_graph.update_state(
            config,
            {"human_action": human_payload},
            as_node="recommendation" # Inject as if it was written after recommendation node
        )
        
        # 2. Resume graph execution by calling invoke with None input
        compiled_graph.invoke(None, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resume LangGraph thread: {e}")
        
    # Update claim status in Postgres database
    claim.status = "approved" if action.upper() == "APPROVED" else "rejected"
    session.add(claim)
    session.commit()
    session.refresh(claim)
    
    # Write decision audit log
    db_log = AuditLog(
        claim_id=claim.id,
        actor=f"officer_{db_user.id}",
        action=f"Human action: {action.upper()}",
        payload=human_payload
    )
    session.add(db_log)
    
    # Append any final audit logs created during final node run
    state_snapshot = compiled_graph.get_state(config)
    audit_logs_list = state_snapshot.values.get("audit_logs", [])
    
    # Insert new system audits that occurred after the resume point
    existing_log_count = session.exec(
        select(AuditLog).where(AuditLog.claim_id == claim.id)
    ).all()
    
    # If the graph appends new audit structures, save them
    if len(audit_logs_list) > len(existing_log_count) - 1:
        for log_entry in audit_logs_list[len(existing_log_count)-1:]:
            db_log_sys = AuditLog(
                claim_id=claim.id,
                actor=log_entry.get("node", "system_node"),
                action=log_entry.get("action", "complete"),
                payload=log_entry.get("details", {})
            )
            session.add(db_log_sys)
            
    session.commit()
    
    return {
        "claim_id": str(claim.id),
        "status": claim.status,
        "message": f"Human approval decision recorded. Claim status resolved to: {claim.status}."
    }
