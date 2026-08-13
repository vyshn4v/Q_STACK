import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, HelpCircle, Tag, Bot, Trophy } from 'lucide-react';

export const SidebarNavigation: React.FC = () => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home, exact: true },
    { label: 'Questions', path: '/questions', icon: HelpCircle },
    { label: 'Tags', path: '/tags', icon: Tag },
    { label: 'AI Chat', path: '/ai-chat', icon: Bot, isNew: true },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        <div style={styles.navSectionLabel}>FEEDS & EXPLORE</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#475569',
                fontWeight: isActive ? 600 : 500,
              })}
            >
              <Icon size={18} />
              <span style={{ flexGrow: 1 }}>{item.label}</span>
              {item.isNew && <span style={styles.newBadge}>AI</span>}
            </NavLink>
          );
        })}
      </nav>

      <div style={styles.promoCard}>
        <div style={styles.promoIcon}>
          <Bot size={20} color="#2563eb" />
        </div>
        <strong style={styles.promoTitle}>Pinecone AI Search</strong>
        <p style={styles.promoDesc}>
          Ask any programming question and get real answers synthesized from QStack knowledge.
        </p>
        <NavLink to="/ai-chat" style={styles.promoLink}>
          Try AI Chat →
        </NavLink>
      </div>
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
};
