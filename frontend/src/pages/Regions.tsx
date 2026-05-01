import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import './Regions.css';

const TT_STYLE = {
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  fontSize: '13px',
  background: '#162033',
  color: '#e2eaf8',
};

function healthScore(avgLatency: number, activeIncidents: number, uptime: number) {
  let s = 100;
  if (avgLatency > 200) s -= 25; else if (avgLatency > 100) s -= 10;
  if (activeIncidents > 5) s -= 30; else if (activeIncidents > 2) s -= 15;
  if (uptime < 99) s -= 25; else if (uptime < 99.5) s -= 10;
  return Math.max(0, s);
}

export default function Regions() {
  const { regions, incidents, loading } = useData();

  const enriched = useMemo(() => regions.map(r => {
    const score = healthScore(r.avgLatency, r.activeIncidents, r.uptime);
    const level = score >= 80 ? 'healthy' : score >= 55 ? 'warning' : 'critical';
    const totalInc = incidents.filter(i => i.region === r.region).length;
    return { ...r, score, level, totalInc };
  }), [regions, incidents]);

  const comparisonData = useMemo(() => enriched.map(r => ({
    name: r.region.split('-').slice(0, 2).join('-'),
    latency: Math.round(r.avgLatency),
    uptime: +r.uptime.toFixed(2),
    incidents: r.activeIncidents,
    score: r.score,
  })), [enriched]);

  const radarData = useMemo(() => {
    if (!enriched.length) return [];
    const maxLat = Math.max(...enriched.map(r => r.avgLatency));
    const maxInc = Math.max(...enriched.map(r => r.activeIncidents), 1);
    return [
      { metric: 'Health Score', ...Object.fromEntries(enriched.map(r => [r.region.split('-').slice(0,2).join('-'), r.score])) },
      { metric: 'Uptime %',    ...Object.fromEntries(enriched.map(r => [r.region.split('-').slice(0,2).join('-'), r.uptime])) },
      { metric: 'Low Latency', ...Object.fromEntries(enriched.map(r => [r.region.split('-').slice(0,2).join('-'), Math.round((1 - r.avgLatency / maxLat) * 100)])) },
      { metric: 'Low Incidents',...Object.fromEntries(enriched.map(r => [r.region.split('-').slice(0,2).join('-'), Math.round((1 - r.activeIncidents / maxInc) * 100)])) },
    ];
  }, [enriched]);

  const RADAR_COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

  if (loading && !regions.length) {
    return <div className="page-loader"><div className="spinner" /><span>Loading regions…</span></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Regions</h1>
          <p className="page-subtitle">Health scores and performance breakdown by AWS region</p>
        </div>
      </div>

      {/* Region cards */}
      <div className="region-cards-grid">
        {enriched.map(r => (
          <div key={r.region} className={`region-card region-card--${r.level}`}>
            <div className="region-card-top">
              <div className="region-card-name">{r.region}</div>
              <div className={`region-health-badge region-health-badge--${r.level}`}>
                {r.level.charAt(0).toUpperCase() + r.level.slice(1)}
              </div>
            </div>

            <div className="region-score-ring">
              <svg viewBox="0 0 80 80" className="ring-svg">
                <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" className="ring-track" />
                <circle
                  cx="40" cy="40" r="32" fill="none" strokeWidth="6"
                  strokeDasharray={`${(r.score / 100) * 201} 201`}
                  strokeLinecap="round"
                  className={`ring-fill ring-fill--${r.level}`}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="ring-label">
                <span className="ring-value">{r.score}</span>
                <span className="ring-sub">score</span>
              </div>
            </div>

            <div className="region-card-stats">
              <div className="rc-stat">
                <span className="rc-stat-val">{r.avgLatency.toFixed(0)}ms</span>
                <span className="rc-stat-label">Avg Latency</span>
              </div>
              <div className="rc-stat">
                <span className="rc-stat-val">{r.uptime.toFixed(1)}%</span>
                <span className="rc-stat-label">Uptime</span>
              </div>
              <div className="rc-stat">
                <span className={`rc-stat-val ${r.activeIncidents > 0 ? 'rc-stat-val--warn' : ''}`}>{r.activeIncidents}</span>
                <span className="rc-stat-label">Active Incidents</span>
              </div>
              <div className="rc-stat">
                <span className="rc-stat-val">{r.totalInc}</span>
                <span className="rc-stat-label">Total Incidents</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="reg-charts-row">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Region Comparison</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="lat" orientation="left"  tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} unit="ms" />
                <YAxis yAxisId="inc" orientation="right" tick={{ fontSize: 11, fill: '#3d5574' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#7a93b5' }} />
                <Bar yAxisId="lat" dataKey="latency"   name="Avg Latency (ms)"  fill="#22d3ee" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar yAxisId="inc" dataKey="incidents" name="Active Incidents"   fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {enriched.length >= 2 && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Radar: Region Profile</h3></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#7a93b5' }} />
                  {enriched.slice(0, 6).map((r, i) => (
                    <Radar
                      key={r.region}
                      name={r.region.split('-').slice(0,2).join('-')}
                      dataKey={r.region.split('-').slice(0,2).join('-')}
                      stroke={RADAR_COLORS[i]}
                      fill={RADAR_COLORS[i]}
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                    />
                  ))}
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#7a93b5' }} />
                  <Tooltip contentStyle={TT_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Summary table */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Region Summary</h3></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Health Score</th>
                <th>Avg Latency</th>
                <th>Uptime</th>
                <th>Active Incidents</th>
                <th>Total Incidents</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map(r => (
                <tr key={r.region}>
                  <td className="td-primary">{r.region}</td>
                  <td>
                    <div className="score-bar-wrap">
                      <div className="score-bar-track">
                        <div className={`score-bar-fill score-bar-fill--${r.level}`} style={{ width: `${r.score}%` }} />
                      </div>
                      <span className="score-bar-val">{r.score}</span>
                    </div>
                  </td>
                  <td>{r.avgLatency.toFixed(0)}ms</td>
                  <td>{r.uptime.toFixed(2)}%</td>
                  <td>{r.activeIncidents}</td>
                  <td>{r.totalInc}</td>
                  <td><span className={`region-health-badge region-health-badge--${r.level}`}>{r.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
