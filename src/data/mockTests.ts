import type { Test } from '../types';

export const MOCK_TESTS: Test[] = [
  {
    id: 'test-1',
    name: 'Mathematics Standard Review',
    subject: 'Mathematics',
    type: 'practice',
    topics: ['Algebra', 'Geometry'],
    sub_topics: ['Linear Equations'],
    correct_marks: 4,
    wrong_marks: -1,
    unattempt_marks: 0,
    difficulty: 'medium',
    total_time: 60,
    total_marks: 200,
    total_questions: 50,
    status: 'live',
    created_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'test-2',
    name: 'English Grammar Alpha',
    subject: 'English',
    type: 'mock',
    topics: ['Grammar', 'Writing'],
    sub_topics: ['Application'],
    correct_marks: 5,
    wrong_marks: -1,
    unattempt_marks: 0,
    difficulty: 'easy',
    total_time: 90,
    total_marks: 250,
    total_questions: 50,
    status: 'draft',
    created_at: '2026-06-03T14:30:00Z',
  }
];