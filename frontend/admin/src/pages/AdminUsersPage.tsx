import React, { useState, useEffect } from 'react';
import {
  Search,
  UserX,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../api/client';
import type { AdminUser } from '../api/client';
import { AdminShell } from '../components/layout/AdminShell';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin, adminUser: currentAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [banFilter, setBanFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, banFilter]);

  const loadUsers = () => {
    setIsLoading(true);
    setError(null);
    adminApi.getUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      isBanned: banFilter ? banFilter === 'true' : undefined,
      limit: 50,
    })
      .then((data) => setUsers(data.users || []))
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setIsLoading(false));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleBan = async (user: AdminUser) => {
    const actionName = user.is_banned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${actionName} user "${user.display_name}"?`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      await adminApi.setUserBanStatus(user.id, !user.is_banned);
      loadUsers();
    } catch (err: any) {
      alert(err.message || `Failed to ${actionName} user.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      alert('Only the Super Administrator can manually change user roles.');
      return;
    }

    if (!window.confirm(`Update user role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    setActionLoadingId(userId);
    try {
      await adminApi.setUserRole(userId, newRole);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
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
            <h1 style={styles.title}>User Management</h1>
            <p style={styles.subtitle}>
              Inspect developer accounts, moderate access privileges, and manage role tiers.
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={styles.filterCard}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by display name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button type="submit" style={styles.searchBtn}>Search</button>
          </form>

          <div style={styles.dropdownsRow}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Administrator</option>
              <option value="super_admin">Super Administrator</option>
            </select>

            <select
              value={banFilter}
              onChange={(e) => setBanFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Statuses</option>
              <option value="false">Active Only</option>
              <option value="true">Banned Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div style={styles.loadingBox}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            <span>Loading user directory...</span>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Developer</th>
                  <th style={styles.th}>Role Tier</th>
                  <th style={styles.th}>Reputation</th>
                  <th style={styles.th}>Questions / Answers</th>
                  <th style={styles.th}>Reports</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;
                  const isSuper = u.role === 'super_admin';

                  return (
                    <tr key={u.id} style={styles.tr}>
                      {/* Developer Info */}
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatarFallback}>
                            {u.display_name ? u.display_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <strong style={styles.userName}>{u.display_name}</strong>
                            <span style={styles.userEmail}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={styles.td}>
                        {isSuperAdmin && !isSelf && !isSuper ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={actionLoadingId === u.id}
                            style={styles.roleSelect}
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              ...styles.roleBadge,
                              backgroundColor:
                                u.role === 'super_admin'
                                  ? '#0f172a'
                                  : u.role === 'admin'
                                  ? '#2563eb'
                                  : u.role === 'moderator'
                                  ? '#7c3aed'
                                  : '#f1f5f9',
                              color: u.role === 'user' ? '#475569' : '#ffffff',
                            }}
                          >
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Reputation */}
                      <td style={styles.td}>
                        <strong>{u.reputation_total}</strong> rep
                      </td>

                      {/* Counts */}
                      <td style={styles.td}>
                        <span style={styles.countsText}>
                          {u.questions_count} Qs • {u.answers_count} As
                        </span>
                      </td>

                      {/* Reports */}
                      <td style={styles.td}>
                        {u.reports_against_count > 0 ? (
                          <span style={styles.reportsFlag}>
                            {u.reports_against_count} flags
                          </span>
                        ) : (
                          <span style={styles.cleanFlag}>0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                        {u.is_banned ? (
                          <span style={styles.bannedPill}>Banned</span>
                        ) : (
                          <span style={styles.activePill}>Active</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={styles.tdRight}>
                        {!isSelf && !isSuper && (
                          <button
                            onClick={() => handleToggleBan(u)}
                            disabled={actionLoadingId === u.id}
                            style={{
                              ...styles.banBtn,
                              color: u.is_banned ? '#16a34a' : '#dc2626',
                              borderColor: u.is_banned ? '#bbf7d0' : '#fecaca',
                              backgroundColor: u.is_banned ? '#f0fdf4' : '#fef2f2',
                            }}
                          >
                            {u.is_banned ? <UserCheck size={14} /> : <UserX size={14} />}
                            <span>{u.is_banned ? 'Unban User' : 'Ban Account'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
  errorAlert: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
    gap: '0.75rem',
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  loadingBox: {
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
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
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatarFallback: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
  },
  userName: {
    display: 'block',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.6875rem',
    fontWeight: 700,
  },
  roleSelect: {
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  countsText: {
    fontSize: '0.8125rem',
    color: '#475569',
  },
  reportsFlag: {
    padding: '0.125rem 0.375rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  cleanFlag: {
    color: '#94a3b8',
    fontSize: '0.75rem',
  },
  activePill: {
    padding: '0.2rem 0.5rem',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  bannedPill: {
    padding: '0.2rem 0.5rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  banBtn: {
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
