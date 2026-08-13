import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  Clock,
  UserX,
  Play,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { adminApi, isAbortError } from '../api/client';
import type { AdminStats } from '../api/client';
import { AdminShell } from '../components/layout/AdminShell';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  const loadStats = (signal?: AbortSignal) => {
    setIsLoading(true);
    adminApi.getStats(signal)
      .then((data) => {
        if (!signal?.aborted) setStats(data);
      })
      .catch((err) => {
        if (!isAbortError(err)) {
          // Handled
        }
      })
      .finally(() => {
        if (!signal?.aborted) setIsLoading(false);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadStats(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const handleTriggerCron = async () => {
    if (isRunningCron) return;
    setIsRunningCron(true);
    setCronMessage(null);

    try {
      const res = await adminApi.triggerNightlyCron();
      setCronMessage(`Cron job executed successfully! Processed ${res.eventsProcessed} events, updated ${res.usersUpdated} users, awarded ${res.badgesAwarded} badges.`);
      loadStats();
    } catch (err: any) {
      setCronMessage(`Cron error: ${err.message}`);
    } finally {
      setIsRunningCron(false);
    }
  };

  return (
    <AdminShell>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.title}>System Overview</h1>
            <p style={styles.subtitle}>
              Real-time platform metrics, moderation volume, and infrastructure signals.
            </p>
          </div>

          <button
            onClick={handleTriggerCron}
            disabled={isRunningCron}
            style={styles.cronBtn}
          >
            {isRunningCron ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Play size={16} />
            )}
            <span>{isRunningCron ? 'Running 1am Cron Pipeline...' : 'Trigger Nightly Cron Now'}</span>
          </button>
        </div>

        {cronMessage && (
          <div style={styles.alertCard}>
            <CheckCircle size={18} color="#059669" />
            <span>{cronMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div style={styles.loadingBox}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span>Loading platform statistics...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <Users size={22} />
                </div>
                <div>
                  <span style={styles.kpiValue}>{stats?.total_users || 0}</span>
                  <span style={styles.kpiLabel}>Total Registered Developers</span>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <span style={styles.kpiValue}>{stats?.active_questions || 0}</span>
                  <span style={styles.kpiLabel}>Active Questions</span>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                  <MessageSquare size={22} />
                </div>
                <div>
                  <span style={styles.kpiValue}>{stats?.active_answers || 0}</span>
                  <span style={styles.kpiLabel}>Peer-Reviewed Answers</span>
                </div>
              </div>

              <div style={{ ...styles.kpiCard, borderColor: stats?.pending_reports ? '#fecaca' : '#e2e8f0' }}>
                <div style={{ ...styles.kpiIcon, backgroundColor: '#fef2f2', color: '#dc2626' }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <span style={{ ...styles.kpiValue, color: stats?.pending_reports ? '#dc2626' : '#0f172a' }}>
                    {stats?.pending_reports || 0}
                  </span>
                  <span style={styles.kpiLabel}>Pending Reports Requiring Review</span>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, backgroundColor: '#fefce8', color: '#ca8a04' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <span style={styles.kpiValue}>{stats?.completed_cron_runs || 0}</span>
                  <span style={styles.kpiLabel}>Completed Nightly Cron Jobs</span>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, backgroundColor: '#f8fafc', color: '#64748b' }}>
                  <UserX size={22} />
                </div>
                <div>
                  <span style={styles.kpiValue}>{stats?.banned_users || 0}</span>
                  <span style={styles.kpiLabel}>Banned / Suspended Accounts</span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div style={styles.sectionsGrid}>
              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>Moderation Priority</h3>
                <p style={styles.sectionDesc}>
                  Review community flags with 3-tier escalation (Moderator &rarr; Admin &rarr; Super Admin).
                </p>
                <Link to="/reports" style={styles.sectionLink}>
                  Open Moderation Queue ({stats?.pending_reports || 0} pending) &rarr;
                </Link>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>User Directory & Permissions</h3>
                <p style={styles.sectionDesc}>
                  Manage developer accounts, inspect activity scores, ban bad actors, or promote administrators.
                </p>
                <Link to="/users" style={styles.sectionLink}>
                  Manage Users & Roles &rarr;
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  cronBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
    fontSize: '0.875rem',
    color: '#065f46',
  },
  loadingBox: {
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#64748b',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  kpiIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
    display: 'block',
    lineHeight: 1.2,
  },
  kpiLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.125rem',
  },
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  sectionCard: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1.0625rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  sectionDesc: {
    fontSize: '0.8125rem',
    color: '#64748b',
    lineHeight: 1.5,
    flexGrow: 1,
  },
  sectionLink: {
    marginTop: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#2563eb',
    textDecoration: 'none',
  },
};
