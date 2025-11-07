import { Schema, model, Types } from 'mongoose';
import { IAttempt } from '../types';

const attemptSchema = new Schema<IAttempt>(
  {
    userId: { type: Types.ObjectId, ref: 'User' },
    subjectId: { type: Types.ObjectId, ref: 'Subject', index: true },
    score: { type: Number },
    total: { type: Number },
    answers: [
      {
        questionId: { type: Types.ObjectId, ref: 'Question' },
        selectedAnswer: { type: String },
        isCorrect: { type: Boolean },
      },
    ],
  },
  { timestamps: true }
);

export const Attempt = model<IAttempt>('Attempt', attemptSchema);
