import { Schema, model } from 'mongoose';
import { IQuestion } from '../types';

const questionSchema = new Schema<IQuestion>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  questionText: { type: String, 
   required: function(this: any) {
      return !this.imageUrl; 
    } },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  correctAnswer: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
  explanation: { type: String, required: true },
  imageUrl: { type: String },
});
export const Question = model<IQuestion>('Question', questionSchema);
