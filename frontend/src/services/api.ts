const BASE_URL = "http://localhost:8080/api";

export async function fetchMetrics() {
  const response = await fetch(`${BASE_URL}/metrics`);
  if (!response.ok) {
    throw new Error("Failed to fetch metrics");
  }
  return response.json();
}

export async function fetchIncidents() {
  const response = await fetch(`${BASE_URL}/incidents`);
  if (!response.ok) {
    throw new Error("Failed to fetch incidents");
  }
  return response.json();
}

export async function fetchRegionSummaries() {
  const response = await fetch(`${BASE_URL}/regions/summary`);
  if (!response.ok) {
    throw new Error("Failed to fetch region summaries");
  }
  return response.json();
}

export async function sendChatQuestion(question: string) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Failed to get chat response");
  }

  return response.json();
}

export async function exportIncidents(filters?: {
  region?: string;
  severity?: string;
  status?: string;
  timeFrame?: string;
  fields?: string[];
}) {
  const response = await fetch("http://localhost:8080/api/exports/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filters || {}),
  });

  if (!response.ok) {
    throw new Error("Failed to export incidents");
  }

  return response.json();
}

export async function exportMetrics(filters?: {
  region?: string;
  serviceName?: string;
  timeFrame?: string;
  fields?: string[];
}) {
  const response = await fetch("http://localhost:8080/api/exports/metrics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filters || {}),
  });

  if (!response.ok) {
    throw new Error("Failed to export metrics");
  }

  return response.json();
}

export async function exportRegions() {
  const response = await fetch("http://localhost:8080/api/exports/regions", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to export region summaries");
  }

  return response.json();
}