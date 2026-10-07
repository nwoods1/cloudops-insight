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

const SEV_COLORS: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fbbf24', LOW: '#60a5fa' };
const TT_STYLE = {
  borderRadius: '0px',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  fontSize: '13px',
  background: 'rgba(42,32,90,0.92)',
  color: '#e2eaf8',
};

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
        <KpiCard label="Total Incidents" value={stats.total} color="default" />
        <KpiCard label="Open Incidents"  value={stats.open}  color="warning" />
        <KpiCard label="High Severity"   value={stats.high}  color="danger" />
        <KpiCard label="Avg Latency"     value={`${stats.avgLatency}ms`} color="info" />
        <KpiCard label="Avg Uptime"      value={`${stats.avgUptime}%`}   color="success" />
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
                <Tooltip formatter={(value) => [value ?? 0, "incidents"]} contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#c7c2e8' }} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8d85bf' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8d85bf' }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip formatter={(value) => [`${value ?? 0}ms`, "Avg Latency"]} contentStyle={TT_STYLE} />
                <Bar dataKey="latency" fill="#22d3ee" radius={[4,4,0,0]} maxBarSize={40} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#8d85bf' }} axisLine={false} tickLine={false} unit="%" width={40} />
                <Tooltip formatter={(value) => [`${value ?? 0}%`, "Uptime"]} contentStyle={TT_STYLE} />
                <Area type="monotone" dataKey="uptime" stroke="#34d399" strokeWidth={2} fill="rgba(52,211,153,0.12)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="db-bottom-row">
        <div className="db-left-col">
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
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">AI Ops Assistant</h3>
            </div>
            <ChatPanel />
          </div>

          <div className="card">
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

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-data">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}
