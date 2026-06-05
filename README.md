# Insurance Claim Processing Agent (HITL Multi-Agent System)

An enterprise-grade, human-in-the-loop (HITL) insurance claims validation and processing platform. This system utilizes a multi-agent workflow to ingest claim invoices, perform policy clause lookups via RAG, calculate eligibility limits, compile mathematical balances, and pause execution for human officer review.

Built using **LangGraph**, **FastAPI**, **React (Vite)**, **Qdrant Vector DB**, and **PostgreSQL/SQLite**.

---

## 🏗️ System Architecture

The platform consists of a modern decoupled architecture:
1. **Frontend (React)**: A glassmorphic dashboard built with Tailwind CSS/Vanilla CSS, featuring real-time claims queues, interactive audit review drawers, and detailed explainability panels.
2. **Backend API (FastAPI)**: REST endpoints managing claims lifecycles, user authentication, file uploads, and LangGraph workflow instances.
3. **Orchestration (LangGraph)**: A stateful, multi-node agent network with checkpoint-based state persistence to handle durable execution pauses.
4. **Vector Search (Qdrant)**: Stores and searches through policy documents using metadata filters to retrieve relevant clauses (waiting periods, exclusions).
5. **Relational Database (PostgreSQL/SQLite)**: Manages relational data for users, policies, claims history, and granular audit trails.

### Component Diagram

```mermaid
graph TD
    User([Claims Officer]) <-->|Interacts with UI| Frontend[React Single Page App]
    Frontend <-->|REST API / JSON| Backend[FastAPI Backend Gateway]
    Backend <-->|Durable Workflows| LangGraph[LangGraph Engine]
    LangGraph <-->|State Checkpoints| PostgreSQL[(PostgreSQL / SQLite)]
    LangGraph <-->|RAG Query| Qdrant[(Qdrant Vector Database)]
    LangGraph <-->|LLM Verification| Gemini[Google Gemini 2.5 Flash]
```

### Agent Workflow Diagram

The LangGraph workflow runs sequentially across specialized, single-responsibility nodes. It pauses at the **Human Review Barrier** to await officer feedback, resuming state seamlessly:

```mermaid
graph TD
    Start([Claim Submitted]) --> Ingestion[1. Ingestion & Extraction Node]
    Ingestion --> PolicyRAG[2. Policy Clause RAG Node]
    PolicyRAG --> ClaimHistory[3. Claim History Query Node]
    ClaimHistory --> BalanceCalc[4. Coverage Balance Calculator Node]
    BalanceCalc --> Verdict[5. Eligibility Verdict Node]
    Verdict --> Recommender[6. AI Recommender Node]
    Recommender --> Pause{State Interrupt Barrier}
    
    %% Human Action Flow
    Pause -->|Pauses & Persists State| Webhook[Awaiting Human Officer Action]
    Webhook -->|Resume with Approval/Rejection| Resume[7. Decision Update Node]
    Resume --> AuditCommit[8. Commit & Audit Log Node]
    AuditCommit --> End([Claim Processed])
```

---

## 📸 Interface Preview

### 1. Claims Operations Dashboard

![Claims Operations Dashboard](<img width="1889" height="837" alt="image" src="https://github.com/user-attachments/assets/674a325b-5bdb-4f0f-8a2b-ace385051810" />)

### 2. Human-in-the-Loop Verification Drawer

![Human Verification Panel](<img width="1795" height="858" alt="image" src="https://github.com/user-attachments/assets/e82936a3-c6f5-40a5-87ea-70cc8f6ca915" />)

---

## 🗄️ Database Schema

The system uses **SQLModel** (SQLAlchemy + Pydantic) to model relational data:

- **`User`**: Account info, password hashes, and user roles (`customer`, `officer`).
- **`Policy`**: Holds policy definitions, coverages, limits, and document links.
- **`Claim`**: Tracks claim details, invoice data, extracted values, AI verdicts, and current status (`Pending`, `Awaiting_Review`, `Approved`, `Rejected`).
- **`AuditLog`**: Logs chronological state transitions, execution actions, and officer notes for compliance.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Docker

### 1. Backend Setup
Navigate to the `backend` folder, set up a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=sqlite:///./claims.db
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=http://localhost:6333
```
> **Note**: If no `GEMINI_API_KEY` is provided, the backend automatically engages deterministic regex parsers and mock vector generators to allow running fully offline.

Start the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
Navigate to the `frontend` folder and install dependencies:
```bash
cd ../frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

---

## 🐳 Docker Deployment (All Services)

You can spin up the entire application stack—including Qdrant, the API, and the React frontend—using Docker Compose.

1. Ensure your root `.env` is configured.
2. Spin up the containers:
   ```bash
   docker-compose up --build
   ```
3. Open:
   - Frontend app: `http://localhost:3000`
   - Swagger API docs: `http://localhost:8000/docs`
   - Qdrant Dashboard: `http://localhost:6333/dashboard`

---

## 🧪 Automated Testing

Unit tests bypass external database setups and test the LangGraph workflow using an in-memory SQLite setup:
```bash
cd backend
pytest
```

---

## 🌐 Deploying to the Web
For detailed, step-by-step instructions on deploying the project for free (using **Neon PostgreSQL**, **Render**, and **Vercel**), refer to our [Deployment Guide](backend/../deployment_guide.md).
