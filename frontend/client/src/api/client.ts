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

export const isAbortError = (err: any): boolean => {
  return (
    err?.name === 'AbortError' ||
    err?.code === 20 ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'))
  );
};

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

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
   * Refreshes tokens using HTTP-only cookies with sliding 7-day expiration window.
   */
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
          throw new Error('Session expired (inactive > 7 days)');
        }

        const json = await response.json().catch(() => ({}));
        const tokens = json.data || json;

        if (tokens.accessToken) {
          localStorage.setItem('qstack_token', tokens.accessToken);
        }

        return true;
      } catch {
        localStorage.removeItem('qstack_token');
        localStorage.removeItem('qstack_refresh_token');
        window.dispatchEvent(new CustomEvent('qstack:session_expired'));
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
        credentials: 'include', // Send & receive HTTP-only cookies automatically
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
    } catch (err: any) {
      if (isAbortError(err)) {
        throw err;
      }
      throw new Error(err.message || 'Network request failed');
    }

    // Auto-refresh sliding session on 401 Unauthorized (unless aborted or already retried)
    if (
      response.status === 401 &&
      !isRetry &&
      !options.signal?.aborted &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/register') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const refreshed = await this.refreshSession();
      if (refreshed && !options.signal?.aborted) {
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
  async register(data: { email: string; password: string; displayName: string }, signal?: AbortSignal) {
    return this.request<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  }

  async login(data: { email: string; password: string }, signal?: AbortSignal) {
    return this.request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
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
    return this.request<User>('/auth/me', { signal });
  }

  // Questions
  async getQuestions(
    params?: {
      tag?: string;
      sort?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ) {
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
    }>(`/questions${queryString ? `?${queryString}` : ''}`, { signal });
  }

  async getQuestion(id: string, signal?: AbortSignal) {
    return this.request<Question>(`/questions/${id}`, { signal });
  }

  async createQuestion(data: { title: string; body: string; tags: string[] }, signal?: AbortSignal) {
    return this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  }

  async updateQuestion(id: string, data: { title?: string; body?: string; tags?: string[] }, signal?: AbortSignal) {
    return this.request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      signal,
    });
  }

  async deleteQuestion(id: string, signal?: AbortSignal) {
    return this.request<void>(`/questions/${id}`, {
      method: 'DELETE',
      signal,
    });
  }

  // Answers
  async getAnswers(questionId: string, signal?: AbortSignal) {
    return this.request<Answer[]>(`/questions/${questionId}/answers`, { signal });
  }

  async createAnswer(questionId: string, data: { body: string }, signal?: AbortSignal) {
    return this.request<Answer>(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  }

  async acceptAnswer(answerId: string, signal?: AbortSignal) {
    return this.request<{ success: boolean }>(`/answers/${answerId}/accept`, {
      method: 'PATCH',
      signal,
    });
  }

  async deleteAnswer(answerId: string, signal?: AbortSignal) {
    return this.request<void>(`/answers/${answerId}`, {
      method: 'DELETE',
      signal,
    });
  }

  // Comments
  async getComments(parentType: 'question' | 'answer', parentId: string, signal?: AbortSignal) {
    return this.request<Comment[]>(`/comments?parentType=${parentType}&parentId=${parentId}`, { signal });
  }

  async createComment(
    data: {
      parentType: 'question' | 'answer';
      parentId: string;
      body: string;
    },
    signal?: AbortSignal,
  ) {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  }

  // Votes
  async castVote(data: { targetType: 'question' | 'answer'; targetId: string; value: 1 | -1 }, signal?: AbortSignal) {
    return this.request<{
      targetType: string;
      targetId: string;
      userVote: number | null;
      newScore: number;
    }>('/votes', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  }

  // Medals (Phase 2)
  async giveMedal(questionId: string, tier: 'gold' | 'silver' | 'bronze', signal?: AbortSignal) {
    return this.request<{ medal: any; summary: MedalSummary }>('/medals', {
      method: 'POST',
      body: JSON.stringify({ questionId, tier }),
      signal,
    });
  }

  async removeMedal(questionId: string, signal?: AbortSignal) {
    return this.request<MedalSummary>(`/medals/${questionId}`, {
      method: 'DELETE',
      signal,
    });
  }

  async getQuestionMedals(questionId: string, signal?: AbortSignal) {
    return this.request<MedalSummary>(`/medals/question/${questionId}`, { signal });
  }

  // Bookmarks (Phase 2)
  async toggleBookmark(questionId: string, signal?: AbortSignal) {
    return this.request<{ questionId: string; isBookmarked: boolean }>(`/bookmarks/${questionId}`, {
      method: 'POST',
      signal,
    });
  }

  async getBookmarkStatus(questionId: string, signal?: AbortSignal) {
    return this.request<{ questionId: string; isBookmarked: boolean }>(`/bookmarks/status/${questionId}`, { signal });
  }

  async getUserBookmarks(page = 1, limit = 20, signal?: AbortSignal) {
    return this.request<{ questions: Question[]; total: number }>(`/bookmarks?page=${page}&limit=${limit}`, { signal });
  }

  // Follows (Phase 2)
  async toggleFollow(targetType: 'user' | 'tag' | 'question', targetId: string, signal?: AbortSignal) {
    return this.request<{ targetType: string; targetId: string; isFollowing: boolean }>('/follows', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
      signal,
    });
  }

  async getFollowStatus(targetType: 'user' | 'tag' | 'question', targetId: string, signal?: AbortSignal) {
    return this.request<{ targetType: string; targetId: string; isFollowing: boolean }>(
      `/follows/status?targetType=${targetType}&targetId=${targetId}`,
      { signal },
    );
  }

  async getFollowingUsers(signal?: AbortSignal) {
    return this.request<any[]>('/follows/users', { signal });
  }

  async getFollowingTags(userId?: string, signal?: AbortSignal) {
    const qs = userId ? `?userId=${userId}` : '';
    return this.request<any[]>(`/follows/tags${qs}`, { signal });
  }

  // Notifications (Phase 2)
  async getNotifications(limit = 30, signal?: AbortSignal) {
    return this.request<{ notifications: AppNotification[]; unreadCount: number }>(`/notifications?limit=${limit}`, {
      signal,
    });
  }

  async getUnreadNotificationsCount(signal?: AbortSignal) {
    return this.request<{ unreadCount: number }>('/notifications/unread-count', { signal });
  }

  async markNotificationAsRead(id: string, signal?: AbortSignal) {
    return this.request<{ success: boolean; unreadCount: number }>(`/notifications/${id}/read`, {
      method: 'PATCH',
      signal,
    });
  }

  async markAllNotificationsAsRead(signal?: AbortSignal) {
    return this.request<{ updatedCount: number; unreadCount: number }>('/notifications/read-all', {
      method: 'PATCH',
      signal,
    });
  }

  // Users & Profiles (Phase 2)
  async getUserProfile(id: string, signal?: AbortSignal) {
    return this.request<User>(`/users/${id}`, { signal });
  }

  async getUserQuestions(id: string, limit = 20, signal?: AbortSignal) {
    return this.request<Question[]>(`/users/${id}/questions?limit=${limit}`, { signal });
  }

  async getUserAnswers(id: string, limit = 20, signal?: AbortSignal) {
    return this.request<Answer[]>(`/users/${id}/answers?limit=${limit}`, { signal });
  }

  async getUserActivity(id: string, limit = 30, signal?: AbortSignal) {
    return this.request<UserActivity[]>(`/users/${id}/activity?limit=${limit}`, { signal });
  }

  async updateUserProfile(data: { displayName?: string; bio?: string; avatarUrl?: string }, signal?: AbortSignal) {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
      signal,
    });
  }

  async getLeaderboard(limit = 20, signal?: AbortSignal) {
    return this.request<User[]>(`/users/leaderboard?limit=${limit}`, { signal });
  }

  // Tags
  async getTags(search?: string, signal?: AbortSignal) {
    return this.request<Tag[]>(`/tags${search ? `?search=${encodeURIComponent(search)}` : ''}`, { signal });
  }

  async getPopularTags(signal?: AbortSignal) {
    return this.request<Tag[]>('/tags/popular', { signal });
  }

  // Reputation & Badges (Phase 3)
  async getBadgeCatalog(signal?: AbortSignal) {
    return this.request<BadgeRule[]>('/reputation/badges', { signal });
  }

  async getUserReputationHistory(limit = 50, signal?: AbortSignal) {
    return this.request<ReputationLedgerEntry[]>(`/reputation/history?limit=${limit}`, { signal });
  }

  async getCronRuns(limit = 20, signal?: AbortSignal) {
    return this.request<CronRun[]>(`/reputation/cron-runs?limit=${limit}`, { signal });
  }

  async triggerCronJob(signal?: AbortSignal) {
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

  // AI Systems (Phase 4)
  async getQuestionAiAnswer(questionId: string, signal?: AbortSignal) {
    return this.request<{
      question_id: string;
      response_text: string | null;
      model: string | null;
      status: 'pending' | 'ready' | 'failed';
    }>(`/ai/question-answer/${questionId}`, { signal });
  }

  async regenerateQuestionAiAnswer(questionId: string, signal?: AbortSignal) {
    return this.request<{
      question_id: string;
      response_text: string | null;
      model: string | null;
      status: 'pending' | 'ready' | 'failed';
    }>(`/ai/question-answer/${questionId}/regenerate`, {
      method: 'POST',
      signal,
    });
  }

  async triggerAiRegeneration(questionId: string, signal?: AbortSignal) {
    return this.regenerateQuestionAiAnswer(questionId, signal);
  }

  async askAiAssistant(question: string, signal?: AbortSignal) {
    return this.request<{
      answer: string;
      sources: Array<{ id: string; title: string; score: number }>;
      model: string;
    }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
      signal,
    });
  }

  // AI Chat Conversational Sessions
  async getChatSessions(signal?: AbortSignal) {
    return this.request<any[]>('/ai/chat/sessions', { signal });
  }

  async getSessionMessages(sessionId: string, signal?: AbortSignal) {
    return this.request<any[]>(`/ai/chat/sessions/${sessionId}/messages`, { signal });
  }

  async createChatSession(title = 'New Conversation', signal?: AbortSignal) {
    return this.request<any>('/ai/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
      signal,
    });
  }

  async deleteChatSession(sessionId: string, signal?: AbortSignal) {
    return this.request<void>(`/ai/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      signal,
    });
  }

  async sendChatMessage(sessionId: string, message: string, signal?: AbortSignal) {
    return this.request<{ userMessage: any; assistantMessage: any }>(`/ai/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      signal,
    });
  }

  // Reports (Phase 5)
  async createReport(
    data: {
      targetType: 'question' | 'answer' | 'comment' | 'user';
      targetId: string;
      reason: string;
    },
    signal?: AbortSignal,
  ) {
    return this.request<{ id: string; status: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  }
}

export const api = new ApiClient();
