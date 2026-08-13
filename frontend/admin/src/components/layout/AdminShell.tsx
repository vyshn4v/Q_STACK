import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileText,
  Activity,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div style={styles.brandGroup}>
            <span style={styles.brandTitle}>QStack</span>
            <span style={styles.adminLabel}>Admin Console</span>
          </div>
          <span style={styles.envTag}>Production Ready</span>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.userProfile}>
            <div style={styles.avatarFallback}>
              {adminUser?.display_name ? adminUser.display_name[0].toUpperCase() : 'A'}
            </div>
            <div style={styles.userInfo}>
              <strong style={styles.userName}>{adminUser?.display_name}</strong>
              <span style={styles.roleBadge}>{adminUser?.role?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign out of Admin Console">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div style={styles.body}>
        {/* Sidebar Navigation */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/reports"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <ShieldAlert size={18} />
              <span>Moderation Queue</span>
            </NavLink>

            <NavLink
              to="/users"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <Users size={18} />
              <span>User Directory</span>
            </NavLink>

            <NavLink
              to="/content"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <FileText size={18} />
              <span>Content Control</span>
            </NavLink>

            <NavLink
              to="/observability"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <Activity size={18} />
              <span>System & Crons</span>
            </NavLink>
          </nav>

          <div style={styles.sidebarFooter}>
            <span style={styles.versionText}>QStack Engine v1.0.0</span>
          </div>
        </aside>

        {/* Content View */}
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    height: '64px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    borderBottom: '1px solid #1e293b',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
  },
  logoBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '1.0625rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  adminLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  envTag: {
    marginLeft: '0.5rem',
    fontSize: '0.6875rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    borderRadius: '12px',
    border: '1px solid #0284c7',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  avatarFallback: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.75rem',
  },
  userName: {
    color: '#ffffff',
  },
  roleBadge: {
    color: '#38bdf8',
    fontWeight: 600,
    fontSize: '0.6875rem',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.4rem 0.75rem',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  body: {
    display: 'flex',
    flexGrow: 1,
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  nav: {
    padding: '1.25rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    flexGrow: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
  },
  sidebarFooter: {
    padding: '1rem',
    borderTop: '1px solid #f1f5f9',
    textAlign: 'center',
  },
  versionText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  main: {
    flexGrow: 1,
    padding: '2rem',
    overflowY: 'auto',
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
};
