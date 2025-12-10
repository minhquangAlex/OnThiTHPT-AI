import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  title: string;          // VD: "Đề thi thử Tốt nghiệp 2025 - Số 1"
  subjectId: mongoose.Types.ObjectId;
  questions: mongoose.Types.ObjectId[]; // Danh sách ID các câu hỏi trong đề
  duration: number;       // Thời gian làm bài (phút)
  type: 'fixed' | 'random'; // Đề cố định hay đề ngẫu nhiên
  createdAt: Date;
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  duration: { type: Number, required: true },
  type: { type: String, enum: ['fixed', 'random'], default: 'fixed' },
}, { timestamps: true });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);