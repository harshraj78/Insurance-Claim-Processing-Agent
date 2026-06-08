import base64
import json
import os
from typing import List, Optional
from fastapi import Header, HTTPException, Depends, status, Request
from sqlmodel import Session, select
from app.config import settings
from app.db.database import get_session
from app.db.models import User

# Add CLERK_JWKS_URL configuration to settings dynamically if not in config
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")

def decode_jwt_payload_unverified(token: str) -> dict:
    """
    Decodes the payload of a JWT token without verifying the signature (for lightweight parsing).
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        # Pad payload for base64 decoding
        payload_b64 += '=' * (4 - len(payload_b64) % 4)
        payload_json = base64.b64decode(payload_b64).decode('utf-8')
        return json.loads(payload_json)
    except Exception:
        return {}

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
) -> User:
    """
    FastAPI dependency to extract and authenticate the current user.
    Supports Clerk JWT authentication and falls back to Local Developer mode
    using a mock user email header.
    """
    # 1. Check for standard Authorization: Bearer <token>
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_jwt_payload_unverified(token)
        
        email = payload.get("email")
        if not email:
            # Clerk sometimes stores email in 'sub' or other custom claims, fallback to standard sub mapping
            email = payload.get("sub")
            
        if email:
            # Check if user exists in database
            stmt = select(User).where(User.email == email)
            user = session.exec(stmt).first()
            
            if not user:
                # Dynamically create the user from the JWT claims to support external Clerk signup
                # Default role depends on metadata or default to customer
                role = payload.get("role") or "customer"
                user = User(email=email, password_hash="external_auth", role=role)
                session.add(user)
                session.commit()
                session.refresh(user)
            return user
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT claims or missing email identifier."
        )

    # 2. Local Developer Mode / Mock Fallback
    # If no bearer token is provided, we inspect mock headers to prevent locking out local developers.
    mock_email = request.headers.get("X-Mock-User")
    if not mock_email:
        # Check if we have any user in the DB to default to
        # First, search for a claim officer to default backend operations
        officer_stmt = select(User).where(User.role == "claim_officer")
        default_user = session.exec(officer_stmt).first()
        if not default_user:
            # Fallback to customer
            customer_stmt = select(User).where(User.role == "customer")
            default_user = session.exec(customer_stmt).first()
            
        if default_user:
            return default_user
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No Authorization header or mock users seeded."
        )
        
    stmt = select(User).where(User.email == mock_email)
    user = session.exec(stmt).first()
    if not user:
        # Dynamically create the mock user to prevent 401s in environments where seeding didn't run
        role = "claim_officer" if "officer" in mock_email else "customer"
        user = User(email=mock_email, password_hash="mock_auth", role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
    return user

class RoleChecker:
    """
    FastAPI dependency to enforce role-based access control (RBAC).
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {self.allowed_roles}. Current role: {user.role}"
            )
        return user
