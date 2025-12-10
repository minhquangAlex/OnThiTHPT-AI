import { Schema, model } from 'mongoose';
import { IAttempt } from '../types';

const attemptSchema = new Schema<IAttempt>(
  {
    // Sử dụng Schema.Types.ObjectId thay vì Types.ObjectId
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        // selectedAnswer lưu chuỗi (A/B/C/D hoặc JSON string cho đúng sai hoặc số text cho tự luận)
        selectedAnswer: { type: String, required: true }, 
        isCorrect: { type: Boolean, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Attempt = model<IAttempt>('Attempt', attemptSchema);