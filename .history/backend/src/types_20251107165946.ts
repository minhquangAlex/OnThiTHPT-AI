import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  password?: string;
  role: 'student' | 'admin';
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

export interface IAnswer {
  questionId: Types.ObjectId; // Changed to Types.ObjectId
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface IAttempt extends Document {
  userId?: Types.ObjectId;
  subjectId?: Types.ObjectId;
  score?: number;
  total?: number;
  answers: IAnswer[]; // Use the new IAnswer interface
  createdAt?: Date;
}
