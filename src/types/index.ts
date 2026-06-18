export interface User {
  id: string;
  userId: string;
  role: 'admin' | 'moderator';
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export type TestStatus = 'draft' | 'live';
export type TestType = 'practice' | 'mock' | 'sectional';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
}

export interface Test {
  id: string;
  name: string;
  type: TestType;
  subject: string; // ID or resolved name depending on endpoint context
  topics: string[];
  sub_topics: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: DifficultyLevel;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: TestStatus | null;
  created_at?: string;
}

export interface Question {
  id?: string;
  type: 'mcq';
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 'option1' | 'option2' | 'option3' | 'option4';
  explanation?: string;
  difficulty?: DifficultyLevel;
  test_id: string;
}