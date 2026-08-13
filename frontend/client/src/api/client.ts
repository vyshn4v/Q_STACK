import type { User, Question, Answer, Comment, Tag } from '../types';

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

  // Tags
  async getTags(search?: string) {
    return this.request<Tag[]>(`/tags${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  }

  async getPopularTags() {
    return this.request<Tag[]>('/tags/popular');
  }

  // Health
  async getHealth() {
    return this.request<{ status: string; services: Record<string, string> }>('/health');
  }
}

export const api = new ApiClient();
