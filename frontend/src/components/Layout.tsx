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
          <div>
            <div className="brand-name">CloudOps</div>
            <div className="brand-tagline">Insight</div>
          </div>
        </div>

        <div className="nav-section-label">Navigation</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/incidents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>Incidents</span>
            {criticalCount > 0 && <span className="nav-badge">{criticalCount}</span>}
          </NavLink>
          <NavLink to="/metrics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>Metrics</span>
          </NavLink>
          <NavLink to="/regions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
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
            Refresh
          </button>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
