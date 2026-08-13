export interface AdminStats {
  total_users: number;
  banned_users: number;
  active_questions: number;
  active_answers: number;
  pending_reports: number;
  resolved_reports: number;
  completed_cron_runs: number;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  reputation_total: number;
  is_banned: boolean;
  questions_count: number;
  answers_count: number;
  reports_against_count: number;
  created_at: string;
}

export interface AdminReport {
  id: string;
  target_type: 'question' | 'answer' | 'comment' | 'user';
  target_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_avatar: string | null;
  reason: string;
  status: 'reported' | 'moderator_review' | 'admin_review' | 'super_admin_review' | 'resolved' | 'dismissed';
  escalation_level: 'moderator' | 'admin' | 'super_admin';
  action_taken: string | null;
  resolved_by_name: string | null;
  created_at: string;
  target_title: string | null;
  target_snippet: string | null;
}

export interface AdminContentItem {
  id: string;
  target_type: 'question' | 'answer';
  title?: string;
  body: string;
  author_id: string;
  author_name: string;
  score: number;
  status: 'active' | 'soft_deleted';
  reports_count: number;
  created_at: string;
  updated_at: string;
}

export interface ObservabilityData {
  database: { status: string; poolSize: number };
  recentCronRuns: any[];
  activityMetrics24h: Array<{ event_type: string; count: number }>;
}

const API_BASE = '/api/v1';

export const isAbortError = (err: any): boolean => {
  return (
    err?.name === 'AbortError' ||
    err?.code === 20 ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'))
  );
};

class AdminApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('qstack_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async refreshSession(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error('Admin session expired');
        }

        const json = await response.json().catch(() => ({}));
        const tokens = json.data || json;

        if (tokens.accessToken) {
          localStorage.setItem('qstack_admin_token', tokens.accessToken);
        }

        return true;
      } catch {
        localStorage.removeItem('qstack_admin_token');
        localStorage.removeItem('qstack_admin_refresh_token');
        window.dispatchEvent(new CustomEvent('qstack:admin_session_expired'));
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
    } catch (err: any) {
      if (isAbortError(err)) {
        throw err;
      }
      throw new Error(err.message || 'Admin network request failed');
    }

    if (
      response.status === 401 &&
      !isRetry &&
      !options.signal?.aborted &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const refreshed = await this.refreshSession();
      if (refreshed && !options.signal?.aborted) {
        return this.request<T>(endpoint, options, true);
      }
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = json.message || json.error || 'An error occurred';
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return (json.data !== undefined ? json.data : json) as T;
  }

  // Auth
  async login(email: string, password: string, signal?: AbortSignal) {
    return this.request<{ accessToken: string; refreshToken: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      signal,
    });
  }

  async logout(signal?: AbortSignal) {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      signal,
    });
  }

  async getMe(signal?: AbortSignal) {
    return this.request<AdminUser>('/auth/me', { signal });
  }

  // Dashboard & Stats
  async getStats(signal?: AbortSignal) {
    return this.request<AdminStats>('/admin/stats', { signal });
  }

  async triggerNightlyCron(signal?: AbortSignal) {
    return this.request<{
      runId: string;
      status: string;
      eventsProcessed: number;
      usersUpdated: number;
      badgesAwarded: number;
      moderatorPromotions: number;
    }>('/reputation/run-cron', {
      method: 'POST',
      signal,
    });
  }

  async triggerCron(jobType?: string, signal?: AbortSignal) {
    return this.request<{ runId: string; status: string; processed: number }>('/admin/crons/trigger', {
      method: 'POST',
      body: JSON.stringify({ jobType }),
      signal,
    });
  }

  // Reports Queue
  async getReports(
    params?: {
      status?: string;
      escalationLevel?: string;
      page?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.escalationLevel) qs.set('escalationLevel', params.escalationLevel);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const q = qs.toString();
    return this.request<{
      reports: AdminReport[];
      total: number;
      page: number;
      limit: number;
    }>(`/reports${q ? `?${q}` : ''}`, { signal });
  }

  async escalateReport(reportId: string, notes?: string, signal?: AbortSignal) {
    return this.request<AdminReport>(`/reports/${reportId}/escalate`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
      signal,
    });
  }

  async resolveReport(reportId: string, actionTaken?: string, notes?: string, signal?: AbortSignal) {
    return this.request<AdminReport>(`/reports/${reportId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution: 'action_taken', actionTaken, notes }),
      signal,
    });
  }

  async dismissReport(reportId: string, notes?: string, signal?: AbortSignal) {
    return this.request<AdminReport>(`/reports/${reportId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution: 'dismissed', notes }),
      signal,
    });
  }

  // User Moderation
  async getUsers(
    params?: {
      search?: string;
      role?: string;
      isBanned?: boolean;
      page?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.role) qs.set('role', params.role);
    if (params?.isBanned !== undefined) qs.set('isBanned', String(params.isBanned));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const q = qs.toString();
    return this.request<{
      users: AdminUser[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/users${q ? `?${q}` : ''}`, { signal });
  }

  async updateUserBan(userId: string, isBanned: boolean, banReason?: string, signal?: AbortSignal) {
    return this.request<{ success: boolean; userId: string; isBanned: boolean }>(`/admin/users/${userId}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned, banReason }),
      signal,
    });
  }

  async setUserBanStatus(userId: string, isBanned: boolean, banReason?: string, signal?: AbortSignal) {
    return this.updateUserBan(userId, isBanned, banReason, signal);
  }

  async updateUserRole(userId: string, role: string, signal?: AbortSignal) {
    return this.request<{ success: boolean; userId: string; role: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      signal,
    });
  }

  async setUserRole(userId: string, role: string, signal?: AbortSignal) {
    return this.updateUserRole(userId, role, signal);
  }

  // Content Control
  async getContent(
    params?: {
      type?: 'question' | 'answer';
      status?: 'active' | 'soft_deleted';
      search?: string;
      page?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ) {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const q = qs.toString();
    return this.request<{
      items: AdminContentItem[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/content${q ? `?${q}` : ''}`, { signal });
  }

  async setContentStatus(type: 'question' | 'answer', id: string, status: 'active' | 'soft_deleted', signal?: AbortSignal) {
    return this.request<{ success: boolean; id: string; status: string }>(`/admin/content/${type}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      signal,
    });
  }

  async softDeleteContent(type: 'question' | 'answer', id: string, signal?: AbortSignal) {
    return this.setContentStatus(type, id, 'soft_deleted', signal);
  }

  async restoreContent(type: 'question' | 'answer', id: string, signal?: AbortSignal) {
    return this.setContentStatus(type, id, 'active', signal);
  }

  // Observability & Logs
  async getObservability(signal?: AbortSignal) {
    return this.request<ObservabilityData>('/admin/observability', { signal });
  }
}

export const adminApi = new AdminApiClient();
