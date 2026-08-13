import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { Bell, CheckCheck, Award, MessageSquare, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getNotifications(50);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
      );
    } catch {
      // Handled
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Handled
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medal.given':
        return <Award size={18} color="#eab308" />;
      case 'badge.awarded':
        return <Star size={18} color="#f59e0b" />;
      default:
        return <MessageSquare size={18} color="#2563eb" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div style={styles.authLockCard}>
          <Bell size={36} color="#2563eb" />
          <h2 style={styles.authLockTitle}>Sign in to view notifications</h2>
          <p style={styles.authLockDesc}>
            Stay updated when someone answers your question, comments on your code, or awards a medal.
          </p>
          <button onClick={() => openAuthModal('login')} style={styles.signInBtn}>
            Sign In to Access Notifications
          </button>
        </div>
      </AppShell>
    );
  }

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read_at) : notifications;

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Notification Center</h1>
            <p style={styles.subtitle}>
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={styles.markAllBtn}>
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filterRow}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterBtn,
              ...(filter === 'all' ? styles.filterBtnActive : {}),
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              ...styles.filterBtn,
              ...(filter === 'unread' ? styles.filterBtnActive : {}),
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={28} style={styles.spinner} />
            <span>Loading notifications...</span>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div style={styles.emptyState}>
            <Bell size={36} color="#94a3b8" />
            <h3>No notifications found</h3>
            <p>You have no {filter === 'unread' ? 'unread ' : ''}notifications at this time.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {displayedNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read_at && handleMarkSingleRead(n.id)}
                style={{
                  ...styles.notificationItem,
                  backgroundColor: !n.read_at ? '#eff6ff' : '#ffffff',
                  borderColor: !n.read_at ? '#bfdbfe' : '#e2e8f0',
                }}
              >
                <div style={styles.iconCol}>{getNotificationIcon(n.type)}</div>
                <div style={styles.contentCol}>
                  <p style={styles.itemText}>
                    {n.payload?.message || n.type.replace('.', ' ')}
                  </p>
                  {n.payload?.questionId && (
                    <Link
                      to={`/questions/${n.payload.questionId}`}
                      style={styles.itemLink}
                    >
                      View related discussion →
                    </Link>
                  )}
                  <span style={styles.itemTime}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                {!n.read_at && <div style={styles.unreadIndicator} />}
              </div>
            ))}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.875rem',
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
  markAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.875rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#2563eb',
    cursor: 'pointer',
  },
  filterRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterBtn: {
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  iconCol: {
    marginTop: '2px',
    flexShrink: 0,
  },
  contentCol: {
    flexGrow: 1,
  },
  itemText: {
    fontSize: '0.9375rem',
    color: '#1e293b',
    lineHeight: 1.5,
  },
  itemLink: {
    display: 'inline-block',
    marginTop: '0.25rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#2563eb',
    textDecoration: 'none',
  },
  itemTime: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.375rem',
  },
  unreadIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    marginTop: '6px',
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
    padding: '4rem 1.5rem',
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
  signInBtn: {
    padding: '0.625rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};
