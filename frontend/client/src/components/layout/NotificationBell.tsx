import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, MessageSquare, Award, Star } from 'lucide-react';
import type { AppNotification } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications(8);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling fallback for socket
    return () => clearInterval(interval);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medal.given':
        return <Award size={16} color="#eab308" />;
      case 'badge.awarded':
        return <Star size={16} color="#f59e0b" />;
      default:
        return <MessageSquare size={16} color="#2563eb" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={styles.bellBtn}
        aria-label="Notifications"
      >
        <Bell size={19} color="#475569" />
        {unreadCount > 0 && <span style={styles.unreadDot}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div style={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div style={styles.dropdown}>
            <div style={styles.header}>
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={styles.markReadBtn}
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div style={styles.list}>
              {notifications.length === 0 ? (
                <div style={styles.empty}>No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      ...styles.item,
                      backgroundColor: !n.read_at ? '#eff6ff' : '#ffffff',
                    }}
                  >
                    <div style={styles.iconWrapper}>{getNotificationIcon(n.type)}</div>
                    <div style={styles.content}>
                      <p style={styles.text}>
                        {n.payload?.message || n.type.replace('.', ' ')}
                      </p>
                      <span style={styles.time}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={styles.footer}>
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                style={styles.viewAllLink}
              >
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  bellBtn: {
    position: 'relative',
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
  unreadDot: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '0.625rem',
    fontWeight: 700,
    minWidth: '16px',
    height: '16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '44px',
    width: '320px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    zIndex: 999,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.875rem',
  },
  markReadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: {
    maxHeight: '320px',
    overflowY: 'auto',
  },
  empty: {
    padding: '2rem 1rem',
    textAlign: 'center',
    fontSize: '0.8125rem',
    color: '#94a3b8',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.8125rem',
  },
  iconWrapper: {
    marginTop: '2px',
    flexShrink: 0,
  },
  content: {
    flexGrow: 1,
  },
  text: {
    color: '#1e293b',
    lineHeight: 1.4,
  },
  time: {
    fontSize: '0.6875rem',
    color: '#94a3b8',
    marginTop: '0.25rem',
    display: 'block',
  },
  footer: {
    padding: '0.625rem 1rem',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
  },
  viewAllLink: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#2563eb',
    textDecoration: 'none',
  },
};
