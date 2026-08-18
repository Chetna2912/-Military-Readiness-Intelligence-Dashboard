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

const get = async (path: string) => {
  const response = await fetch(API + path);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};
