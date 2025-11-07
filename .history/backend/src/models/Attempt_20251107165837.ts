import { Schema, model, Types } from 'mongoose';
import { IAttempt } from '../types';

const answerSchema = new Schema({
  questionId: { type: Types.ObjectId, ref: 'Question', required: true },
  selectedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const attemptSchema = new Schema<IAttempt>(
  {
    userId: { type: Types.ObjectId, ref: 'User' },
    subjectId: { type: Types.ObjectId, ref: 'Subject', index: true },
    score: { type: Number },
    total: { type: Number },
    answers: [answerSchema], // Use the defined answerSchema
  },
  { timestamps: true }
);

export const Attempt = model<IAttempt>('Attempt', attemptSchema);
