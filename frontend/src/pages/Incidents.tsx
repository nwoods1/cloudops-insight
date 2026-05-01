import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Legend, ResponsiveContainer,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import type { Incident } from '../types/Incident';
import './Incidents.css';

const TT_STYLE = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '13px' };

export default function Incidents() {
  const { incidents, loading } = useData();
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<Incident | null>(null);

  const filtered = useMemo(() => incidents.filter(i => {
    if (sevFilter !== 'ALL' && i.severity !== sevFilter) return false;
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.serviceName.toLowerCase().includes(q) || i.region.toLowerCase().includes(q) || i.incidentId.toLowerCase().includes(q);
    }
    return true;
  }), [incidents, search, sevFilter, statusFilter]);

  const stats = useMemo(() => ({
    total:  incidents.length,
    open:   incidents.filter(i => i.status === 'OPEN').length,
    high:   incidents.filter(i => i.severity === 'HIGH' && i.status === 'OPEN').length,
    closed: incidents.filter(i => i.status === 'CLOSED').length,
  }), [incidents]);

  const sevPie = useMemo(() => {
    const c: Record<string, number> = {};
    incidents.forEach(i => { c[i.severity] = (c[i.severity] || 0) + 1; });
    const colors: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6' };
    return Object.entries(c).map(([name, value]) => ({ name, value, fill: colors[name] ?? '#64748b' }));
  }, [incidents]);

  const regionBars = useMemo(() => {
    const c: Record<string, number> = {};
    incidents.filter(i => i.status === 'OPEN').forEach(i => { c[i.region] = (c[i.region] || 0) + 1; });
    return Object.entries(c)
      .map(([region, count]) => ({ region: region.split('-').slice(0,2).join('-'), count }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  const fmt = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading && !incidents.length) {
    return <div className="page-loader"><div className="spinner" /><span>Loading incidents…</span></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">Track, filter, and investigate system incidents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatChip label="Total" value={stats.total} color="default" />
        <StatChip label="Open"  value={stats.open}  color="warning" />
        <StatChip label="High Severity Open" value={stats.high}   color="danger" />
        <StatChip label="Closed" value={stats.closed} color="success" />
      </div>

      {/* Charts */}
      <div className="inc-charts-row">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Incidents by Severity</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sevPie} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value" />
                <Tooltip formatter={(v: number) => [v, 'incidents']} contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Open Incidents by Region</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionBars} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Open incidents']} contentStyle={TT_STYLE} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="filter-bar">
            <input
              className="search-input"
              placeholder="Search by ID, service, or region…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="filter-select" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
              <option value="ALL">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <span className="result-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Service</th>
                <th>Region</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No incidents match your filters</div></td></tr>
              ) : (
                filtered.map(inc => (
                  <tr
                    key={inc.incidentId}
                    className={`clickable${selected?.incidentId === inc.incidentId ? ' selected' : ''}`}
                    onClick={() => setSelected(s => s?.incidentId === inc.incidentId ? null : inc)}
                  >
                    <td className="td-primary">{inc.incidentId}</td>
                    <td>{inc.serviceName}</td>
                    <td>{inc.region}</td>
                    <td><span className={`sev-badge sev-badge--${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                    <td><span className={`status-chip status-chip--${inc.status.toLowerCase()}`}>{inc.status}</span></td>
                    <td style={{ color: 'var(--text-faint)', fontSize: 12 }}>{fmt(inc.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="detail-panel">
          <div className="detail-header">
            <div>
              <div className="detail-title">{selected.incidentId}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                <span className={`sev-badge sev-badge--${selected.severity.toLowerCase()}`}>{selected.severity}</span>
                {' '}&nbsp;<span className={`status-chip status-chip--${selected.status.toLowerCase()}`}>{selected.status}</span>
              </div>
            </div>
            <button className="detail-close" onClick={() => setSelected(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="detail-body">
            <div className="detail-field"><span className="detail-field-label">Region</span><span className="detail-field-value">{selected.region}</span></div>
            <div className="detail-field"><span className="detail-field-label">Service</span><span className="detail-field-value">{selected.serviceName}</span></div>
            <div className="detail-field"><span className="detail-field-label">Severity</span><span className="detail-field-value">{selected.severity}</span></div>
            <div className="detail-field"><span className="detail-field-label">Status</span><span className="detail-field-value">{selected.status}</span></div>
            <div className="detail-field"><span className="detail-field-label">Created</span><span className="detail-field-value">{new Date(selected.createdAt).toLocaleString()}</span></div>
            <div className="detail-field"><span className="detail-field-label">Source</span><span className="detail-field-value">{selected.source ?? 'system'}</span></div>
          </div>
          <div className="detail-summary">
            <div className="detail-summary-label">Summary</div>
            <div className="detail-summary-text">{selected.summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`kpi-card kpi-card--${color}`} style={{ gap: 12 }}>
      <div className="kpi-data">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}
