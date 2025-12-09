
import type React from 'react';

export interface User {
  id: string; // Used by frontend logic
  _id?: string; // from MongoDB
  name: string;
  password?: string; // Only for backend processing
  role: 'student' | 'admin';
  className?: string;
  school?: string;
  email?: string;
}

export interface Question {
  _id?: string;
  id: string;
  subjectId?: string; // Link to Subject
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface Subject {
  id: string;
  _id?: string; // _id from MongoDB
  name: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  questionCount?: number;
}

export interface QuizResult {
  subjectId: string;
  score: number;
  totalQuestions: number;
  answers: { [questionId: string]: string };
  timestamp: number;
}