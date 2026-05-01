import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMetrics, fetchIncidents, fetchRegionSummaries } from '../services/api';
import type { Metric } from '../types/Metric';
import type { Incident } from '../types/Incident';
import type { RegionSummary } from '../types/RegionSummary';

interface DataContextType {
  metrics: Metric[];
  incidents: Incident[];
  regions: RegionSummary[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date;
  refresh: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = async () => {
    try {
      setError(null);
      const [m, i, r] = await Promise.all([
        fetchMetrics(),
        fetchIncidents(),
        fetchRegionSummaries(),
      ]);
      setMetrics([...m].sort((a: Metric, b: Metric) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      setIncidents([...i].sort((a: Incident, b: Incident) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setRegions(r);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider value={{ metrics, incidents, regions, loading, error, lastRefresh, refresh: loadData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
