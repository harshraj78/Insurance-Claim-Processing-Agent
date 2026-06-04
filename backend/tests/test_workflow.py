import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
import os
import shutil
from sqlalchemy.pool import StaticPool

# In-memory SQLite for testing database - override engine BEFORE app.main imports it!
sqlite_url = "sqlite://"
engine = create_engine(
    sqlite_url, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)


import app.db.database
app.db.database.engine = engine

from app.main import app
from app.db.database import get_session
from app.db.models import User, Policy, Claim

# Dependency override
def override_get_session():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    print("Metadata tables before create_all:", list(SQLModel.metadata.tables.keys()))
    # Setup database
    SQLModel.metadata.create_all(engine)
    print("Metadata tables after create_all:", list(SQLModel.metadata.tables.keys()))
    
    # Pre-seed User
    with Session(engine) as session:
        # Customer
        customer = User(
            email="customer@example.com",
            password_hash="hashedpass",
            role="customer"
        )
        # Officer
        officer = User(
            email="officer@example.com",
            password_hash="hashedpass",
            role="claim_officer"
        )
        session.add(customer)
        session.add(officer)
        session.commit()
        
    yield

    
    # Cleanup database
    SQLModel.metadata.drop_all(engine)


def test_root():
    with TestClient(app, raise_server_exceptions=True) as client:
        response = client.get("/")
        assert response.status_code == 200, f"Error: {response.text}"
        assert "running" in response.json()["message"]

def test_policy_upload():
    # Create a dummy pdf
    dummy_pdf_path = "test_policy.pdf"
    with open(dummy_pdf_path, "wb") as f:
        f.write(b"%PDF-1.4 ... Dummy policy text describing coverage for POL-9999 ...")
        
    try:
        with TestClient(app, raise_server_exceptions=True) as client:
            with open(dummy_pdf_path, "rb") as f_in:
                response = client.post(
                    "/policies/upload",
                    data={
                        "policy_number": "POL-9999",
                        "policy_holder": "Alice Johnson",
                        "coverage_limit": 300000.0
                    },
                    files={"file": ("test_policy.pdf", f_in, "application/pdf")}
                )
            assert response.status_code == 201, f"Error: {response.text}"
            assert response.json()["policy_number"] == "POL-9999"
            assert "embedded" in response.json()["message"]
    finally:
        if os.path.exists(dummy_pdf_path):
            os.remove(dummy_pdf_path)
            
        # Clean local static upload folder
        shutil.rmtree("uploads", ignore_errors=True)


def test_claim_submission_and_approval():
    # 1. Re-upload Policy to ensure it exists in test context
    dummy_pdf_path = "test_policy.pdf"
    with open(dummy_pdf_path, "wb") as f:
        f.write(b"%PDF-1.4 ... Coverage for POL-8888 limit 300000 ... Exclusions: Cosmetic surgery is excluded.")
    
    # 2. Submit Claim
    dummy_claim_path = "test_claim.pdf"
    with open(dummy_claim_path, "wb") as f:
        f.write(b"%PDF-1.4 ... Patient: Alice Johnson. Treatment: Appendectomy. Amount: 45000.")
        
    claim_id = None
    try:
        with TestClient(app, raise_server_exceptions=True) as client:
            # Upload Policy
            with open(dummy_pdf_path, "rb") as f:
                pol_res = client.post(
                    "/policies/upload",
                    data={"policy_number": "POL-8888", "policy_holder": "Alice Johnson", "coverage_limit": 300000.0},
                    files={"file": ("test_policy.pdf", f, "application/pdf")}
                )
                assert pol_res.status_code == 201, f"Policy upload failed: {pol_res.text}"

            # Submit Claim
            with open(dummy_claim_path, "rb") as f:
                response = client.post(
                    "/claims/submit",
                    data={
                        "policy_number": "POL-8888",
                        "claim_amount": 45000.0,
                        "customer_email": "customer@example.com"
                    },
                    files={"file": ("test_claim.pdf", f, "application/pdf")}
                )
            assert response.status_code == 202, f"Claim submit failed: {response.text}"
            assert response.json()["status"] == "pending_approval"
            claim_id = response.json()["claim_id"]

            
            # 3. Get Claim Details (Verify Graph State and Explainability)
            details_res = client.get(f"/claims/{claim_id}")
            assert details_res.status_code == 200, f"Details failed: {details_res.text}"
            details = details_res.json()
            assert details["claim"]["status"] == "pending_approval"
            # Verify graph state extraction
            assert "extracted_claim" in details["graph_state"]
            assert "extracted_policy" in details["graph_state"]
            assert "coverage_math" in details["graph_state"]
            assert "ai_recommendation" in details["graph_state"]
            
            # 4. Action Claim (Approve)
            action_res = client.post(
                f"/claims/{claim_id}/action",
                data={
                    "action": "APPROVED",
                    "notes": "Verified requirements, claim approved",
                    "officer_email": "officer@example.com"
                }
            )
            assert action_res.status_code == 200, f"Action failed: {action_res.text}"
            assert action_res.json()["status"] == "approved"
            
            # 5. Verify Postgres Claim Status is resolved
            final_res = client.get(f"/claims/{claim_id}")
            assert final_res.json()["claim"]["status"] == "approved"
    finally:
        if os.path.exists(dummy_pdf_path):
            os.remove(dummy_pdf_path)
        if os.path.exists(dummy_claim_path):
            os.remove(dummy_claim_path)
            
        # Clean local static upload folder
        shutil.rmtree("uploads", ignore_errors=True)

