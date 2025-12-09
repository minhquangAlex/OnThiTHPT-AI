import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  password?: string;
  role: 'student' | 'admin';
  email?: string;
  className?: string;
  school?: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface ISubject extends Document {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;  // Optional description field
}

export interface IQuestion extends Document {
  id: string;
  subjectId: any;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  imageUrl?: string;
}

export interface IAttempt extends Document {
  userId?: any;
  subjectId?: string;
  score?: number;
  total?: number;
  answers: {
    questionId: any;
    selectedAnswer: string;
    isCorrect: boolean;
  }[];
  createdAt?: Date;
}
