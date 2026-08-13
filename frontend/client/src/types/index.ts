export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  avatarUrl: string | null;
  reputation: number;
  bio?: string | null;
  createdAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  questions_count?: number;
}

export interface Question {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  title: string;
  body: string;
  status: string;
  views_count: number;
  score: number;
  answers_count: number;
  tags: Tag[];
  medals_count: number;
  has_accepted_answer: boolean;
  user_vote?: number | null;
  is_bookmarked?: boolean;
  ai_response?: {
    status: 'pending' | 'ready' | 'failed';
    response_text: string | null;
    model: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  body: string;
  is_accepted: boolean;
  score: number;
  status: string;
  user_vote?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  parent_type: 'question' | 'answer';
  parent_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  body: string;
  created_at: string;
}
