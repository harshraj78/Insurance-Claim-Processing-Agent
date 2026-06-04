from sqlmodel import SQLModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy import Column, JSON

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    role: str = Field(nullable=False) # 'claim_officer', 'customer'

class Policy(SQLModel, table=True):
    __tablename__ = "policies"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    policy_number: str = Field(unique=True, index=True, nullable=False)
    policy_holder: str = Field(nullable=False)
    coverage_limit: float = Field(nullable=False)
    document_url: str = Field(nullable=False)

class Claim(SQLModel, table=True):
    __tablename__ = "claims"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    customer_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    policy_number: str = Field(index=True, nullable=False)
    claim_amount: float = Field(nullable=False)
    status: str = Field(default="submitted", nullable=False) # 'submitted', 'pending_approval', 'approved', 'rejected'
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    claim_id: uuid.UUID = Field(foreign_key="claims.id", nullable=False)
    actor: str = Field(nullable=False) # 'system_agent_extract', 'human_officer_id', etc.
    action: str = Field(nullable=False)
    payload: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
