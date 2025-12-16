// backend/src/models/Question.ts
import { Schema, model } from 'mongoose';
import { IQuestion } from '../types';

const questionSchema = new Schema<IQuestion>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  
  // 1. Loại câu hỏi
  type: { 
    type: String, 
    enum: ['multiple_choice', 'true_false', 'short_answer'], 
    default: 'multiple_choice',
    required: true 
  },

  // 2. Nội dung (Text bắt buộc nếu ko có ảnh)
  questionText: { 
    type: String, 
    required: function(this: any) { return !this.imageUrl; } 
  },
  imageUrl: { type: String },

  // 3. Phần I
  options: {
    A: String, B: String, C: String, D: String
  },
  correctAnswer: { type: String },

  // 4. Phần II (Mới)
  trueFalseOptions: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }],

  // 5. Phần III (Mới)
  shortAnswerCorrect: { type: String },

  explanation: { type: String, required: false }, 
  
}, { timestamps: true });

export const Question = model<IQuestion>('Question', questionSchema);