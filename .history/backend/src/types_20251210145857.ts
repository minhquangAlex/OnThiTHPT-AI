Dựa trên cấu trúc đề thi mới (2025) mà chúng ta đã thảo luận (gồm 3 phần), và nội dung file cũ của bạn, đây là nội dung file types.ts dành cho Backend (vì tôi thấy bạn đang import mongoose).

Tôi đã thực hiện các thay đổi sau:

Thêm QuestionType.

Cập nhật IQuestion:

Thêm trường type.

Biến options và correctAnswer thành không bắt buộc (?) (vì câu hỏi Tự luận/Đúng Sai không dùng cấu trúc này).

Thêm trueFalseOptions cho Phần II.

Thêm shortAnswerCorrect cho Phần III.

Cập nhật IAttempt để questionId rõ ràng hơn là ObjectId.

Nội dung cập nhật file types.ts (Backend)
code
TypeScript
download
content_copy
expand_less
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
⚠️ Lưu ý quan trọng:

File này chứa import { Document } from 'mongoose', nên nó CHỈ ĐƯỢC DÙNG Ở BACKEND.

Nếu bạn dùng file này ở Frontend (React), trang web sẽ bị lỗi trắng trang (vì trình duyệt không hiểu mongoose).

Nếu bạn cần file types.ts cho Frontend, hãy dùng phiên bản không có mongoose mà tôi đã gửi ở các câu trả lời trước (chỉ dùng interface thuần túy).