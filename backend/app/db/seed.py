from sqlmodel import Session, select
from app.db.database import engine
from app.db.models import User, Policy

def seed_database():
    with Session(engine) as session:
        # Check if users already exist
        statement = select(User)
        existing_users = session.exec(statement).first()
        
        if not existing_users:
            print("Seeding initial users...")
            customer = User(
                email="customer@example.com",
                password_hash="mock_hash_customerpass123", # simple placeholder for portfolio simplicity
                role="customer"
            )
            officer = User(
                email="officer@example.com",
                password_hash="mock_hash_officerpass123",
                role="claim_officer"
            )
            session.add(customer)
            session.add(officer)
            session.commit()
            print("Users seeded.")
        
        # Check if policies exist
        statement = select(Policy)
        existing_policies = session.exec(statement).first()
        
        if not existing_policies:
            print("Seeding initial policies...")
            pol1 = Policy(
                policy_number="POL-1001",
                policy_holder="John Doe",
                coverage_limit=500000.0,
                document_url="policies/POL-1001.pdf"
            )
            pol2 = Policy(
                policy_number="POL-1002",
                policy_holder="Jane Smith",
                coverage_limit=250000.0,
                document_url="policies/POL-1002.pdf"
            )
            session.add(pol1)
            session.add(pol2)
            session.commit()
            print("Policies seeded.")

if __name__ == "__main__":
    from app.db.database import init_db
    init_db()
    seed_database()
