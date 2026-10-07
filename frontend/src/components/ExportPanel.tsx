import { useState } from "react";
import { exportIncidents, exportMetrics, exportRegions } from "../services/api";
import "./ExportPanel.css";

const metricFieldOptions = ["metricId", "region", "serviceName", "timestamp", "avgLatency", "errorRate", "uptime"];
const incidentFieldOptions = ["incidentId", "region", "serviceName", "severity", "status", "createdAt", "summary"];

export default function ExportPanel() {
  const [metricRegion, setMetricRegion] = useState("");
  const [metricServiceName, setMetricServiceName] = useState("");
  const [metricFields, setMetricFields] = useState<string[]>(["region", "serviceName", "timestamp", "avgLatency"]);

  const [incidentRegion, setIncidentRegion] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("");
  const [incidentStatus, setIncidentStatus] = useState("");
  const [incidentFields, setIncidentFields] = useState<string[]>(["incidentId", "region", "severity", "summary"]);

  const [metricTimeFrame, setMetricTimeFrame] = useState("last24Hours");
  const [incidentTimeFrame, setIncidentTimeFrame] = useState("last24Hours");

  function toggleField(field: string, selectedFields: string[], setSelectedFields: (fields: string[]) => void) {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  }

  async function handleExportMetrics() {
    const result = await exportMetrics({
      region: metricRegion,
      serviceName: metricServiceName,
      timeFrame: metricTimeFrame,
      fields: metricFields,
    });
    window.open(result.downloadUrl, "_blank");
  }

  async function handleExportIncidents() {
    const result = await exportIncidents({
      region: incidentRegion,
      severity: incidentSeverity,
      status: incidentStatus,
      timeFrame: metricTimeFrame,
      fields: incidentFields,
    });
    window.open(result.downloadUrl, "_blank");
  }

  async function handleExportRegions() {
    const result = await exportRegions();
    window.open(result.downloadUrl, "_blank");
  }

  return (
    <div className="card-body export-panel">
      {/* Metrics Export */}
      <div className="export-section">
        <div className="export-section-header">
          <span>Export Metrics</span>
        </div>
        <div className="export-fields-row">
          <input className="search-input" placeholder="Region (optional)" value={metricRegion} onChange={(e) => setMetricRegion(e.target.value)} />
          <input className="search-input" placeholder="Service name (optional)" value={metricServiceName} onChange={(e) => setMetricServiceName(e.target.value)} />
          <select className="filter-select" value={metricTimeFrame} onChange={(e) => setMetricTimeFrame(e.target.value)}>
            <option value="all">All time</option>
            <option value="lastHour">Last hour</option>
            <option value="last24Hours">Last 24 hours</option>
            <option value="last7Days">Last 7 days</option>
            <option value="last30Days">Last 30 days</option>
          </select>
        </div>
        <div className="export-checkboxes">
          {metricFieldOptions.map((field) => (
            <label key={field} className="export-checkbox-label">
              <input type="checkbox" className="export-checkbox" checked={metricFields.includes(field)} onChange={() => toggleField(field, metricFields, setMetricFields)} />
              <span>{field}</span>
            </label>
          ))}
        </div>
        <button className="export-btn" onClick={handleExportMetrics}>
          Export Metrics CSV
        </button>
      </div>

      {/* Incidents Export */}
      <div className="export-section">
        <div className="export-section-header">
          <span>Export Incidents</span>
        </div>
        <div className="export-fields-row">
          <input className="search-input" placeholder="Region (optional)" value={incidentRegion} onChange={(e) => setIncidentRegion(e.target.value)} />
          <input className="search-input" placeholder="Severity (optional)" value={incidentSeverity} onChange={(e) => setIncidentSeverity(e.target.value)} />
          <input className="search-input" placeholder="Status (optional)" value={incidentStatus} onChange={(e) => setIncidentStatus(e.target.value)} />
          <select className="filter-select" value={incidentTimeFrame} onChange={(e) => setIncidentTimeFrame(e.target.value)}>
            <option value="all">All time</option>
            <option value="lastHour">Last hour</option>
            <option value="last24Hours">Last 24 hours</option>
            <option value="last7Days">Last 7 days</option>
            <option value="last30Days">Last 30 days</option>
          </select>
        </div>
        <div className="export-checkboxes">
          {incidentFieldOptions.map((field) => (
            <label key={field} className="export-checkbox-label">
              <input type="checkbox" className="export-checkbox" checked={incidentFields.includes(field)} onChange={() => toggleField(field, incidentFields, setIncidentFields)} />
              <span>{field}</span>
            </label>
          ))}
        </div>
        <button className="export-btn" onClick={handleExportIncidents}>
          Export Incidents CSV
        </button>
      </div>

      {/* Regions Export */}
      <div className="export-section">
        <div className="export-section-header">
          <span>Export Region Summary</span>
        </div>
        <button className="export-btn" onClick={handleExportRegions}>
          Export Region Summary CSV
        </button>
      </div>
    </div>
  );
}
