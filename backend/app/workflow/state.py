from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict

class ClaimState(TypedDict):
    # Core identifiers
    claim_id: str
    policy_id: str
    customer_id: str
    policy_number: str
    
    # Document storage locations
    policy_pdf_url: str
    claim_pdf_url: str
    
    # 1. Document Extraction outputs
    extracted_claim: Dict[str, Any]      # Extracted patient name, treatment, claim amount, etc.
    extracted_policy: Dict[str, Any]     # Extracted policy holder name, base limit, etc.
    
    # 2. Policy Lookup RAG output
    retrieved_clauses: List[str]         # Policy clauses retrieved from Qdrant
    
    # 3. Customer Claims History
    customer_history: List[Dict[str, Any]] # Record of prior claims (amount, status, etc.)
    
    # 4. Coverage Calculator output
    coverage_math: Dict[str, Any]        # Calculated limits, consumed balances, and remaining amount
    
    # 5. Eligibility Decision output
    eligibility_verdict: Dict[str, Any]  # Decision dictionary (eligible: bool, reasoning: str)
    
    # 6. Recommendation Synthesis output
    ai_recommendation: Dict[str, Any]    # Synthesis recommendation (APPROVE, REJECT, MANUAL_REVIEW) + details
    
    # Human-in-the-Loop decision
    human_action: Optional[Dict[str, Any]] # {action: APPROVED/REJECTED, officer_id: str, notes: str}
    
    # Audit trail
    audit_logs: List[Dict[str, Any]]     # List of steps completed, tools used, and timestamps
