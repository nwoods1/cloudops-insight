import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import './Dashboard.css';
import ChatPanel from "../components/ChatPanel";
import ExportPanel from "../components/ExportPanel";

const SEV_COLORS: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6' };
const TT_STYLE = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: '13px' };

export default function Dashboard() {
  const { metrics, incidents, regions, loading } = useData();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const open = incidents.filter(i => i.status === 'OPEN');
    const high = open.filter(i => i.severity === 'HIGH');
    const avgLat = metrics.length ? metrics.reduce((s, m) => s + m.avgLatency, 0) / metrics.length : 0;
    const avgUp  = metrics.length ? metrics.reduce((s, m) => s + m.uptime, 0) / metrics.length : 0;
    return { total: incidents.length, open: open.length, high: high.length, avgLatency: Math.round(avgLat), avgUptime: avgUp.toFixed(1) };
  }, [incidents, metrics]);

  const severityPie = useMemo(() => {
    const c: Record<string, number> = {};
    incidents.filter(i => i.status === 'OPEN').forEach(i => { c[i.severity] = (c[i.severity] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value, fill: SEV_COLORS[name] ?? '#64748b' }));
  }, [incidents]);

  const regionBars = useMemo(() =>
    regions.map(r => ({
      name: r.region.replace(/^(us|eu|ap|sa|ca|me|af)-/, '$1-').split('-').slice(0, 2).join('-'),
      latency: Math.round(r.avgLatency),
      uptime: +r.uptime.toFixed(2),
      incidents: r.activeIncidents,
    })), [regions]);

  const uptimeTrend = useMemo(() =>
    metrics.slice(0, 20).reverse().map((m, i) => ({
      t: i,
      uptime: +m.uptime.toFixed(2),
      latency: Math.round(m.avgLatency),
    })), [metrics]);

  const healthScore = (r: typeof regions[0]) => {
    let s = 100;
    if (r.avgLatency > 200) s -= 25; else if (r.avgLatency > 100) s -= 10;
    if (r.activeIncidents > 5) s -= 30; else if (r.activeIncidents > 2) s -= 15;
    if (r.uptime < 99) s -= 25; else if (r.uptime < 99.5) s -= 10;
    return Math.max(0, s);
  };

  if (loading && !incidents.length) {
    return <div className="page-loader"><div className="spinner" /><span>Loading dashboard…</span></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time system overview and key performance indicators</p>
        </div>
        {stats.high > 0 && (
          <button className="alert-banner" onClick={() => navigate('/incidents')}>
            <span className="alert-pulse" />
            {stats.high} critical incident{stats.high > 1 ? 's' : ''} need attention
            <span>→</span>
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="Total Incidents" value={stats.total} color="default" icon={<FileIcon />} />
        <KpiCard label="Open Incidents"  value={stats.open}  color="warning" icon={<BellIcon />} />
        <KpiCard label="High Severity"   value={stats.high}  color="danger"  icon={<WarnIcon />} />
        <KpiCard label="Avg Latency"     value={`${stats.avgLatency}ms`} color="info"    icon={<ClockIcon />} />
        <KpiCard label="Avg Uptime"      value={`${stats.avgUptime}%`}   color="success" icon={<CheckIcon />} />
      </div>

      {/* Charts row */}
      <div className="db-charts-row">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Open Incidents by Severity</h3>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={severityPie} cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={3} dataKey="value" />
                <Tooltip formatter={(v: number) => [v, 'incidents']} contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card db-chart-wide">
          <div className="card-header">
            <h3 className="card-title">Avg Latency by Region</h3>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={regionBars} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip formatter={(v: number) => [`${v}ms`, 'Avg Latency']} contentStyle={TT_STYLE} />
                <Bar dataKey="latency" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card db-chart-full">
          <div className="card-header">
            <h3 className="card-title">Uptime Trend (recent metrics)</h3>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={uptimeTrend} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" width={40} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Uptime']} contentStyle={TT_STYLE} />
                <Area type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} fill="url(#uptimeGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="db-bottom-row">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Incidents</h3>
            <button className="card-action" onClick={() => navigate('/incidents')}>View all →</button>
          </div>
          <div className="feed-list">
            {incidents.slice(0, 7).map(inc => (
              <div key={inc.incidentId} className="feed-item" onClick={() => navigate('/incidents')}>
                <span className={`sev-dot sev-dot--${inc.severity.toLowerCase()}`} />
                <div className="feed-item-body">
                  <span className="feed-item-primary">{inc.serviceName}</span>
                  <span className="feed-item-secondary">{inc.region}</span>
                </div>
                <div className="feed-item-right">
                  <span className={`status-chip status-chip--${inc.status.toLowerCase()}`}>{inc.status}</span>
                  <span className={`sev-badge sev-badge--${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                </div>
              </div>
            ))}
            {incidents.length === 0 && <p className="empty-state">No incidents found</p>}
          </div>
        <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <h3 className="card-title">AI Ops Assistant</h3>
        </div>
        <ChatPanel />
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <h3 className="card-title">Exports</h3>
        </div>
        <ExportPanel />
      </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Region Health</h3>
            <button className="card-action" onClick={() => navigate('/regions')}>View all →</button>
          </div>
          <div className="region-health-list">
            {regions.map(r => {
              const score = healthScore(r);
              const level = score >= 80 ? 'healthy' : score >= 55 ? 'warning' : 'critical';
              return (
                <div key={r.region} className="rh-row" onClick={() => navigate('/regions')}>
                  <div className={`rh-indicator rh-indicator--${level}`} />
                  <span className="rh-name">{r.region}</span>
                  <div className="rh-meta">
                    <span className="rh-stat">{r.avgLatency.toFixed(0)}ms</span>
                    <span className="rh-stat">{r.uptime.toFixed(1)}%</span>
                    <span className={`rh-score rh-score--${level}`}>{score}</span>
                  </div>
                </div>
              );
            })}
            {regions.length === 0 && <p className="empty-state">No region data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-icon-wrap">{icon}</div>
      <div className="kpi-data">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function FileIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function BellIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function WarnIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function ClockIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function CheckIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
