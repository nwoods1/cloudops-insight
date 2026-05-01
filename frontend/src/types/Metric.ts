export interface Metric {
  metricId: string;
  region: string;
  serviceName: string;
  timestamp: string;
  avgLatency: number;
  errorRate: number;
  uptime: number;
}