# Free Deployment Guide for Insurance Claim Processing Agent

This guide walks you through deploying your React frontend, FastAPI backend, and PostgreSQL database for **100% free** using modern cloud hosting platforms.

---

## Architecture Overview

```mermaid
graph LR
    User[Web Browser] -->|Accesses UI| Frontend[Vercel / Netlify]
    Frontend -->|API Requests| Backend[Render / Koyeb]
    Backend -->|Reads/Writes| Database[Neon PostgreSQL]
    Backend -->|Mock or Cloud API| Gemini[Google Gemini API]
```

---

## Step 1: Database (Neon PostgreSQL)
Since local SQLite databases reset their storage on free-tier containers every time the server restarts, we will use **Neon** for a free, persistent PostgreSQL database.

1. Go to [Neon.tech](https://neon.tech/) and sign up for a free account.
2. Create a new project (name it `insurance-claims`).
3. Select **PostgreSQL 16** (or latest) and your preferred region.
4. Copy the connection string from the Neon dashboard. It will look like this:
   ```env
   postgresql://alex:AbCdEf123456@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Keep this connection string safe for Step 2.

---

## Step 2: Backend Deployment (Render or Koyeb)

You can use either **Render** or **Koyeb** to host your FastAPI app. Render is highly popular and easy to configure.

### Option A: Deploying on Render (Web Service)
1. Sign up at [Render.com](https://render.com/) and connect your GitHub account.
2. Click **New +** and select **Web Service**.
3. Select your repository `Insurance-Claim-Processing-Agent`.
4. Configure the service settings:
   - **Name**: `claims-processing-backend`
   - **Environment**: `Python 3` (or Docker if you prefer using the backend's Dockerfile)
   - **Region**: Select the region closest to your Neon database.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
   - **Instance Type**: **Free**
5. Click **Advanced** to add **Environment Variables**:
   | Key | Value | Note |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *Your Neon Connection String* | Ensure it starts with `postgresql://` (or `postgres://`) |
   | `GEMINI_API_KEY` | *Your Gemini API Key* | Optional. If empty, backend uses local deterministic mock |
   | `MODEL_PROVIDER` | `google` | Optional |
   | `MODEL_NAME` | `gemini-2.5-flash` | Optional |
6. Click **Deploy Web Service**. Render will build and launch your backend. Once deployed, note down the backend URL (e.g., `https://claims-processing-backend.onrender.com`).

---

## Step 3: Frontend Deployment (Vercel)

Vercel is the easiest and fastest platform for hosting React single-page apps (SPAs) built with Vite.

1. Go to [Vercel.com](https://vercel.com/) and sign up using GitHub.
2. Click **Add New** -> **Project**.
3. Import your repository `Insurance-Claim-Processing-Agent`.
4. Configure project settings:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: *Your Render/Koyeb Backend URL* (e.g., `https://claims-processing-backend.onrender.com`)
6. Click **Deploy**. Vercel will build your static files and deploy them. Once complete, you will receive a production URL (e.g., `https://insurance-claim-processing.vercel.app`).

---

## Verification & Post-Deployment Checklist

1. **Cold Starts**: Render's free tier spins down after 15 minutes of inactivity. When you visit the app after a long break, the first request might take 40-50 seconds to complete while the container wakes up.
2. **CORS Configuration**: The FastAPI backend is configured to accept requests from all origins by default (via `CORSMiddleware` in `app/main.py`), so you won't face CORS issues when the frontend requests the backend.
3. **Database Migration**: The application's `init_db()` function automatically creates all required tables (`User`, `Policy`, `Claim`, `AuditLog`) in the PostgreSQL database on startup.
