// frontend/src/types.ts
import type React from 'react';

// 1. Định nghĩa các loại câu hỏi (Mới)
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface User {
  id: string; 
  _id?: string;
  name: string;
  password?: string;
  role: 'student' | 'admin';
  className?: string;
  school?: string;
  email?: string;
}

export interface Question {
  _id?: string;
  id: string;
  subjectId?: string;
  
  // 👇 CẬP NHẬT: Loại câu hỏi
  type: QuestionType; 

  questionText: string;
  imageUrl?: string; 
  explanation: string;

  // --- Phần I: Trắc nghiệm 4 lựa chọn (Optional) ---
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: string; 

  // --- Phần II: Đúng / Sai (Mới) ---
  trueFalseOptions?: {
    id: string;   // 'a', 'b', 'c', 'd'
    text: string; 
    isCorrect?: boolean; 
  }[];

  // --- Phần III: Trả lời ngắn (Mới) ---
  shortAnswerCorrect?: string; 
}

export interface Subject {
  id: string;
  _id?: string;
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