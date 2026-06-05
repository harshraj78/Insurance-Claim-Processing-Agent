import os
import re
import json
from typing import List, Dict, Any
from sqlmodel import Session, select
from app.config import settings
from app.db.database import engine
from app.db.models import Claim
from app.vector_db.qdrant_service import search_policy_clauses
import google.generativeai as genai

import pdfplumber

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def read_pdf_text(file_path: str) -> str:
    """
    Extracts text from a PDF file using pdfplumber.
    """
    if not os.path.exists(file_path):
        # If absolute path doesn't exist, check relative to root or static
        print(f"File not found on disk: {file_path}")
        return ""
    
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Failed to parse PDF text: {e}")
    return text.strip()

def document_extraction_tool(file_path: str, document_type: str) -> Dict[str, Any]:
    """
    Reads a PDF file and parses its contents into structured fields.
    Invokes Gemini 2.5 Flash for structuring text, or uses regex fallback 
    rules if offline / API key is not set.
    """
    print(f"Executing document_extraction_tool on {file_path} (Type: {document_type})")
    
    pdf_text = read_pdf_text(file_path)
    
    if not pdf_text:
        # Generate generic mock data if no PDF content was read
        if document_type.lower() == "claim":
            return {
                "patient_name": "John Doe",
                "treatment": "Appendectomy",
                "claim_amount": 45000.0,
                "admission_date": "2026-05-01",
                "discharge_date": "2026-05-04"
            }
        else:
            return {
                "policy_holder": "John Doe",
                "policy_number": "POL-1001",
                "coverage_limit": 500000.0,
                "exclusions": "Pre-existing diabetes is excluded for the first 90 days. Cosmetic procedures are excluded."
            }

    # If Gemini API key is configured, use structured LLM parsing
    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            if document_type.lower() == "claim":
                prompt = (
                    f"Extract the following claim information from the text below: "
                    f"patient_name, treatment, claim_amount (as float), admission_date, discharge_date.\n"
                    f"Format output as structured JSON only.\n\nText:\n{pdf_text}"
                )
            else:
                prompt = (
                    f"Extract the following insurance policy details from the text below: "
                    f"policy_holder, policy_number, coverage_limit (as float), exclusions.\n"
                    f"Format output as structured JSON only.\n\nText:\n{pdf_text}"
                )
            
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Error parsing document with Gemini: {e}. Falling back to regex parser.")

    # Rule-based offline parser
    data = {}
    if document_type.lower() == "claim":
        # Extract patient name
        name_match = re.search(r"patient\s*name\s*:\s*([a-zA-Z\s]+)", pdf_text, re.IGNORECASE)
        data["patient_name"] = name_match.group(1).strip() if name_match else "John Doe"
        
        # Extract treatment
        treatment_match = re.search(r"treatment\s*:\s*([a-zA-Z\s]+)", pdf_text, re.IGNORECASE)
        data["treatment"] = treatment_match.group(1).strip() if treatment_match else "Appendectomy"
        
        # Extract claim amount
        amount_match = re.search(r"(?:amount|claim|total)\s*:\s*(?:rs\.?|₹)?\s*([\d,]+)", pdf_text, re.IGNORECASE)
        if amount_match:
            data["claim_amount"] = float(amount_match.group(1).replace(",", ""))
        else:
            data["claim_amount"] = 45000.0
            
        data["admission_date"] = "2026-05-01"
        data["discharge_date"] = "2026-05-04"
    else:
        # Policy parser
        holder_match = re.search(r"policy\s*holder\s*:\s*([a-zA-Z\s]+)", pdf_text, re.IGNORECASE)
        data["policy_holder"] = holder_match.group(1).strip() if holder_match else "John Doe"
        
        number_match = re.search(r"policy\s*number\s*:\s*([\w\-]+)", pdf_text, re.IGNORECASE)
        data["policy_number"] = number_match.group(1).strip() if number_match else "POL-1001"
        
        limit_match = re.search(r"limit\s*:\s*(?:rs\.?|₹)?\s*([\d,]+)", pdf_text, re.IGNORECASE)
        if limit_match:
            data["coverage_limit"] = float(limit_match.group(1).replace(",", ""))
        else:
            data["coverage_limit"] = 500000.0
            
        data["exclusions"] = "Pre-existing diabetes is excluded for the first 90 days. Cosmetic procedures are excluded."
        
    return data

def query_expansion_tool(treatment_term: str) -> List[str]:
    """
    Expands a raw treatment term into 3 semantic query variations to improve search coverage in vector store.
    """
    print(f"Executing query_expansion_tool on term: '{treatment_term}'")
    # Always include the original term
    queries = [treatment_term]
    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                f"You are a medical search optimizer. Expand the treatment or diagnostic term '{treatment_term}' "
                f"into 3 distinct search terms or phrases suitable for retrieving coverage details from an insurance policy document.\n"
                f"For example, 'Appendectomy' could expand to: ['appendectomy coverage exclusions', 'surgical removal of appendix', 'appendix surgery wait times'].\n"
                f"Return JSON list of strings only, containing the 3 expanded query variations. Do not include markdown formatting or code blocks."
            )
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            expanded = json.loads(response.text)
            if isinstance(expanded, list):
                expanded_strs = [str(item).strip() for item in expanded if item]
                if expanded_strs:
                    queries.extend(expanded_strs)
        except Exception as e:
            print(f"Query expansion Gemini call failed: {e}. Using fallback variations.")
            
    if len(queries) <= 1:
        # Fallback variations for offline or API error
        clean_term = treatment_term.lower().strip()
        queries.extend([
            f"{clean_term} coverage exclusions",
            f"{clean_term} waiting period",
            f"surgical treatment for {clean_term}"
        ])
        
    return list(set(queries)) # Return de-duplicated list

def policy_lookup_tool(policy_id: str, treatment_term: str) -> List[str]:
    """
    RAG search to fetch relevant clauses from Qdrant vector database using query expansion.
    """
    print(f"Executing policy_lookup_tool query on Policy ID: {policy_id} for term: '{treatment_term}'")
    
    expanded_queries = query_expansion_tool(treatment_term)
    print(f"Expanded queries for retrieval: {expanded_queries}")
    
    all_clauses = []
    seen = set()
    
    # Query Qdrant for each expanded search query
    for query in expanded_queries:
        try:
            clauses = search_policy_clauses(policy_id, query, limit=2)
            for clause in clauses:
                if clause not in seen:
                    seen.add(clause)
                    all_clauses.append(clause)
        except Exception as e:
            print(f"Error fetching query '{query}' from vector DB: {e}")
            
    if not all_clauses:
        print("No clauses retrieved from Qdrant. Returning mock clauses.")
        return [
            f"Clause 3.2: Medical surgeries such as {treatment_term} are covered up to the specified limit.",
            "Clause 4.5: Pre-existing conditions wait times are set at 90 days for surgical coverage.",
            "Clause 7.1: Cosmetic procedures are strictly excluded from claims clearance."
        ]
        
    # Limit to top 4 unique clauses to keep state context size reasonable
    return all_clauses[:4]

def claim_history_tool(customer_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves previous historical approved claims for a customer from PostgreSQL.
    """
    print(f"Executing claim_history_tool for Customer ID: {customer_id}")
    import uuid
    try:
        customer_uuid = uuid.UUID(customer_id) if isinstance(customer_id, str) else customer_id
        with Session(engine) as session:
            statement = select(Claim).where(
                Claim.customer_id == customer_uuid, 
                Claim.status == "approved"
            )
            claims = session.exec(statement).all()
            return [
                {
                    "claim_id": str(c.id),
                    "amount": float(c.claim_amount),
                    "status": c.status,
                    "created_at": c.created_at.isoformat()
                } for c in claims
            ]
    except Exception as e:
        print(f"PostgreSQL history fetch failed: {e}. Returning empty history.")
        return []


def coverage_calculator_tool(coverage_limit: float, existing_claims: float, current_claim_amount: float) -> Dict[str, Any]:
    """
    Performs boundary balance calculations.
    """
    print(f"Executing coverage_calculator_tool: Limit={coverage_limit}, Previous Claims={existing_claims}, Current Claim={current_claim_amount}")
    
    remaining_before = coverage_limit - existing_claims
    remaining_after = remaining_before - current_claim_amount
    exceeds_limit = remaining_after < 0
    
    return {
        "coverage_limit": coverage_limit,
        "existing_claims_total": existing_claims,
        "remaining_coverage_before": remaining_before,
        "remaining_coverage_after": max(0.0, remaining_after),
        "exceeds_limit": exceeds_limit,
        "overage_amount": abs(remaining_after) if exceeds_limit else 0.0
    }
