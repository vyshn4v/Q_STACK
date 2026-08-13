import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Layers, User as UserIcon, LogOut, Shield, Bookmark, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const AppHeader: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/questions?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <header className="app-header" style={styles.header}>
      <div style={styles.container}>
        {/* Brand Logo */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Layers size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div style={styles.logoText}>
            <span style={styles.logoMain}>QStack</span>
            <span className="desktop-only" style={styles.logoBadge}>PRO</span>
          </div>
        </Link>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="desktop-search-form" style={styles.searchForm}>
          <Search size={16} style={styles.searchIcon} />
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
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            className="mobile-search-toggle"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            style={styles.iconBtn}
            aria-label="Search"
          >
            {isMobileSearchOpen ? <X size={18} color="#0f172a" /> : <Search size={18} color="#475569" />}
          </button>

          {/* Desktop Ask Question CTA */}
          <Link to="/ask" className="desktop-only" style={styles.askBtn}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Ask Question</span>
          </Link>

          {/* Realtime Notification Bell */}
          <NotificationBell />

          {isAuthenticated && user ? (
            <div style={styles.userProfileWrapper}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={styles.avatarButton}
                aria-label="User menu"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarFallback}>
                    {user.display_name ? user.display_name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="desktop-only" style={styles.userDisplayName}>
                  {user.display_name}
                </span>
                <span className="desktop-only" style={styles.userRepBadge}>
                  {user.reputation_total}
                </span>
              </button>

              {isDropdownOpen && (
                <>
                  <div style={styles.dropdownBackdrop} onClick={() => setIsDropdownOpen(false)} />
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownHeader}>
                      <strong>{user.display_name}</strong>
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
                    <Link
                      to="/bookmarks"
                      onClick={() => setIsDropdownOpen(false)}
                      style={styles.dropdownItem}
                    >
                      <Bookmark size={16} />
                      <span>Saved Bookmarks</span>
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
                </>
              )}
            </div>
          ) : (
            <div style={styles.authButtons}>
              <button onClick={() => openAuthModal('login')} style={styles.loginBtn}>
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="desktop-only"
                style={styles.registerBtn}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Expandible Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="mobile-search-bar" style={styles.mobileSearchBar}>
          <form onSubmit={handleSearch} style={styles.mobileSearchForm}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search questions, tags, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={styles.mobileSearchInput}
            />
          </form>
        </div>
      )}
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 'var(--header-height, 64px)',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1360px',
    margin: '0 auto',
    padding: '0 1rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    backgroundColor: '#2563eb',
    borderRadius: '7px',
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
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  logoBadge: {
    fontSize: '0.625rem',
    fontWeight: 800,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    border: '1px solid #bfdbfe',
  },
  searchForm: {
    flexGrow: 1,
    maxWidth: '520px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    margin: '0 0.5rem',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.45rem 1rem 0.45rem 2.35rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
    color: '#0f172a',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
  },
  askBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.45rem 0.875rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  loginBtn: {
    padding: '0.45rem 0.75rem',
    color: '#2563eb',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
  },
  registerBtn: {
    padding: '0.45rem 0.75rem',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  userProfileWrapper: {
    position: 'relative',
  },
  avatarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.2rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  avatarImg: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #e2e8f0',
  },
  avatarFallback: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDisplayName: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#334155',
  },
  userRepBadge: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
  },
  dropdownBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 105,
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
  mobileSearchBar: {
    padding: '0.5rem 1rem 0.75rem 1rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  mobileSearchForm: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  mobileSearchInput: {
    width: '100%',
    padding: '0.5rem 1rem 0.5rem 2.25rem',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
  },
};
