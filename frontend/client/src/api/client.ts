import type {
  User,
  Question,
  Answer,
  Comment,
  Tag,
  MedalSummary,
  AppNotification,
  UserActivity,
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

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

  async getFollowingTags() {
    return this.request<any[]>('/follows/tags');
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
}

export const api = new ApiClient();
