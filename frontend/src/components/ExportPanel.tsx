import { useState } from "react";
import { exportIncidents, exportMetrics, exportRegions } from "../services/api";

const metricFieldOptions = [
  "metricId",
  "region",
  "serviceName",
  "timestamp",
  "avgLatency",
  "errorRate",
  "uptime",
];

const incidentFieldOptions = [
  "incidentId",
  "region",
  "serviceName",
  "severity",
  "status",
  "createdAt",
  "summary",
];

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
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <h4>Export Metrics</h4>
        <input
          placeholder="Region"
          value={metricRegion}
          onChange={(e) => setMetricRegion(e.target.value)}
        />
        <input
          placeholder="Service Name"
          value={metricServiceName}
          onChange={(e) => setMetricServiceName(e.target.value)}
          style={{ marginLeft: "12px" }}
        />
        <select
          value={metricTimeFrame}
          onChange={(e) => setMetricTimeFrame(e.target.value)}
          style={{ marginLeft: "12px" }}
        >
          <option value="all">All time</option>
          <option value="lastHour">Last hour</option>
          <option value="last24Hours">Last 24 hours</option>
          <option value="last7Days">Last 7 days</option>
          <option value="last30Days">Last 30 days</option>
        </select>

        <div style={{ marginTop: "12px" }}>
          {metricFieldOptions.map((field) => (
            <label key={field} style={{ display: "inline-block", marginRight: "12px" }}>
              <input
                type="checkbox"
                checked={metricFields.includes(field)}
                onChange={() => toggleField(field, metricFields, setMetricFields)}
              />
              {field}
            </label>
          ))}
        </div>

        <button onClick={handleExportMetrics} style={{ marginTop: "12px" }}>
          Export Metrics CSV
        </button>
      </div>

      <div>
        <h4>Export Incidents</h4>
        <input
          placeholder="Region"
          value={incidentRegion}
          onChange={(e) => setIncidentRegion(e.target.value)}
        />
        <input
          placeholder="Severity"
          value={incidentSeverity}
          onChange={(e) => setIncidentSeverity(e.target.value)}
          style={{ marginLeft: "12px" }}
        />
        <input
          placeholder="Status"
          value={incidentStatus}
          onChange={(e) => setIncidentStatus(e.target.value)}
          style={{ marginLeft: "12px" }}
        />
        <select
          value={incidentTimeFrame}
          onChange={(e) => setIncidentTimeFrame(e.target.value)}
          style={{ marginLeft: "12px" }}
        >
          <option value="all">All time</option>
          <option value="lastHour">Last hour</option>
          <option value="last24Hours">Last 24 hours</option>
          <option value="last7Days">Last 7 days</option>
          <option value="last30Days">Last 30 days</option>
        </select>

        <div style={{ marginTop: "12px" }}>
          {incidentFieldOptions.map((field) => (
            <label key={field} style={{ display: "inline-block", marginRight: "12px" }}>
              <input
                type="checkbox"
                checked={incidentFields.includes(field)}
                onChange={() => toggleField(field, incidentFields, setIncidentFields)}
              />
              {field}
            </label>
          ))}
        </div>

        <button onClick={handleExportIncidents} style={{ marginTop: "12px" }}>
          Export Incidents CSV
        </button>
      </div>

      <div>
        <h4>Export Region Summary</h4>
        <button onClick={handleExportRegions}>Export Region Summary CSV</button>
      </div>
    </div>
  );
}