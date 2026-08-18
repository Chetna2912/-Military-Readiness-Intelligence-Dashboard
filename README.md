# Military Operations & Readiness Intelligence Dashboard — Full v2

Synthetic portfolio/educational project only. All data is fictitious.

## Run
```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
pytest -q
uvicorn backend.app.main:app --reload
```
In another terminal:
```bash
cd frontend
npm install
npm run dev
```

## Interactive modules
Every sidebar option is clickable: Executive Overview, Operational Readiness, Equipment & Maintenance, Personnel & Training, Missions & Incidents, Data Quality, Alerts, and Upload & Review.

## Upload
Select a dataset → choose CSV → Validate & Preview → review errors and sample rows → choose Append/Upsert or Replace → Commit Upload. The upload is persisted to SQLite and can be reviewed through the modules.

## API
`/health`, `/api/meta`, `/api/dashboard/summary`, `/api/units`, `/api/units/{unit_id}`, `/api/data/{dataset}`, `/api/alerts`, `/api/export/{dataset}`, `/api/upload/preview`, `/api/upload`.
