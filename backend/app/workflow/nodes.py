import datetime
import json
from typing import Dict, Any, List
from app.workflow.state import ClaimState
from app.config import settings
from app.workflow.tools import (
    document_extraction_tool,
    policy_lookup_tool,
    claim_history_tool,
    coverage_calculator_tool
)
import google.generativeai as genai

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def get_timestamp() -> str:
    return datetime.datetime.utcnow().isoformat()

def document_extraction_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 1: Extract unstructured PDF data for policy and claim documents.
    """
    print("--- [Node: DocumentExtractionNode] ---")
    
    from sqlmodel import Session, select
    from app.db.database import engine
    from app.db.models import Policy, Claim
    
    fallback_number = state.get("policy_number", "POL-1001")
    fallback_holder = "John Doe"
    fallback_limit = 500000.0
    fallback_amount = 45000.0
    
    try:
        with Session(engine) as session:
            # Fetch actual policy values
            stmt_policy = select(Policy).where(Policy.policy_number == fallback_number)
            policy_rec = session.exec(stmt_policy).first()
            if policy_rec:
                fallback_holder = policy_rec.policy_holder
                fallback_limit = float(policy_rec.coverage_limit)
                
            # Fetch actual claim amount
            claim_id_str = state.get("claim_id")
            if claim_id_str:
                import uuid
                claim_uuid = uuid.UUID(claim_id_str) if isinstance(claim_id_str, str) else claim_id_str
                claim_rec = session.get(Claim, claim_uuid)
                if claim_rec:
                    fallback_amount = float(claim_rec.claim_amount)
    except Exception as e:
        print(f"Could not load database records for extraction fallback: {e}")
        
    # Extract Policy Metadata using dynamic database fallbacks
    extracted_policy = document_extraction_tool(
        state["policy_pdf_url"], 
        document_type="policy",
        fallback_number=fallback_number,
        fallback_holder=fallback_holder,
        fallback_limit=fallback_limit,
        fallback_amount=fallback_amount
    )
    
    # Extract Claim Metadata using dynamic database fallbacks
    extracted_claim = document_extraction_tool(
        state["claim_pdf_url"], 
        document_type="claim",
        fallback_number=fallback_number,
        fallback_holder=fallback_holder,
        fallback_limit=fallback_limit,
        fallback_amount=fallback_amount
    )
    
    # Generate audit log entry
    audit = {
        "node": "DocumentExtractionNode",
        "action": "Extracted claim and policy PDF documents",
        "timestamp": get_timestamp(),
        "details": {
            "extracted_claim_keys": list(extracted_claim.keys()),
            "extracted_policy_keys": list(extracted_policy.keys())
        }
    }
    
    # Merge existing audit logs with the new one
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "extracted_claim": extracted_claim,
        "extracted_policy": extracted_policy,
        "policy_number": extracted_policy.get("policy_number", state.get("policy_number", "")),
        "audit_logs": new_logs
    }

def policy_lookup_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 2: Search vector DB for coverage clauses matching the claimed treatment.
    """
    print("--- [Node: PolicyLookupNode] ---")
    treatment = state.get("extracted_claim", {}).get("treatment") or "Appendectomy"
    
    # Retrieve clauses using RAG
    clauses = policy_lookup_tool(state["policy_id"], treatment)
    
    audit = {
        "node": "PolicyLookupNode",
        "action": f"Queried policy clauses matching '{treatment}' using Qdrant RAG",
        "timestamp": get_timestamp(),
        "details": {
            "clauses_count": len(clauses)
        }
    }
    
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "retrieved_clauses": clauses,
        "audit_logs": new_logs
    }

def claim_history_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 3: Fetch past claims from PostgreSQL DB for user history.
    """
    print("--- [Node: ClaimHistoryNode] ---")
    customer_id = state["customer_id"]
    
    history = claim_history_tool(customer_id)
    
    audit = {
        "node": "ClaimHistoryNode",
        "action": "Fetched historical approved claims from PostgreSQL",
        "timestamp": get_timestamp(),
        "details": {
            "past_claims_count": len(history)
        }
    }
    
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "customer_history": history,
        "audit_logs": new_logs
    }

def coverage_calculator_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 4: Compute limits and remaining coverage balances.
    """
    print("--- [Node: CoverageCalculatorNode] ---")
    
    # Extract calculations inputs safely with NoneType fallbacks
    extracted_policy = state.get("extracted_policy") or {}
    extracted_claim = state.get("extracted_claim") or {}
    
    policy_limit_val = extracted_policy.get("coverage_limit")
    policy_limit = float(policy_limit_val) if policy_limit_val is not None else 500000.0
    
    current_claim_val = extracted_claim.get("claim_amount")
    current_claim = float(current_claim_val) if current_claim_val is not None else 45000.0
    
    # Sum historical approved claims amounts
    existing_claims_sum = sum(float(c.get("amount", 0.0)) for c in state.get("customer_history", []) or [])
    
    # Compute totals
    calc_results = coverage_calculator_tool(
        coverage_limit=policy_limit,
        existing_claims=existing_claims_sum,
        current_claim_amount=current_claim
    )
    
    audit = {
        "node": "CoverageCalculatorNode",
        "action": "Calculated coverage balance bounds",
        "timestamp": get_timestamp(),
        "details": calc_results
    }
    
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "coverage_math": calc_results,
        "audit_logs": new_logs
    }


def eligibility_decision_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 5: Perform clinical exclusion and waiting period analysis.
    """
    print("--- [Node: EligibilityDecisionNode] ---")
    
    # Safely retrieve RAG Clauses
    retrieved_clauses = state.get("retrieved_clauses") or []
    clauses_text = "\n".join(retrieved_clauses)
    
    extracted_claim = state.get("extracted_claim") or {}
    treatment = extracted_claim.get("treatment") or "Appendectomy"
    
    coverage_math = state.get("coverage_math") or {}
    exceeds_limit = coverage_math.get("exceeds_limit", False)
    
    # Smarter rule-based fallback checks
    treatment_lower = treatment.lower()
    if exceeds_limit:
        verdict = {
            "eligible": False,
            "reason": f"Claim amount exceeds remaining coverage limit by ₹{coverage_math.get('overage_amount', 0.0)}."
        }
    elif "cosmetic" in treatment_lower or "rhinoplasty" in treatment_lower:
        verdict = {
            "eligible": False,
            "reason": "Claim rejected due to policy exclusion: Cosmetic procedures are strictly excluded."
        }
    elif "cataract" in treatment_lower or "pre-existing" in treatment_lower or "diabetes" in treatment_lower:
        verdict = {
            "eligible": False,
            "reason": "Claim rejected due to pre-existing condition waiting period policy exclusion (Clause 4.5)."
        }
    else:
        verdict = {"eligible": True, "reason": "All checks passed. Treatment covered."}
    
    if settings.GEMINI_API_KEY and not exceeds_limit:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                f"You are an expert Insurance Eligibility Agent. Evaluate this claim:\n"
                f"Treatment: {treatment}\n"
                f"Claim Amount: {extracted_claim.get('claim_amount')}\n"
                f"Coverage Arithmetic: {coverage_math}\n"
                f"Retrieved Policy Clauses:\n{clauses_text}\n\n"
                f"Check if there are policy exclusions or waiting period issues that invalidate this claim.\n"
                f"Return JSON containing 'eligible' (bool) and 'reason' (string) only."
            )
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            verdict = json.loads(response.text)
        except Exception as e:
            print(f"Eligibility verification Gemini call failed: {e}. Using deterministic fallback.")
    
    audit = {
        "node": "EligibilityDecisionNode",
        "action": "Formulated eligibility evaluation",
        "timestamp": get_timestamp(),
        "details": verdict
    }
    
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "eligibility_verdict": verdict,
        "audit_logs": new_logs
    }

def recommendation_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 6: Core Recommendation model synthesizing eligibility audits.
    """
    print("--- [Node: RecommendationNode] ---")
    
    verdict = state.get("eligibility_verdict") or {}
    eligible = verdict.get("eligible", True)
    reasoning = verdict.get("reason", "")
    
    rec = {"recommendation": "APPROVE", "reason": "Evaluated eligibility checks passed."}
    
    if not eligible:
        rec = {
            "recommendation": "REJECT",
            "reason": f"Eligibility verification failed: {reasoning}"
        }
    elif settings.GEMINI_API_KEY:
        try:
            # Optionally swap model using environment settings
            model_name = settings.MODEL_NAME if settings.MODEL_NAME else "gemini-2.5-flash"
            model = genai.GenerativeModel(model_name)
            
            extracted_claim = state.get("extracted_claim") or {}
            coverage_math = state.get("coverage_math") or {}
            
            prompt = (
                f"You are a Claims Recommendation Agent. Synthesize the following outputs:\n"
                f"Claim Details: {extracted_claim}\n"
                f"Eligibility Verdict: {verdict}\n"
                f"Coverage Math: {coverage_math}\n\n"
                f"Decide whether to RECOMMEND 'APPROVE', 'REJECT', or 'MANUAL_REVIEW'.\n"
                f"Return JSON containing 'recommendation' (string) and 'reason' (string) only."
            )
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            rec = json.loads(response.text)
        except Exception as e:
            print(f"Recommendation Gemini call failed: {e}. Using fallback.")
            
    audit = {
        "node": "RecommendationNode",
        "action": "Compiled AI recommendation",
        "timestamp": get_timestamp(),
        "details": rec
    }
    
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "ai_recommendation": rec,
        "audit_logs": new_logs
    }


def decision_node(state: ClaimState) -> Dict[str, Any]:
    """
    Node 7: Post-Approval step recording human officer actions.
    """
    print("--- [Node: DecisionNode] ---")
    
    human = state.get("human_action")
    action = human.get("action", "APPROVED") if human else "APPROVED"
    notes = human.get("notes", "") if human else ""
    officer_id = human.get("officer_id", "") if human else "system_default"
    
    audit = {
        "node": "DecisionNode",
        "action": f"Final claim status set to {action} by Officer {officer_id}",
        "timestamp": get_timestamp(),
        "details": {
            "action": action,
            "officer_notes": notes
        }
    }
    
    logs = state.get("audit_logs", []) or []
    new_logs = logs + [audit]
    
    return {
        "audit_logs": new_logs
    }
