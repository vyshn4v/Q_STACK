import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, HelpCircle, Tag, Bot, Trophy, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SidebarNavigation: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        <div style={styles.navSectionLabel}>FEEDS & EXPLORE</div>

        {/* Home - Authenticated Only */}
        {isAuthenticated ? (
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              ...styles.navLink,
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? '#2563eb' : '#475569',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <Home size={18} />
            <span style={{ flexGrow: 1 }}>Home Feed</span>
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            style={styles.lockedNavLink}
            title="Sign in to access your personal Home feed"
          >
            <Home size={18} color="#94a3b8" />
            <span style={{ flexGrow: 1, textAlign: 'left' }}>Home Feed</span>
            <Lock size={13} color="#94a3b8" />
          </button>
        )}

        {/* Public Questions Feed - Accessible to all */}
        <NavLink
          to="/questions"
          style={({ isActive }) => ({
            ...styles.navLink,
            backgroundColor: isActive ? '#eff6ff' : 'transparent',
            color: isActive ? '#2563eb' : '#475569',
            fontWeight: isActive ? 600 : 500,
          })}
        >
          <HelpCircle size={18} />
          <span style={{ flexGrow: 1 }}>Questions</span>
        </NavLink>

        {/* Public Tags Directory - Accessible to all */}
        <NavLink
          to="/tags"
          style={({ isActive }) => ({
            ...styles.navLink,
            backgroundColor: isActive ? '#eff6ff' : 'transparent',
            color: isActive ? '#2563eb' : '#475569',
            fontWeight: isActive ? 600 : 500,
          })}
        >
          <Tag size={18} />
          <span style={{ flexGrow: 1 }}>Tags</span>
        </NavLink>

        {/* Leaderboard - Authenticated Only */}
        {isAuthenticated ? (
          <NavLink
            to="/leaderboard"
            style={({ isActive }) => ({
              ...styles.navLink,
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? '#2563eb' : '#475569',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <Trophy size={18} />
            <span style={{ flexGrow: 1 }}>Leaderboard</span>
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            style={styles.lockedNavLink}
            title="Sign in to access Developer Leaderboard"
          >
            <Trophy size={18} color="#94a3b8" />
            <span style={{ flexGrow: 1, textAlign: 'left' }}>Leaderboard</span>
            <Lock size={13} color="#94a3b8" />
          </button>
        )}

        {/* AI Chat - Authenticated Only */}
        {isAuthenticated ? (
          <NavLink
            to="/ai-chat"
            style={({ isActive }) => ({
              ...styles.navLink,
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? '#2563eb' : '#475569',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <Bot size={18} color="#2563eb" />
            <span style={{ flexGrow: 1 }}>AI Chat</span>
            <span style={styles.newBadge}>AI</span>
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            style={styles.lockedNavLink}
            title="Sign in to access AI Chat"
          >
            <Bot size={18} color="#94a3b8" />
            <span style={{ flexGrow: 1, textAlign: 'left' }}>AI Chat</span>
            <Lock size={13} color="#94a3b8" />
          </button>
        )}
      </nav>

      {/* Sidebar bottom card */}
      {isAuthenticated ? (
        <div style={styles.promoCard}>
          <div style={styles.promoIcon}>
            <Bot size={20} color="#2563eb" />
          </div>
          <strong style={styles.promoTitle}>Pinecone AI Search</strong>
          <p style={styles.promoDesc}>
            Ask any programming question and get answers synthesized from QStack knowledge.
          </p>
          <NavLink to="/ai-chat" style={styles.promoLink}>
            Try AI Chat →
          </NavLink>
        </div>
      ) : (
        <div style={styles.guestCard}>
          <strong style={styles.guestCardTitle}>Join QStack</strong>
          <p style={styles.guestCardDesc}>
            Sign in to ask questions, post answers, view leaderboards, and use AI features.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            style={styles.guestSignInBtn}
          >
            Sign In / Register
          </button>
        </div>
      )}
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  navSectionLabel: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#94a3b8',
    padding: '0.5rem 0.75rem',
    letterSpacing: '0.05em',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  lockedNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
  },
  newBadge: {
    fontSize: '0.625rem',
    fontWeight: 700,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    border: '1px solid #bfdbfe',
  },
  promoCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  promoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: '0.875rem',
    color: '#0f172a',
  },
  promoDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: 1.4,
  },
  promoLink: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#2563eb',
    textDecoration: 'none',
    marginTop: '0.25rem',
  },
  guestCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  guestCardTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  guestCardDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: 1.45,
  },
  guestSignInBtn: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};
