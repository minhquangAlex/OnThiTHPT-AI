// frontend/src/types.ts
import type React from 'react';

// 👇 THÊM DÒNG NÀY ĐỂ SỬA LỖI "has no exported member named QuestionType"
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
  
  // Sử dụng type vừa định nghĩa ở trên
  type: QuestionType; 

  questionText: string;
  imageUrl?: string; 
  explanation: string;

  // Phần I: Trắc nghiệm
  options?: {
    A: string; B: string; C: string; D: string;
  };
  correctAnswer?: string; 

  // Phần II: Đúng/Sai
  trueFalseOptions?: {
    id: string;   // 'a', 'b', 'c', 'd'
    text: string; 
    isCorrect?: boolean; 
  }[];

  // Phần III: Trả lời ngắn
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