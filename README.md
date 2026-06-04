# Insurance Claim Processing Agent (HITL Multi-Agent System)

This repository implements an AI-powered, human-in-the-loop (HITL) insurance claims validation platform using **LangGraph**, **Qdrant Vector DB**, **FastAPI**, **PostgreSQL**, and **Google Gemini 2.5 Flash**.

---

## 🌟 Resume & Interview Positioning

### Elevator Pitch
> "I built an enterprise-grade AI claims assistant using LangGraph, RAG, and FastAPI. It parses medical invoices using Gemini 2.5 Flash, queries policy rules in Qdrant with specific policy payload isolation, computes mathematical balances via decoupled tool-driven graph nodes, and uses LangGraph's durable checkpointers to pause execution for human verification. The system details explainable reasoning paths and retrieved clauses in a claims officer dashboard before final action is taken."

### Key Bullet Points
*   **Architected a modular tool-driven claims engine** using **LangGraph** and **Gemini 2.5 Flash**, separating ingestion, RAG lookup, history queries, and calculators into discrete, single-responsibility graph nodes to update a unified state.
*   **Implemented a precision RAG retrieval system** with **Qdrant**, isolating search spaces using policy ID metadata filters to extract waiting period and exclusion rules.
*   **Created a durable Human-in-the-Loop approval architecture** using LangGraph state interrupts and PostgreSQL checkpointers, allowing long-running agent state pipelines to pause and resume asynchronously via FastAPI REST endpoints.
*   **Designed an AI Explainability Dashboard** in React that lists verified eligibility checklists and links retrieved policy clauses directly to AI recommendations, providing clear audit trails.

---

## 🏗️ Graph Orchestration Flow

Rather than using a single monolithic agent, the pipeline is split into modular tool-driven nodes executing sequentially:

```text
Document Ingestion & Extraction (Gemini 2.5 Flash parser)
             ↓
Policy Lookup RAG Node (Qdrant semantic search filtered by policy_id)
             ↓
Claim History Node (Query customer claims records in PostgreSQL)
             ↓
Coverage Calculator Node (Mathematical remaining balance boundaries)
             ↓
Eligibility Decision Node (Consolidate exclusions and waiting periods checks)
             ↓
Recommendation Node (AI synthesis of APPROVE / REJECT recommendation)
             ↓
[DURABLE STATE INTERRUPT BARRIER] (LangGraph state checkpointer pause)
             ↓
Human Claims Officer approval Action (UI action input resumes graph)
             ↓
Final PostgreSQL status commit and Audit Trail logging
```

---

## 🚀 Quick Start (Docker Orchestration)

Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine.

1.  **Configure environment variables**:
    Create a `.env` file in the root directory (or edit `backend/.env`):
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    *Note: If no API key is provided, the system falls back to a deterministic hashing mock vector generator and regex invoice parser so you can still run, test, and demo the entire pipeline offline.*

2.  **Start the containers**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the services**:
    *   **Frontend Dashboard**: `http://localhost:3000`
    *   **FastAPI API Swagger Docs**: `http://localhost:8000/docs`
    *   **Qdrant Vector Database Dashboard**: `http://localhost:6333/dashboard`

---

## 🧪 Running Automated Unit Tests

You can run automated tests using `pytest`. Tests bypass PostgreSQL/Qdrant servers using in-memory SQLite overrides and mock RAG vectors, ensuring 100% build validity offline.

1.  Create and activate a python environment:
    ```bash
    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run unit tests:
    ```bash
    pytest
    ```

---

## 📑 Manual Verification Workflow

1.  **Seeded Data**:
    On startup, the PostgreSQL database is automatically seeded with a test customer (`customer@example.com`), a claims officer (`officer@example.com`), and two mock active policies:
    *   `POL-1001` (Limit: ₹500,000)
    *   `POL-1002` (Limit: ₹250,000)

2.  **Upload Invoice & Bill (Vite Dashboard)**:
    *   Navigate to `http://localhost:3000`.
    *   Select **Submit Claim Request**.
    *   Enter Policy Number `POL-1001`, claim amount `45000` and attach any PDF.
    *   Click **Initialize AI Agents Pipeline**.

3.  **Perform Audit**:
    *   Click **Audit Review** on the newly submitted claim in the queue.
    *   Review the **Ingestion Attributes** and the **AI Explainability & Reasoning Panel** (RAG retrieved clauses, waiting periods checks, remaining balance limits math).
    *   Add your verification notes in the review form and click **Approve Claim**.
    *   Verify the status resolves to `Approved` in the dashboard queue.
