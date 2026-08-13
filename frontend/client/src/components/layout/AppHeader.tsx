import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Layers, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppHeader: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/questions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Brand Logo */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Layers size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div style={styles.logoText}>
            <span style={styles.logoMain}>QStack</span>
            <span style={styles.logoBadge}>PRO</span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <Search size={17} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search questions, tags, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </form>

        {/* Action Controls */}
        <div style={styles.actions}>
          <Link to="/ask" style={styles.askBtn}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Ask Question</span>
          </Link>

          {isAuthenticated && user ? (
            <div style={styles.userProfileWrapper}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={styles.avatarButton}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarFallback}>
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span style={styles.userDisplayName}>{user.displayName}</span>
                <span style={styles.userRepBadge}>{user.reputation}</span>
              </button>

              {isDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownHeader}>
                    <strong>{user.displayName}</strong>
                    <span style={styles.dropdownEmail}>{user.email}</span>
                    <span style={styles.dropdownRole}>Role: {user.role}</span>
                  </div>
                  <div style={styles.dropdownDivider} />
                  <Link
                    to={`/users/${user.id}`}
                    onClick={() => setIsDropdownOpen(false)}
                    style={styles.dropdownItem}
                  >
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>
                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <a
                      href="http://localhost:5174"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.dropdownItem}
                    >
                      <Shield size={16} color="#2563eb" />
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>Admin Panel</span>
                    </a>
                  )}
                  <div style={styles.dropdownDivider} />
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    style={styles.dropdownLogoutItem}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authButtons}>
              <button onClick={() => openAuthModal('login')} style={styles.loginBtn}>
                Sign In
              </button>
              <button onClick={() => openAuthModal('register')} style={styles.registerBtn}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1360px',
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  logoMain: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  logoBadge: {
    fontSize: '0.625rem',
    fontWeight: 800,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    border: '1px solid #bfdbfe',
  },
  searchForm: {
    flexGrow: 1,
    maxWidth: '600px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 1rem 0.5rem 2.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
    color: '#0f172a',
    transition: 'all 0.15s ease',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
  },
  askBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  loginBtn: {
    padding: '0.5rem 0.875rem',
    color: '#334155',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
  },
  registerBtn: {
    padding: '0.5rem 0.875rem',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
  },
  userProfileWrapper: {
    position: 'relative',
  },
  avatarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '8px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  avatarImg: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDisplayName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#334155',
  },
  userRepBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '220px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
    padding: '0.5rem',
    zIndex: 110,
  },
  dropdownHeader: {
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    fontSize: '0.8125rem',
    color: '#0f172a',
  },
  dropdownEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  dropdownRole: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#f1f5f9',
    margin: '0.375rem 0',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: '#334155',
    textDecoration: 'none',
  },
  dropdownLogoutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: '#ef4444',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
};
