import { Document, Types } from 'mongoose';

// 1. Định nghĩa các loại câu hỏi (Mới)
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface IUser extends Document {
  name: string;
  email?: string;
  password?: string;
  role: 'student' | 'admin' | 'teacher'; // Thêm teacher nếu cần sau này
  className?: string;
  school?: string;
  banned?: boolean;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface ISubject extends Document {
  id: string; // Virtual ID
  name: string;
  slug: string;
  icon: string;
  description?: string;
  questionCount?: number;
}

export interface IQuestion extends Document {
  id: string; // Virtual ID
  subjectId: Types.ObjectId; // Sửa any thành ObjectId cho chặt chẽ
  
  // 👇 CẬP NHẬT QUAN TRỌNG: Phân loại câu hỏi
  type: QuestionType; 

  questionText: string;
  imageUrl?: string;
  explanation?: string;

  groupContext?: string; 

  // --- Dành cho PHẦN I: Trắc nghiệm 4 lựa chọn ---
  // (Để optional ? vì Phần II và III không dùng cái này)
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  // Sửa thành string để linh hoạt hơn (không chỉ định cứng A|B|C|D nữa)
  correctAnswer?: string; 

  // --- Dành cho PHẦN II: Đúng / Sai (Mới) ---
  trueFalseOptions?: {
    id: string;   // 'a', 'b', 'c', 'd'
    text: string; // Nội dung mệnh đề
    isCorrect: boolean; 
  }[];

  // --- Dành cho PHẦN III: Trả lời ngắn (Mới) ---
  shortAnswerCorrect?: string; 
}

export interface IAttempt extends Document {
  userId: Types.ObjectId; // Sửa any thành ObjectId
  subjectId: Types.ObjectId;
  score: number; // Điểm số (có thể là số thập phân)
  total: number; // Tổng số câu hỏi
  
  // Lưu chi tiết bài làm
  answers: {
    questionId: Types.ObjectId;
    // selectedAnswer: 
    // - Phần I: "A", "B"...
    // - Phần II: Chuỗi JSON '{"a":true, "b":false...}'
    // - Phần III: "2025", "-1.5"...
    selectedAnswer: string; 
    isCorrect: boolean;
  }[];
  
  createdAt: Date;
}