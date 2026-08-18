# Military Readiness Intelligence Dashboard

A full-stack, synthetic-data dashboard for exploring military-style operational readiness, personnel strength, equipment availability, maintenance backlog, training completion, missions, incidents, logistics, alerts, and data quality.

> **Important:** This is an educational/portfolio application. All included data is synthetic and fictitious. It is not an operational military system and should not be used for real-world command, targeting, personnel, or security decisions.

## What the project does

The application combines a FastAPI backend, SQLite database, and React/Vite frontend into one deployable web application.

### Main dashboard sections

- **Executive Overview** — readiness KPIs, personnel strength, equipment availability, training completion, missions, maintenance backlog, critical units, and data-quality score.
- **Operational Readiness** — searchable unit-level readiness records and drill-down views.
- **Equipment & Maintenance** — equipment inventory plus maintenance records and backlog.
- **Personnel & Training** — personnel records and training completion/certification data.
- **Missions & Incidents** — mission, incident, and logistics views.
- **Data Quality** — dataset record counts, primary keys, and schema metadata.
- **Alerts** — critical-readiness alerts for units below the configured threshold.
- **Upload & Review** — CSV upload, schema validation, duplicate/blank primary-key checks, preview, append/upsert, and replace modes.

## Architecture

```text
Browser
  │
  ▼
React + Vite frontend
  │
  │ /api requests
  ▼
FastAPI backend
  │
  ├── Dashboard APIs
  ├── Dataset APIs
  ├── Search / pagination
  ├── CSV export
  └── Upload → validate → preview → commit
  │
  ▼
SQLite
data/generated/readiness.db
'''

## 🧰 Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Recharts
- CSS

**Backend**
- Python
- FastAPI
- Pydantic
- Uvicorn
- python-multipart

**Database**
- SQLite
- SQL

**Testing & Deployment**
- pytest
- Docker
- GitHub
- Hugging Face Spaces


## 🔄 Workflow

```text
CSV Data
   ↓
Upload & Review
   ↓
Validation
   ↓
Preview
   ↓
SQLite Database
   ↓
FastAPI API
   ↓
React Dashboard
   ↓
KPIs / Charts / Alerts / Export

## How to run
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
pytest -q
python -m uvicorn backend.app.main:app --reload

cd frontend
npm install
npm run dev
