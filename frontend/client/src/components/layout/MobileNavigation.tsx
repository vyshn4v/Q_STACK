import React from 'react';
import { NavLink } from 'react-router-dom';
import { HelpCircle, Tag, PlusCircle, Trophy, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNavigation: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  return (
    <nav className="mobile-bottom-nav" style={styles.nav}>
      <NavLink
        to="/questions"
        style={({ isActive }) => ({
          ...styles.item,
          color: isActive ? '#2563eb' : '#64748b',
        })}
      >
        <HelpCircle size={20} />
        <span style={styles.label}>Questions</span>
      </NavLink>

      <NavLink
        to="/tags"
        style={({ isActive }) => ({
          ...styles.item,
          color: isActive ? '#2563eb' : '#64748b',
        })}
      >
        <Tag size={20} />
        <span style={styles.label}>Tags</span>
      </NavLink>

      {/* Center Ask CTA */}
      {isAuthenticated ? (
        <NavLink to="/ask" style={styles.askItem}>
          <div style={styles.askIconWrapper}>
            <PlusCircle size={22} color="#ffffff" />
          </div>
          <span style={{ ...styles.label, color: '#2563eb', fontWeight: 700 }}>Ask</span>
        </NavLink>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          style={styles.askItem}
        >
          <div style={styles.askIconWrapper}>
            <PlusCircle size={22} color="#ffffff" />
          </div>
          <span style={{ ...styles.label, color: '#2563eb', fontWeight: 700 }}>Ask</span>
        </button>
      )}

      {isAuthenticated ? (
        <NavLink
          to="/leaderboard"
          style={({ isActive }) => ({
            ...styles.item,
            color: isActive ? '#2563eb' : '#64748b',
          })}
        >
          <Trophy size={20} />
          <span style={styles.label}>Ranks</span>
        </NavLink>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          style={styles.item}
        >
          <Trophy size={20} color="#94a3b8" />
          <span style={styles.label}>Ranks</span>
        </button>
      )}

      {isAuthenticated && user ? (
        <NavLink
          to={`/users/${user.id}`}
          style={({ isActive }) => ({
            ...styles.item,
            color: isActive ? '#2563eb' : '#64748b',
          })}
        >
          <UserIcon size={20} />
          <span style={styles.label}>Profile</span>
        </NavLink>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          style={styles.item}
        >
          <UserIcon size={20} color="#94a3b8" />
          <span style={styles.label}>Sign In</span>
        </button>
      )}
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 900,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    padding: '0.25rem',
    minWidth: '54px',
    textDecoration: 'none',
    cursor: 'pointer',
    color: '#64748b',
  },
  askItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    padding: '0.25rem',
    minWidth: '54px',
    textDecoration: 'none',
    cursor: 'pointer',
    marginTop: '-12px',
  },
  askIconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
  },
  label: {
    fontSize: '0.6875rem',
    fontWeight: 600,
  },
};
