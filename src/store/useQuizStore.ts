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
  submitQuiz: async (subjectId) => {
    const { questions, answers, subjectName } = get();
    let score = 0;
    const detailedAnswers = questions.map(q => {
      const selectedAnswer = answers[q._id];  // ← SỬA: q._id thay vì q.id
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) {
        score++;
      }
      return { 
        questionId: q._id,  // ← SỬA: q._id thay vì q.id
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

    // Fire-and-await record to backend so stats update
    try {
      const auth = useAuthStore.getState();
      const payload = { 
        userId: auth.user?._id, 
        subjectId, 
        score, 
        total: questions.length, 
        answers: detailedAnswers 
      };

      console.log('SUBMITTING ATTEMPT TO BACKEND:', payload);

      const response = await api.recordAttempt(payload);

      console.log('ATTEMPT RECORDED SUCCESSFULLY:', response);
      return response._id; // Return the ID of the newly created attempt
    } catch (err) {
      // non-blocking: log and continue
      console.error('FAILED TO SAVE ATTEMPT:', err);
      return null; // Return null if saving failed
    }
  },
  resetQuiz: () => set(initialState),
}));