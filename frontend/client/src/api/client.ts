import type {
  User,
  Question,
  Answer,
  Comment,
  Tag,
  MedalSummary,
  AppNotification,
  UserActivity,
  BadgeRule,
  ReputationLedgerEntry,
  CronRun,
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('qstack_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Refreshes tokens with sliding 7-day expiration window.
   * Single flight promise avoids duplicate parallel refresh calls.
   */
  async refreshSession(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('qstack_refresh_token');
    if (!refreshToken) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Refresh token invalid or expired (inactive > 7 days)');
        }

        const json = await response.json().catch(() => ({}));
        const tokens = json.data || json;

        if (tokens.accessToken && tokens.refreshToken) {
          localStorage.setItem('qstack_token', tokens.accessToken);
          localStorage.setItem('qstack_refresh_token', tokens.refreshToken);
          return tokens.accessToken as string;
        }
        return null;
      } catch {
        // Expired after 7 days of inactivity
        localStorage.removeItem('qstack_token');
        localStorage.removeItem('qstack_refresh_token');
        window.dispatchEvent(new CustomEvent('qstack:session_expired'));
        return null;
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
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    // Auto-refresh sliding session on 401 Unauthorized
    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/register') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const newAccessToken = await this.refreshSession();
      if (newAccessToken) {
        return this.request<T>(endpoint, options, true);
      }
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = json.message || json.error || 'An unexpected error occurred';
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return (json.data !== undefined ? json.data : json) as T;
  }

  // Auth
  async register(data: { email: string; password: string; displayName: string }) {
    return this.request<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  // Questions
  async getQuestions(params?: {
    tag?: string;
    sort?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.tag) query.set('tag', params.tag);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.request<{
      questions: Question[];
      total: number;
      page: number;
      limit: number;
    }>(`/questions${queryString ? `?${queryString}` : ''}`);
  }

  async getQuestion(id: string) {
    return this.request<Question>(`/questions/${id}`);
  }

  async createQuestion(data: { title: string; body: string; tags: string[] }) {
    return this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id: string, data: { title?: string; body?: string; tags?: string[] }) {
    return this.request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: string) {
    return this.request<void>(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  // Answers
  async getAnswers(questionId: string) {
    return this.request<Answer[]>(`/questions/${questionId}/answers`);
  }

  async createAnswer(questionId: string, data: { body: string }) {
    return this.request<Answer>(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptAnswer(answerId: string) {
    return this.request<{ success: boolean }>(`/answers/${answerId}/accept`, {
      method: 'PATCH',
    });
  }

  async deleteAnswer(answerId: string) {
    return this.request<void>(`/answers/${answerId}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(parentType: 'question' | 'answer', parentId: string) {
    return this.request<Comment[]>(`/comments?parentType=${parentType}&parentId=${parentId}`);
  }

  async createComment(data: {
    parentType: 'question' | 'answer';
    parentId: string;
    body: string;
  }) {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Votes
  async castVote(data: { targetType: 'question' | 'answer'; targetId: string; value: 1 | -1 }) {
    return this.request<{
      targetType: string;
      targetId: string;
      userVote: number | null;
      newScore: number;
    }>('/votes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Medals (Phase 2)
  async giveMedal(questionId: string, tier: 'gold' | 'silver' | 'bronze') {
    return this.request<{ medal: any; summary: MedalSummary }>('/medals', {
      method: 'POST',
      body: JSON.stringify({ questionId, tier }),
    });
  }

  async removeMedal(questionId: string) {
    return this.request<MedalSummary>(`/medals/${questionId}`, {
      method: 'DELETE',
    });
  }

  async getQuestionMedals(questionId: string) {
    return this.request<MedalSummary>(`/medals/question/${questionId}`);
  }

  // Bookmarks (Phase 2)
  async toggleBookmark(questionId: string) {
    return this.request<{ questionId: string; isBookmarked: boolean }>(`/bookmarks/${questionId}`, {
      method: 'POST',
    });
  }

  async getBookmarkStatus(questionId: string) {
    return this.request<{ questionId: string; isBookmarked: boolean }>(`/bookmarks/status/${questionId}`);
  }

  async getUserBookmarks(page = 1, limit = 20) {
    return this.request<{ questions: Question[]; total: number }>(`/bookmarks?page=${page}&limit=${limit}`);
  }

  // Follows (Phase 2)
  async toggleFollow(targetType: 'user' | 'tag' | 'question', targetId: string) {
    return this.request<{ targetType: string; targetId: string; isFollowing: boolean }>('/follows', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    });
  }

  async getFollowStatus(targetType: 'user' | 'tag' | 'question', targetId: string) {
    return this.request<{ targetType: string; targetId: string; isFollowing: boolean }>(
      `/follows/status?targetType=${targetType}&targetId=${targetId}`,
    );
  }

  async getFollowingUsers() {
    return this.request<any[]>('/follows/users');
  }

  async getFollowingTags(userId?: string) {
    const qs = userId ? `?userId=${userId}` : '';
    return this.request<any[]>(`/follows/tags${qs}`);
  }

  // Notifications (Phase 2)
  async getNotifications(limit = 30) {
    return this.request<{ notifications: AppNotification[]; unreadCount: number }>(`/notifications?limit=${limit}`);
  }

  async getUnreadNotificationsCount() {
    return this.request<{ unreadCount: number }>('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ success: boolean; unreadCount: number }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ updatedCount: number; unreadCount: number }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Users & Profiles (Phase 2)
  async getUserProfile(id: string) {
    return this.request<User>(`/users/${id}`);
  }

  async getUserQuestions(id: string, limit = 20) {
    return this.request<Question[]>(`/users/${id}/questions?limit=${limit}`);
  }

  async getUserAnswers(id: string, limit = 20) {
    return this.request<Answer[]>(`/users/${id}/answers?limit=${limit}`);
  }

  async getUserActivity(id: string, limit = 30) {
    return this.request<UserActivity[]>(`/users/${id}/activity?limit=${limit}`);
  }

  async updateUserProfile(data: { displayName?: string; bio?: string; avatarUrl?: string }) {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getLeaderboard(limit = 20) {
    return this.request<User[]>(`/users/leaderboard?limit=${limit}`);
  }

  // Tags
  async getTags(search?: string) {
    return this.request<Tag[]>(`/tags${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  }

  async getPopularTags() {
    return this.request<Tag[]>('/tags/popular');
  }

  // Reputation & Badges (Phase 3)
  async getBadgeCatalog() {
    return this.request<BadgeRule[]>('/reputation/badges');
  }

  async getUserReputationHistory(limit = 50) {
    return this.request<ReputationLedgerEntry[]>(`/reputation/history?limit=${limit}`);
  }

  async getCronRuns(limit = 20) {
    return this.request<CronRun[]>(`/reputation/cron-runs?limit=${limit}`);
  }

  async triggerCronJob() {
    return this.request<{
      runId: string;
      status: string;
      eventsProcessed: number;
      usersUpdated: number;
      badgesAwarded: number;
      moderatorPromotions: number;
    }>('/reputation/run-cron', {
      method: 'POST',
    });
  }

  // AI Systems (Phase 4)
  async getQuestionAiAnswer(questionId: string) {
    return this.request<{
      question_id: string;
      response_text: string | null;
      model: string | null;
      status: 'pending' | 'ready' | 'failed';
      generated_at: string | null;
    }>(`/ai/questions/${questionId}`);
  }

  async regenerateQuestionAiAnswer(questionId: string) {
    return this.request<{
      question_id: string;
      response_text: string;
      model: string;
      status: 'ready';
    }>(`/ai/questions/${questionId}/regenerate`, {
      method: 'POST',
    });
  }

  async getChatSessions() {
    return this.request<any[]>('/ai/chat/sessions');
  }

  async createChatSession(title?: string) {
    return this.request<any>('/ai/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getSessionMessages(sessionId: string) {
    return this.request<any[]>(`/ai/chat/sessions/${sessionId}`);
  }

  async deleteChatSession(sessionId: string) {
    return this.request<boolean>(`/ai/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async sendChatMessage(sessionId: string, message: string) {
    return this.request<{ userMessage: any; assistantMessage: any }>(`/ai/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Reports & Moderation (Phase 5)
  async createReport(data: {
    targetType: 'question' | 'answer' | 'comment' | 'user';
    targetId: string;
    reason: string;
  }) {
    return this.request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
