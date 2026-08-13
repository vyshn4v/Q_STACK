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
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
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
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request<AdminUser>('/auth/me');
  }

  // Dashboard & Stats
  async getStats() {
    return this.request<AdminStats>('/admin/stats');
  }

  // Reports
  async getReports(params?: { status?: string; escalationLevel?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.escalationLevel) query.set('escalationLevel', params.escalationLevel);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return this.request<{ reports: AdminReport[]; total: number }>(`/reports${qs ? `?${qs}` : ''}`);
  }

  async escalateReport(id: string, escalationReason?: string) {
    return this.request<AdminReport>(`/reports/${id}/escalate`, {
      method: 'PATCH',
      body: JSON.stringify({ escalationReason }),
    });
  }

  async resolveReport(id: string, actionTaken: string) {
    return this.request<AdminReport>(`/reports/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ actionTaken }),
    });
  }

  async dismissReport(id: string, actionTaken: string) {
    return this.request<AdminReport>(`/reports/${id}/dismiss`, {
      method: 'PATCH',
      body: JSON.stringify({ actionTaken }),
    });
  }

  // Users
  async getUsers(params?: { search?: string; role?: string; isBanned?: boolean; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.isBanned !== undefined) query.set('isBanned', String(params.isBanned));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return this.request<{ users: AdminUser[]; total: number }>(`/admin/users${qs ? `?${qs}` : ''}`);
  }

  async setUserBanStatus(userId: string, isBanned: boolean) {
    return this.request<{ success: boolean; userId: string; isBanned: boolean }>(`/admin/users/${userId}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned }),
    });
  }

  async setUserRole(userId: string, role: string) {
    return this.request<{ success: boolean; userId: string; role: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // Content
  async getContent(params?: { targetType?: 'question' | 'answer'; status?: 'active' | 'soft_deleted'; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return this.request<{ items: AdminContentItem[]; total: number }>(`/admin/content${qs ? `?${qs}` : ''}`);
  }

  async softDeleteContent(targetType: 'question' | 'answer', targetId: string) {
    return this.request<{ success: boolean }>(`/admin/content/${targetType}/${targetId}/soft-delete`, {
      method: 'PATCH',
    });
  }

  async restoreContent(targetType: 'question' | 'answer', targetId: string) {
    return this.request<{ success: boolean }>(`/admin/content/${targetType}/${targetId}/restore`, {
      method: 'PATCH',
    });
  }

  // Observability & System
  async getObservability() {
    return this.request<ObservabilityData>('/admin/observability');
  }

  async triggerNightlyCron() {
    return this.request<any>('/reputation/run-cron', {
      method: 'POST',
    });
  }
}

export const adminApi = new AdminApiClient();
