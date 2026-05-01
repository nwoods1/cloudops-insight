export interface Incident {
  incidentId: string;
  region: string;
  serviceName: string;
  severity: string;
  status: string;
  createdAt: string;
  summary: string;
  source?: string;
}