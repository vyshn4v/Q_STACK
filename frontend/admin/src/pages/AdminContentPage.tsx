import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  RotateCcw,
  Loader2,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { adminApi, isAbortError } from '../api/client';
import type { AdminContentItem } from '../api/client';
import { AdminShell } from '../components/layout/AdminShell';

export const AdminContentPage: React.FC = () => {
  const [targetType, setTargetType] = useState<'question' | 'answer'>('question');
  const [statusFilter, setStatusFilter] = useState<'active' | 'soft_deleted'>('active');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadContent = (signal?: AbortSignal) => {
    setIsLoading(true);
    adminApi.getContent({
      type: targetType,
      status: statusFilter,
      search: search || undefined,
      limit: 50,
    }, signal)
      .then((data) => {
        if (!signal?.aborted) setItems(data.items || []);
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
    loadContent(controller.signal);

    return () => {
      controller.abort();
    };
  }, [targetType, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadContent();
  };

  const handleToggleSoftDelete = async (item: AdminContentItem) => {
    const isSoftDeleted = item.status === 'soft_deleted';
    const actionName = isSoftDeleted ? 'restore' : 'soft-delete';

    if (!window.confirm(`Are you sure you want to ${actionName} this ${item.target_type}?`)) {
      return;
    }

    setActionLoadingId(item.id);
    try {
      if (isSoftDeleted) {
        await adminApi.restoreContent(item.target_type, item.id);
      } else {
        await adminApi.softDeleteContent(item.target_type, item.id);
      }
      loadContent();
    } catch (err: any) {
      alert(err.message || `Failed to ${actionName} content.`);
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
            <h1 style={styles.title}>Content Control</h1>
            <p style={styles.subtitle}>
              Inspect questions and answers, manage moderation flags, and enforce soft-deletion.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterCard}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search post text or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button type="submit" style={styles.searchBtn}>Search</button>
          </form>

          <div style={styles.dropdownsRow}>
            <div style={styles.btnGroup}>
              <button
                onClick={() => setTargetType('question')}
                style={{
                  ...styles.groupBtn,
                  ...(targetType === 'question' ? styles.groupBtnActive : {}),
                }}
              >
                <HelpCircle size={14} />
                <span>Questions</span>
              </button>
              <button
                onClick={() => setTargetType('answer')}
                style={{
                  ...styles.groupBtn,
                  ...(targetType === 'answer' ? styles.groupBtnActive : {}),
                }}
              >
                <MessageSquare size={14} />
                <span>Answers</span>
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={styles.select}
            >
              <option value="active">Active Posts</option>
              <option value="soft_deleted">Soft-Deleted Only</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div style={styles.loadingBox}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span>Loading content directory...</span>
          </div>
        ) : items.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No content matching the selected filters.</p>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Post Content</th>
                  <th style={styles.th}>Author</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Flags</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    {/* Content preview */}
                    <td style={{ ...styles.td, maxWidth: '400px' }}>
                      {item.title && <strong style={styles.itemTitle}>{item.title}</strong>}
                      <p style={styles.itemBodySnippet}>
                        {item.body.replace(/<[^>]*>/g, '').slice(0, 160)}...
                      </p>
                    </td>

                    {/* Author */}
                    <td style={styles.td}>
                      <span style={styles.authorName}>{item.author_name}</span>
                    </td>

                    {/* Score */}
                    <td style={styles.td}>
                      <strong>{item.score}</strong> votes
                    </td>

                    {/* Flags */}
                    <td style={styles.td}>
                      {item.reports_count > 0 ? (
                        <span style={styles.flagCount}>{item.reports_count} flags</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </td>

                    {/* Created */}
                    <td style={styles.td}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={styles.tdRight}>
                      <button
                        onClick={() => handleToggleSoftDelete(item)}
                        disabled={actionLoadingId === item.id}
                        style={{
                          ...styles.deleteBtn,
                          color: item.status === 'soft_deleted' ? '#16a34a' : '#dc2626',
                          borderColor: item.status === 'soft_deleted' ? '#bbf7d0' : '#fecaca',
                          backgroundColor: item.status === 'soft_deleted' ? '#f0fdf4' : '#fef2f2',
                        }}
                      >
                        {item.status === 'soft_deleted' ? <RotateCcw size={14} /> : <Trash2 size={14} />}
                        <span>{item.status === 'soft_deleted' ? 'Restore Post' : 'Soft Delete'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  filterCard: {
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexGrow: 1,
    maxWidth: '450px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    flexGrow: 1,
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    width: '100%',
  },
  searchBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dropdownsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  btnGroup: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: '2px',
    borderRadius: '8px',
  },
  groupBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.4rem 0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
  },
  groupBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: '#ffffff',
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
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    color: '#64748b',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
  thRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.875rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  thRight: {
    padding: '0.875rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '1rem',
    color: '#1e293b',
    verticalAlign: 'middle',
  },
  tdRight: {
    padding: '1rem',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  itemTitle: {
    display: 'block',
    fontSize: '0.9375rem',
    color: '#0f172a',
    marginBottom: '0.25rem',
  },
  itemBodySnippet: {
    fontSize: '0.8125rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
  },
  authorName: {
    fontWeight: 600,
    color: '#334155',
  },
  flagCount: {
    padding: '0.125rem 0.375rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
