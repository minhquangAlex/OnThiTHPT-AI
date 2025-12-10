import { create } from 'zustand';
import api from '../services/api';
import type { Question, QuizResult } from '../types';
import { useAuthStore } from './useAuthStore';

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: string };
  result: (QuizResult & { subjectName?: string }) | null;
  subjectName: string | null;
  
  setQuiz: (questions: Question[], subjectName?: string) => void;
  selectAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  
  // 👇 THÊM 2 HÀM MỚI
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  
  submitQuiz: (subjectId: string) => Promise<string | null>;
  resetQuiz: () => void;
}

const initialState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  result: null,
  subjectName: null,
};

export const useQuizStore = create<QuizState>((set, get) => ({
  ...initialState,
  
  setQuiz: (questions, subjectName) => set({ ...initialState, questions, subjectName: subjectName || null }),
  
  selectAnswer: (questionId, answer) => set((state) => ({
    answers: { ...state.answers, [questionId]: answer },
  })),
  
  nextQuestion: () => set((state) => ({
    currentQuestionIndex: state.currentQuestionIndex + 1,
  })),

  // 👇 THÊM LOGIC: Quay lại câu trước
  prevQuestion: () => set((state) => ({
    currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
  })),

  // 👇 THÊM LOGIC: Nhảy đến câu bất kỳ
  goToQuestion: (index) => set(() => ({
    currentQuestionIndex: index,
  })),

  submitQuiz: async (subjectId) => {
    const { questions, answers, subjectName } = get();
    let score = 0;
    
    // Logic tính điểm sơ bộ tại frontend (để hiện ngay kết quả nếu cần)
    // Lưu ý: Logic chấm điểm chính xác vẫn nằm ở Backend
    const detailedAnswers = questions.map(q => {
      const selectedAnswer = answers[q._id];
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) score++; // Logic này chỉ đúng với trắc nghiệm đơn giản
      return { 
        questionId: q._id,
        selectedAnswer, 
        isCorrect 
      };
    });

    const result: QuizResult & { subjectName?: string } = {
      subjectId,
      subjectName: subjectName || undefined,
      score,
      totalQuestions: questions.length,
      answers,
      timestamp: Date.now(),
    };
    set({ result });

    try {
      const auth = useAuthStore.getState();
      const payload = { 
        userId: auth.user?._id, 
        subjectId, 
        score, 
        total: questions.length, 
        answers: detailedAnswers 
      };

      console.log('SUBMITTING:', payload);
      const response = await api.recordAttempt(payload);
      return response._id;
    } catch (err) {
      console.error('FAILED TO SAVE ATTEMPT:', err);
      return null;
    }
  },
  resetQuiz: () => set(initialState),
}));