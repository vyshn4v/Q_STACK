export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  reputation_total: number;
  questions_count?: number;
  answers_count?: number;
  medals_received_count?: number;
  badges?: { name: string; tier: string; awarded_at: string }[];
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  questions_count: number;
}

export interface AIResponse {
  status: 'pending' | 'ready' | 'failed';
  response_text?: string;
  model?: string;
  generated_at?: string;
}

export interface Question {
  id: string;
  author_id: string;
  title: string;
  body: string;
  status: 'open' | 'closed' | 'soft_deleted';
  views_count: number;
  score: number;
  answers_count: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar?: string | null;
  author_reputation: number;
  tags: Tag[];
  user_vote: number | null;
  medals_count: number;
  has_accepted_answer: boolean;
  ai_response?: AIResponse | null;
}

export interface Answer {
  id: string;
  question_id: string;
  question_title?: string;
  author_id: string;
  body: string;
  is_accepted: boolean;
  score: number;
  status: 'active' | 'soft_deleted';
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar?: string | null;
  author_reputation: number;
  user_vote: number | null;
}

export interface Comment {
  id: string;
  parent_type: 'question' | 'answer';
  parent_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
}

export interface MedalSummary {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  userMedal: 'gold' | 'silver' | 'bronze' | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface UserActivity {
  id: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}
