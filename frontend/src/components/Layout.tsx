import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { lastRefresh, loading, incidents, refresh } = useData();
  const { logoutUser } = useAuth();
  const navigate = useNavigate();

  const criticalCount = incidents.filter(i => i.severity === 'HIGH' && i.status === 'OPEN').length;
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function handleLogout() {
    logoutUser();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#818cf8" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6366f1" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="brand-name">CloudOps</div>
            <div className="brand-tagline">Insight</div>
          </div>
        </div>

        <div className="nav-section-label">Navigation</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><GridIcon /></span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/incidents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><AlertIcon /></span>
            <span>Incidents</span>
            {criticalCount > 0 && <span className="nav-badge">{criticalCount}</span>}
          </NavLink>
          <NavLink to="/metrics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><ActivityIcon /></span>
            <span>Metrics</span>
          </NavLink>
          <NavLink to="/regions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><GlobeIcon /></span>
            <span>Regions</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className={`status-dot ${loading ? 'syncing' : 'live'}`} />
          <div className="status-info">
            <span className="status-title">{loading ? 'Syncing…' : 'Live'}</span>
            <span className="status-time">Updated {fmt(lastRefresh)}</span>
          </div>
          <button className="refresh-btn" onClick={refresh} aria-label="Refresh data">
            <RefreshIcon />
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}