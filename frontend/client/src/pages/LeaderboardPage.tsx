import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { FollowButton } from '../components/common/FollowButton';
import { Trophy, Star, Award, Loader2, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api.getLeaderboard(50)
      .then((data) => setUsers(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div style={styles.authLockCard}>
          <div style={styles.lockIconWrapper}>
            <Lock size={32} color="#2563eb" />
          </div>
          <h2 style={styles.authLockTitle}>Sign in to View Developer Rankings</h2>
          <p style={styles.authLockDesc}>
            The community leaderboard, reputation scores, and badge leaderboards are available to registered members. Sign in to compare rankings and follow top engineers.
          </p>
          <div style={styles.authLockActions}>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              style={styles.signInBtn}
            >
              <LogIn size={16} />
              <span>Sign In to Access Leaderboard</span>
            </button>
            <Link to="/questions" style={styles.browseLink}>
              Browse Public Questions
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTitleRow}>
            <Trophy size={24} color="#f59e0b" />
            <h1 style={styles.title}>Developer Leaderboard</h1>
          </div>
          <p style={styles.subtitle}>
            Top developers recognized by the community for high-quality solutions, answers, and technical endorsements.
          </p>
        </div>

        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={32} style={styles.spinner} />
            <span>Loading leaderboard rankings...</span>
          </div>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            <Trophy size={40} color="#94a3b8" />
            <p>No developers on the leaderboard yet. Start asking and answering questions!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {users.map((user, index) => {
              const rank = index + 1;
              return (
                <div key={user.id} style={styles.userCard}>
                  {/* Rank */}
                  <div
                    style={{
                      ...styles.rankBadge,
                      backgroundColor:
                        rank === 1
                          ? '#fef08a'
                          : rank === 2
                          ? '#e2e8f0'
                          : rank === 3
                          ? '#fed7aa'
                          : '#f1f5f9',
                      color:
                        rank === 1
                          ? '#854d0e'
                          : rank === 2
                          ? '#334155'
                          : rank === 3
                          ? '#9a3412'
                          : '#64748b',
                    }}
                  >
                    <span>#{rank}</span>
                  </div>

                  {/* Avatar */}
                  <div style={styles.avatar}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} style={styles.avatarImg} />
                    ) : (
                      <span style={styles.avatarFallback}>
                        {user.display_name ? user.display_name[0].toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>

                  {/* Main Info */}
                  <div style={styles.info}>
                    <div style={styles.nameRow}>
                      <Link to={`/users/${user.id}`} style={styles.nameLink}>
                        {user.display_name}
                      </Link>
                      <span style={styles.roleBadge}>{user.role.replace('_', ' ')}</span>
                    </div>

                    <div style={styles.statsRow}>
                      <div style={styles.statItem}>
                        <Star size={13} color="#f59e0b" />
                        <span><strong>{user.reputation_total}</strong> rep</span>
                      </div>
                      <div style={styles.statItem}>
                        <Award size={13} color="#2563eb" />
                        <span>{user.questions_count || 0} questions</span>
                      </div>
                      <div style={styles.statItem}>
                        <span>{user.answers_count || 0} answers</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow Action */}
                  <div style={styles.actions}>
                    <FollowButton targetType="user" targetId={user.id} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.875rem',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s ease',
  },
  rankBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '0.875rem',
    flexShrink: 0,
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarFallback: {
    fontWeight: 800,
    fontSize: '1rem',
    color: '#2563eb',
  },
  info: {
    flexGrow: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  nameLink: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#0f172a',
    textDecoration: 'none',
  },
  roleBadge: {
    fontSize: '0.625rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  actions: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '4rem 1rem',
    color: '#64748b',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#2563eb',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    gap: '0.75rem',
    color: '#64748b',
  },
  authLockCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '4rem 1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    gap: '1rem',
    maxWidth: '520px',
    margin: '2rem auto',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  lockIconWrapper: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authLockTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  authLockDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  authLockActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    marginTop: '0.5rem',
  },
  signInBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  browseLink: {
    fontSize: '0.8125rem',
    color: '#64748b',
    textDecoration: 'none',
  },
};
