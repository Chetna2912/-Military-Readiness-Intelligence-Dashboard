
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const NAV = [
  ["overview", "Executive Overview"],
  ["readiness", "Operational Readiness"],
  ["equipment", "Equipment & Maintenance"],
  ["people", "Personnel & Training"],
  ["missions", "Missions & Incidents"],
  ["quality", "Data Quality"],
  ["alerts", "Alerts"],
  ["upload", "Upload & Review"],
];

const T: Record<string, string[]> = {
  readiness: ["units"],
  equipment: ["equipment", "maintenance"],
  people: ["personnel", "training"],
  missions: ["missions", "incidents", "logistics"],
};

const DATASETS = [
  "units",
  "personnel",
  "equipment",
  "maintenance",
  "training",
  "missions",
  "incidents",
  "logistics",
];

const get = async (path: string) => {
  const response = await fetch(API + path);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

function Table({
  rows,
  onRow,
}: {
  rows: any[];
  onRow?: (row: any) => void;
}) {
  if (!rows.length) return <div className="empty">No records.</div>;

  const columns = Object.keys(rows[0]);

  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={onRow ? "click" : ""}
              onClick={() => onRow?.(row)}
            >
              {columns.map((column) => (
                <td key={column}>{String(row[column] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("overview");
  const [summary, setSummary] = useState<any>();
  const [units, setUnits] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>();
  const [dataset, setDataset] = useState("units");
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<any>();
  const [file, setFile] = useState<File>();
  const [review, setReview] = useState<any>();
  const [mode, setMode] = useState("append");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [summaryData, unitsData, alertsData, metaData] =
        await Promise.all([
          get("/api/dashboard/summary"),
          get("/api/units"),
          get("/api/alerts"),
          get("/api/meta"),
        ]);

      setSummary(summaryData);
      setUnits(unitsData);
      setAlerts(alertsData);
      setMeta(metaData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (T[page]) {
      setDataset(T[page][0]);
    }
  }, [page]);

  useEffect(() => {
    if (!T[page] && page !== "quality") return;

    get(
      `/api/data/${dataset}?limit=100&offset=${offset}${
        search ? `&search=${encodeURIComponent(search)}` : ""
      }`,
    )
      .then(setRows)
      .catch((error) => {
        setMessage(
          error instanceof Error ? error.message : "Failed to load dataset",
        );
      });
  }, [page, dataset, offset, search]);

  const preview = async () => {
    if (!file) return;

    const form = new FormData();
    form.append("dataset", dataset);
    form.append("file", file);

    try {
      const response = await fetch(`${API}/api/upload/preview`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      setReview(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload preview failed");
    }
  };

  const commit = async () => {
    if (!file) return;

    const form = new FormData();
    form.append("dataset", dataset);
    form.append("mode", mode);
    form.append("file", file);

    try {
      const response = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail),
        );
        return;
      }

      setMessage(`Upload completed: ${data.rows_processed} rows`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const pageTitle =
    NAV.find((item) => item[0] === page)?.[1] || "Readiness Intelligence";

  let body: React.ReactNode;

  if (page === "overview") {
    const kpis = summary
      ? {
          "Overall Readiness": `${summary.overall_readiness}%`,
          "Personnel Strength": `${summary.personnel_strength}%`,
          "Equipment Availability": `${summary.equipment_availability}%`,
          "Training Completion": `${summary.training_completion}%`,
          "Active Missions": summary.active_missions,
          "Maintenance Backlog": summary.maintenance_backlog,
          "Critical Units": summary.critical_units,
          "Data Quality": `${summary.data_quality_score}%`,
        }
      : {};

    body = (
      <>
        <div className="kpis">
          {Object.entries(kpis).map(([key, value]) => (
            <div className="card kpi" key={key}>
              <small>{key}</small>
              <strong>{String(value)}</strong>
            </div>
          ))}
        </div>

        <div className="grid">
          <div className="card">
            <h2>Unit readiness ranking</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={units.slice(0, 12)}>
                <XAxis dataKey="unit_id" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="readiness_score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2>Priority alerts</h2>
            {alerts.map((alert, index) => (
              <div className="alert" key={index}>
                <b>{alert.entity}</b>
                <p>{alert.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Units</h2>
          <Table
            rows={units}
            onRow={async (row) =>
              setDetail(await get(`/api/units/${row.unit_id}`))
            }
          />
        </div>
      </>
    );
  } else if (page === "upload") {
    body = (
      <div className="upload">
        <div className="card">
          <h2>Upload & Review</h2>

          <label>
            Dataset
            <select
              value={dataset}
              onChange={(event) => {
                setDataset(event.target.value);
                setReview(undefined);
              }}
            >
              {DATASETS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>

          <label>
            CSV
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setFile(event.target.files?.[0])}
            />
          </label>

          <label>
            Mode
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="append">Append / Upsert</option>
              <option value="replace">Replace</option>
            </select>
          </label>

          <button onClick={preview} disabled={!file}>
            Validate & Preview
          </button>

          <button disabled={!review?.valid || !file} onClick={commit}>
            Commit Upload
          </button>
        </div>

        <div className="card">
          <h2>Review</h2>

          {review?.errors?.map((error: string, index: number) => (
            <p className="error" key={index}>
              {error}
            </p>
          ))}

          {review?.valid && (
            <p className="success">
              Validation passed • {review.row_count} rows
            </p>
          )}

          {review?.preview && <Table rows={review.preview} />}
        </div>
      </div>
    );
  } else {
    const tabs = T[page] || [];

    body = (
      <>
        <div className="toolbar">
          <div>
            {tabs.map((tab) => (
              <button
                key={tab}
                className={dataset === tab ? "selected" : ""}
                onClick={() => {
                  setDataset(tab);
                  setOffset(0);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div>
            <input
              placeholder="Search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOffset(0);
              }}
            />

            <button
              onClick={() =>
                window.open(`${API}/api/export/${dataset}`, "_blank")
              }
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="card">
          <h2>{page === "quality" ? "Data Quality" : pageTitle}</h2>

          {page === "quality" ? (
            <div className="gridcards">
              {meta?.datasets?.map((item: any) => (
                <div className="card" key={item.dataset}>
                  <b>{item.dataset}</b>
                  <strong>{item.records}</strong>
                  <small>{item.primary_key}</small>
                </div>
              ))}
            </div>
          ) : (
            <Table rows={page === "alerts" ? alerts : rows} />
          )}

          <div className="pager">
            <button
              disabled={!offset}
              onClick={() => setOffset(Math.max(0, offset - 100))}
            >
              Previous
            </button>

            <span>
              {offset + 1}–{offset + rows.length}
            </span>

            <button
              disabled={rows.length < 100}
              onClick={() => setOffset(offset + 100)}
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="app">
      <aside>
        <h1>
          READINESS
          <br />
          INTELLIGENCE
        </h1>

        {NAV.map(([key, label]) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => {
              setPage(key);
              setOffset(0);
              setSearch("");
            }}
          >
            {label}
          </button>
        ))}
      </aside>

      <main>
        <header>
          <div>
            <small>CONTROL ROOM / {page.toUpperCase()}</small>
            <h1>{pageTitle}</h1>
          </div>

          <button onClick={() => setPage("upload")}>⇧ Upload Data</button>
        </header>

        {body}

        <footer>
          Synthetic educational portfolio • All data is fictitious.
        </footer>
      </main>

      {detail && (
        <div className="modal" onClick={() => setDetail(null)}>
          <div className="modalbox" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setDetail(null)}>Close</button>

            <h2>{detail.unit.unit_name}</h2>

            <div className="gridcards">
              {[
                ["Readiness", `${detail.unit.readiness_score}%`],
                ["Personnel", detail.personnel.n],
                [
                  "Training",
                  `${Math.round(detail.personnel.training || 0)}%`,
                ],
                [
                  "Equipment",
                  `${Math.round(detail.equipment.availability || 0)}%`,
                ],
                ["Maintenance", detail.maintenance.n],
                ["Missions", detail.missions.n],
              ].map(([label, value]) => (
                <div className="card" key={label}>
                  <small>{label}</small>
                  <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="toast" onClick={() => setMessage("")}>
          {message}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
