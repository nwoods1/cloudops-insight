import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ResponsiveContainer,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import type { Metric } from '../types/Metric';
import './Metrics.css';

const TT_STYLE = {
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  fontSize: '13px',
  background: '#162033',
  color: '#e2eaf8',
};

export default function Metrics() {
  const { metrics, loading } = useData();
  const [selected, setSelected] = useState<Metric | null>(null);

  const stats = useMemo(() => {
    if (!metrics.length) return { avgLatency: 0, avgUptime: 0, avgError: 0 };
    const avgLatency = metrics.reduce((s, m) => s + m.avgLatency, 0) / metrics.length;
    const avgUptime  = metrics.reduce((s, m) => s + m.uptime, 0)    / metrics.length;
    const avgError   = metrics.reduce((s, m) => s + m.errorRate, 0) / metrics.length;
    return { avgLatency: Math.round(avgLatency), avgUptime: avgUptime.toFixed(2), avgError: avgError.toFixed(2) };
  }, [metrics]);

  const latencyByRegion = useMemo(() => {
    const acc: Record<string, { sum: number; count: number }> = {};
    metrics.forEach(m => {
      if (!acc[m.region]) acc[m.region] = { sum: 0, count: 0 };
      acc[m.region].sum   += m.avgLatency;
      acc[m.region].count += 1;
    });
    return Object.entries(acc).map(([region, { sum, count }]) => ({
      region: region.split('-').slice(0, 2).join('-'),
      latency: Math.round(sum / count),
    })).sort((a, b) => b.latency - a.latency);
  }, [metrics]);

  const errorByService = useMemo(() => {
    const acc: Record<string, { sum: number; count: number }> = {};
    metrics.forEach(m => {
      if (!acc[m.serviceName]) acc[m.serviceName] = { sum: 0, count: 0 };
      acc[m.serviceName].sum   += m.errorRate;
      acc[m.serviceName].count += 1;
    });
    return Object.entries(acc).map(([service, { sum, count }]) => ({
      service: service.length > 14 ? service.slice(0, 14) + '…' : service,
      errorRate: +(sum / count).toFixed(2),
    })).sort((a, b) => b.errorRate - a.errorRate).slice(0, 10);
  }, [metrics]);

  const uptimeTrend = useMemo(() =>
    metrics.slice(0, 30).reverse().map((m, i) => ({
      t: i,
      uptime: +m.uptime.toFixed(2),
      latency: Math.round(m.avgLatency),
    })), [metrics]);

  const fmt = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading && !metrics.length) {
    return <div className="page-loader"><div className="spinner" /><span>Loading metrics…</span></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Metrics</h1>
          <p className="page-subtitle">Performance data across all services and regions</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card kpi-card--info">
          <div className="kpi-icon-wrap"><LatIcon /></div>
          <div className="kpi-data"><div className="kpi-value">{stats.avgLatency}ms</div><div className="kpi-label">Avg Latency</div></div>
        </div>
        <div className="kpi-card kpi-card--success">
          <div className="kpi-icon-wrap"><UptIcon /></div>
          <div className="kpi-data"><div className="kpi-value">{stats.avgUptime}%</div><div className="kpi-label">Avg Uptime</div></div>
        </div>
        <div className="kpi-card kpi-card--danger">
          <div className="kpi-icon-wrap"><ErrIcon /></div>
          <div className="kpi-data"><div className="kpi-value">{stats.avgError}%</div><div className="kpi-label">Avg Error Rate</div></div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="met-charts-row">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Avg Latency by Region</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={latencyByRegion} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip formatter={(value) => [`${value ?? 0}ms`, "Avg Latency"]} contentStyle={TT_STYLE} />
                <Bar dataKey="latency" fill="#22d3ee" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Avg Error Rate by Service</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={errorByService} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="service" tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(value) => [`${value ?? 0}%`, "Uptime"]} contentStyle={TT_STYLE} />
                <Bar dataKey="errorRate" fill="#f87171" radius={[0,4,4,0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3 className="card-title">Uptime &amp; Latency Trend (recent samples)</h3></div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={uptimeTrend} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="uptimeG"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="latencyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis yAxisId="up"  orientation="left"  tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} unit="%" domain={['auto','auto']} width={40} />
              <YAxis yAxisId="lat" orientation="right" tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} unit="ms" domain={['auto','auto']} width={48} />
              <Tooltip contentStyle={TT_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#7a93b5' }} />
              <Area yAxisId="up"  type="monotone" dataKey="uptime"  name="Uptime (%)"   stroke="#34d399" strokeWidth={2} fill="url(#uptimeG)"  dot={false} />
              <Area yAxisId="lat" type="monotone" dataKey="latency" name="Latency (ms)"  stroke="#22d3ee" strokeWidth={2} fill="url(#latencyG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Metrics</h3>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{metrics.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Service</th>
                <th>Latency</th>
                <th>Error Rate</th>
                <th>Uptime</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No metrics available</div></td></tr>
              ) : (
                metrics.map(m => (
                  <tr
                    key={m.metricId}
                    className={`clickable${selected?.metricId === m.metricId ? ' selected' : ''}`}
                    onClick={() => setSelected(s => s?.metricId === m.metricId ? null : m)}
                  >
                    <td className="td-primary">{m.region}</td>
                    <td>{m.serviceName}</td>
                    <td>
                      <span className={`met-val ${m.avgLatency > 200 ? 'met-val--bad' : m.avgLatency > 100 ? 'met-val--warn' : 'met-val--ok'}`}>
                        {m.avgLatency}ms
                      </span>
                    </td>
                    <td>
                      <span className={`met-val ${m.errorRate > 5 ? 'met-val--bad' : m.errorRate > 2 ? 'met-val--warn' : 'met-val--ok'}`}>
                        {m.errorRate}%
                      </span>
                    </td>
                    <td>
                      <span className={`met-val ${m.uptime < 99 ? 'met-val--bad' : m.uptime < 99.5 ? 'met-val--warn' : 'met-val--ok'}`}>
                        {m.uptime}%
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-faint)', fontSize: 12 }}>{fmt(m.timestamp)}</td>
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
            <div className="detail-title">{selected.metricId}</div>
            <button className="detail-close" onClick={() => setSelected(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="detail-body">
            <div className="detail-field"><span className="detail-field-label">Region</span><span className="detail-field-value">{selected.region}</span></div>
            <div className="detail-field"><span className="detail-field-label">Service</span><span className="detail-field-value">{selected.serviceName}</span></div>
            <div className="detail-field"><span className="detail-field-label">Avg Latency</span><span className="detail-field-value">{selected.avgLatency}ms</span></div>
            <div className="detail-field"><span className="detail-field-label">Error Rate</span><span className="detail-field-value">{selected.errorRate}%</span></div>
            <div className="detail-field"><span className="detail-field-label">Uptime</span><span className="detail-field-value">{selected.uptime}%</span></div>
            <div className="detail-field"><span className="detail-field-label">Timestamp</span><span className="detail-field-value">{new Date(selected.timestamp).toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function LatIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function UptIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function ErrIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }
