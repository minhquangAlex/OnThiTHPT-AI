import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
  title: string;
  subjectId: mongoose.Types.ObjectId;
  questions: mongoose.Types.ObjectId[];
  duration: number;
  type: 'fixed' | 'random';
  createdAt: Date;
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  duration: { type: Number, required: true },
  type: { type: String, enum: ['fixed', 'random'], default: 'fixed' },
}, { timestamps: true });

// 👇 QUAN TRỌNG: Phải dùng 'export const', KHÔNG dùng 'export default'
export const Exam = mongoose.model<IExam>('Exam', ExamSchema);