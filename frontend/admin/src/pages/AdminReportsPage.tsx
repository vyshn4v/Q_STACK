import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../api/client';
import type { AdminReport } from '../api/client';
import { AdminShell } from '../components/layout/AdminShell';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminReportsPage: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [activeTab]);

  const loadReports = () => {
    setIsLoading(true);
    let statusFilter: string | undefined = undefined;
    if (activeTab === 'pending') {
      statusFilter = undefined; // Will get open reports
    } else if (activeTab === 'moderator') {
      statusFilter = 'moderator_review';
    } else if (activeTab === 'admin') {
      statusFilter = 'admin_review';
    } else if (activeTab === 'super_admin') {
      statusFilter = 'super_admin_review';
    } else if (activeTab === 'resolved') {
      statusFilter = 'resolved';
    }

    adminApi.getReports({ status: statusFilter, limit: 50 })
      .then((data) => setReports(data.reports || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const handleEscalate = async (reportId: string) => {
    const reason = window.prompt('Enter escalation reason or context for higher-tier review:');
    if (reason === null) return;

    setActionLoadingId(reportId);
    try {
      await adminApi.escalateReport(reportId, reason);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to escalate report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (reportId: string, targetType: string, targetId: string) => {
    const action = window.prompt(
      'Enter resolution action taken (e.g. "Soft-deleted content and warned user"):',
      'Content removed and policy enforced',
    );
    if (!action) return;

    setActionLoadingId(reportId);
    try {
      // If target is question or answer, offer to soft delete
      if (['question', 'answer'].includes(targetType) && window.confirm('Would you also like to soft-delete the offending post immediately?')) {
        await adminApi.softDeleteContent(targetType as 'question' | 'answer', targetId);
      }

      await adminApi.resolveReport(reportId, action);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismiss = async (reportId: string) => {
    const reason = window.prompt('Enter dismissal justification:', 'Reviewed — Content adheres to community guidelines.');
    if (!reason) return;

    setActionLoadingId(reportId);
    try {
      await adminApi.dismissReport(reportId, reason);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminShell>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Moderation & Escalation Queue</h1>
            <p style={styles.subtitle}>
              Review user-flagged content across questions, answers, comments, and developer accounts.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div style={styles.tabsBar}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{ ...styles.tabBtn, ...(activeTab === 'pending' ? styles.tabBtnActive : {}) }}
          >
            All Active Reports
          </button>
          <button
            onClick={() => setActiveTab('moderator')}
            style={{ ...styles.tabBtn, ...(activeTab === 'moderator' ? styles.tabBtnActive : {}) }}
          >
            Moderator Tier
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            style={{ ...styles.tabBtn, ...(activeTab === 'admin' ? styles.tabBtnActive : {}) }}
          >
            Admin Tier
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('super_admin')}
              style={{ ...styles.tabBtn, ...(activeTab === 'super_admin' ? styles.tabBtnActive : {}) }}
            >
              Super Admin Review
            </button>
          )}
          <button
            onClick={() => setActiveTab('resolved')}
            style={{ ...styles.tabBtn, ...(activeTab === 'resolved' ? styles.tabBtnActive : {}) }}
          >
            Completed & Dismissed
          </button>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div style={styles.loadingBox}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span>Fetching moderation reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div style={styles.emptyState}>
            <CheckCircle size={36} color="#16a34a" />
            <strong style={{ fontSize: '1.125rem', color: '#0f172a' }}>All Clear!</strong>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              No pending reports in this queue.
            </p>
          </div>
        ) : (
          <div style={styles.reportsGrid}>
            {reports.map((r) => {
              const isClosed = r.status === 'resolved' || r.status === 'dismissed';

              return (
                <div key={r.id} style={styles.reportCard}>
                  {/* Card Header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.typeBadgeGroup}>
                      <span style={styles.typeBadge}>{r.target_type.toUpperCase()}</span>
                      <span
                        style={{
                          ...styles.levelBadge,
                          backgroundColor:
                            r.escalation_level === 'super_admin'
                              ? '#fdf2f8'
                              : r.escalation_level === 'admin'
                              ? '#fef2f2'
                              : '#eff6ff',
                          color:
                            r.escalation_level === 'super_admin'
                              ? '#be185d'
                              : r.escalation_level === 'admin'
                              ? '#b91c1c'
                              : '#2563eb',
                          borderColor:
                            r.escalation_level === 'super_admin'
                              ? '#fbcfe8'
                              : r.escalation_level === 'admin'
                              ? '#fecaca'
                              : '#bfdbfe',
                        }}
                      >
                        Level: {r.escalation_level.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <span style={styles.reportTime}>
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Target Preview */}
                  <div style={styles.targetPreviewBox}>
                    <strong style={styles.targetTitle}>
                      {r.target_title || `Reported ${r.target_type} (${r.target_id.slice(0, 8)})`}
                    </strong>
                    {r.target_snippet && <p style={styles.targetSnippet}>"{r.target_snippet}"</p>}
                  </div>

                  {/* Reason & Reporter */}
                  <div style={styles.reasonBox}>
                    <div style={styles.reasonHeader}>
                      <AlertTriangle size={14} color="#d97706" />
                      <strong>Flag Reason:</strong>
                    </div>
                    <p style={styles.reasonText}>{r.reason}</p>
                    <span style={styles.reporterFootnote}>
                      Reported by: <strong>{r.reporter_name}</strong>
                    </span>
                  </div>

                  {/* Resolution Info if closed */}
                  {isClosed && (
                    <div style={styles.resolutionBox}>
                      <span style={styles.resolutionStatus}>Status: {r.status.toUpperCase()}</span>
                      {r.action_taken && <p style={styles.actionTakenText}>Action: {r.action_taken}</p>}
                      {r.resolved_by_name && (
                        <span style={styles.resolvedBy}>Resolved by {r.resolved_by_name}</span>
                      )}
                    </div>
                  )}

                  {/* Action Controls */}
                  {!isClosed && (
                    <div style={styles.actionsFooter}>
                      <button
                        onClick={() => handleResolve(r.id, r.target_type, r.target_id)}
                        disabled={actionLoadingId === r.id}
                        style={styles.resolveBtn}
                      >
                        <CheckCircle size={15} />
                        <span>Resolve & Action</span>
                      </button>

                      {r.escalation_level !== 'super_admin' && (
                        <button
                          onClick={() => handleEscalate(r.id)}
                          disabled={actionLoadingId === r.id}
                          style={styles.escalateBtn}
                        >
                          <ArrowUpRight size={15} />
                          <span>Escalate Up</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDismiss(r.id)}
                        disabled={actionLoadingId === r.id}
                        style={styles.dismissBtn}
                      >
                        <XCircle size={15} />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  tabsBar: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.5rem',
    overflowX: 'auto',
  },
  tabBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
  },
  loadingBox: {
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#64748b',
  },
  emptyState: {
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
  },
  reportsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  typeBadgeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  typeBadge: {
    padding: '0.2rem 0.5rem',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '0.6875rem',
    fontWeight: 700,
  },
  levelBadge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.6875rem',
    fontWeight: 700,
    border: '1px solid transparent',
  },
  reportTime: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  targetPreviewBox: {
    padding: '0.875rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  targetTitle: {
    fontSize: '0.9375rem',
    color: '#0f172a',
  },
  targetSnippet: {
    fontSize: '0.8125rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
  },
  reasonBox: {
    padding: '0.875rem 1rem',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef08a',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  reasonHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#854d0e',
    fontSize: '0.8125rem',
  },
  reasonText: {
    fontSize: '0.875rem',
    color: '#713f12',
    margin: 0,
    lineHeight: 1.4,
  },
  reporterFootnote: {
    fontSize: '0.75rem',
    color: '#92400e',
    marginTop: '0.25rem',
  },
  resolutionBox: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  resolutionStatus: {
    fontWeight: 700,
    color: '#166534',
  },
  actionTakenText: {
    color: '#15803d',
    margin: 0,
  },
  resolvedBy: {
    color: '#16a34a',
    fontSize: '0.75rem',
  },
  actionsFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    paddingTop: '0.5rem',
    borderTop: '1px solid #f1f5f9',
  },
  resolveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  escalateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    color: '#b91c1c',
    borderRadius: '6px',
    border: '1px solid #fca5a5',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dismissBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    color: '#64748b',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
