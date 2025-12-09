import { Schema, model } from 'mongoose';
import { IQuestion } from '../types';

const questionSchema = new Schema<IQuestion>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  
  // SỬA ĐOẠN NÀY:
  questionText: { 
    type: String, 
    // Logic: Nếu không có ảnh (imageUrl rỗng) thì bắt buộc phải nhập text. 
    // Nếu có ảnh rồi thì text có thể để trống.
    required: function(this: any) {
      return !this.imageUrl; 
    } 
  },
  
  // Đảm bảo trường imageUrl được khai báo
  imageUrl: { type: String }, 

  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  correctAnswer: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
  
  // Explanation có thể không bắt buộc (tùy bạn, nhưng nên để false để tránh lỗi nếu lười nhập)
  explanation: { type: String, required: false }, 
});

export const Question = model<IQuestion>('Question', questionSchema);