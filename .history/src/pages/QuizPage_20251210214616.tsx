import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Grid, X, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'; // Cài: npm install lucide-react
import Button from '../components/Button';
import Card from '../components/Card';
import { TimerIcon } from '../components/icons/CoreIcons';
import Spinner from '../components/Spinner';
import { useTimer } from '../hooks/useTimer';
import api from '../services/api';
import { useQuizStore } from '../store/useQuizStore';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import QuestionPalette from '../components/QuestionPalette';

// Hàm helper lấy ảnh
const getFullImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://undisputedly-nonsocialistic-sheba.ngrok-free.dev/api';
  const rootUrl = apiUrl.replace(/\/api\/?$/, '');
  return `${rootUrl}${imagePath}`;
};

const QuizPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    setQuiz,
    selectAnswer,
    nextQuestion,
    prevQuestion, // <--- MỚI
    goToQuestion, // <--- MỚI
    submitQuiz,
    resetQuiz,
  } = useQuizStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false); // State bật tắt bảng câu hỏi

  const handleTimeout = () => {
    if (subjectId) {
        (async () => {
          if (isSubmitting) return;
          setIsSubmitting(true);
          const attemptId = await submitQuiz(subjectId);
          if (attemptId) navigate(`/results/${attemptId}`, { state: { fromQuizCompletion: true } });
          else navigate('/dashboard');
        })();
    }
  };
  
  const { displayTime } = useTimer(questions.length * 60 || 600, handleTimeout);

  useEffect(() => {
    const startQuiz = async () => {
      if (subjectId && subjectId !== 'ai-generated') {
        setIsLoading(true);
        try {
          const fetchedQuestions = await api.getQuestions(subjectId);
          setQuiz(fetchedQuestions, '');
        } catch (error) {
          console.error("Failed:", error);
          alert("Lỗi tải câu hỏi.");
          navigate('/dashboard'); 
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    if (subjectId !== 'ai-generated') resetQuiz();
    startQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswerRaw = currentQuestion ? answers[currentQuestion._id] : null;

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const attemptId = await submitQuiz(subjectId!);
    if (attemptId) navigate(`/results/${attemptId}`, { state: { fromQuizCompletion: true } });
    else navigate('/dashboard');
  };

  // Nút điều hướng
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) nextQuestion();
  };
  
  const handlePrev = () => {
    if (currentQuestionIndex > 0) prevQuestion();
  };

  // Chọn câu từ bảng
  const handlePaletteSelect = (index: number) => {
    goToQuestion(index);
    setIsPaletteOpen(false);
  };

  // --- RENDER GIAO DIỆN NHẬP LIỆU ---
  const renderAnswerInput = (question: Question) => {
    // 1. Trắc nghiệm
    if (!question.type || question.type === 'multiple_choice') {
      return (
        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((key) => (
            <button
              key={key}
              onClick={() => selectAnswer(question._id, key)}
              className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center ${
                selectedAnswerRaw === key
                  ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 dark:bg-indigo-900/30'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 border ${
                 selectedAnswerRaw === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}>
                {key}
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {question.options?.[key as keyof typeof question.options]}
              </span>
            </button>
          ))}
        </div>
      );
    }
    // 2. Đúng Sai
    if (question.type === 'true_false') {
      let currentTF: any = { a: null, b: null, c: null, d: null };
      try { if (selectedAnswerRaw) currentTF = JSON.parse(selectedAnswerRaw); } catch {}
      return (
        <div className="space-y-4">
          {question.trueFalseOptions?.map((opt) => (
            <div key={opt.id} className="p-3 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2">
              <span className="flex-1 font-medium text-sm sm:text-base"><span className="text-indigo-600 font-bold mr-1 uppercase">{opt.id})</span> {opt.text}</span>
              <div className="flex gap-2 shrink-0">
                <label className={`cursor-pointer px-4 py-2 border rounded-md text-sm font-bold transition-all ${currentTF[opt.id] === true ? 'bg-green-100 border-green-500 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" className="hidden" checked={currentTF[opt.id] === true} onChange={() => selectAnswer(question._id, JSON.stringify({ ...currentTF, [opt.id]: true }))} /> Đúng
                </label>
                <label className={`cursor-pointer px-4 py-2 border rounded-md text-sm font-bold transition-all ${currentTF[opt.id] === false ? 'bg-red-100 border-red-500 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" className="hidden" checked={currentTF[opt.id] === false} onChange={() => selectAnswer(question._id, JSON.stringify({ ...currentTF, [opt.id]: false }))} /> Sai
                </label>
              </div>
            </div>
          ))}
        </div>
      );
    }
    // 3. Trả lời ngắn
    if (question.type === 'short_answer') {
      return (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Đáp án số của bạn:</label>
          <input type="text" value={selectedAnswerRaw || ''} onChange={(e) => selectAnswer(question._id, e.target.value)} placeholder="Ví dụ: 2025" 
            className="w-full p-4 border-2 border-indigo-200 rounded-lg text-xl font-bold outline-none focus:border-indigo-500 text-center tracking-widest text-indigo-700" />
        </div>
      );
    }
    return <p>Loại câu hỏi không hỗ trợ.</p>;
  };

  if (isLoading || !currentQuestion) return <div className="flex h-screen items-center justify-center"><Spinner /></div>;

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto py-4 px-4 sm:py-8 relative">
      
      {/* --- MODAL BẢNG CÂU HỎI (Trượt từ phải sang) --- */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsPaletteOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Danh sách câu hỏi</h3>
              <button onClick={() => setIsPaletteOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            {/* Component Bảng câu hỏi */}
            <QuestionPalette 
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              answers={answers}
              questions={questions}
              onSelect={handlePaletteSelect}
              onSubmit={handleSubmitQuiz}
            />
          </div>
        </div>
      )}

      {/* --- GIAO DIỆN CHÍNH --- */}
      <div className="max-w-3xl mx-auto">
        <Card className="min-h-[500px] flex flex-col relative shadow-xl border-0">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-lg sticky top-0 z-10">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Câu hỏi {currentQuestionIndex + 1} / {questions.length}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block uppercase w-fit ${
                  currentQuestion.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
                  currentQuestion.type === 'short_answer' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {currentQuestion.type === 'true_false' ? 'Đúng/Sai' : currentQuestion.type === 'short_answer' ? 'Tự luận' : 'Trắc nghiệm'}
                </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-red-600 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900 shadow-sm">
                <TimerIcon className="h-5 w-5" />
                <span>{displayTime}</span>
              </div>
              <button onClick={() => setIsPaletteOpen(true)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2" title="Mở danh sách câu hỏi">
                <Grid className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Danh sách</span>
              </button>
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="p-6 sm:p-8 flex-1">
            {currentQuestion.imageUrl && (
              <div className="mb-6 flex justify-center">
                <NgrokImage src={getFullImageUrl(currentQuestion.imageUrl) || ''} className="max-h-[350px] max-w-full object-contain rounded-lg border shadow-sm bg-white" />
              </div>
            )}

            {currentQuestion.questionText && (
              <p className="text-lg sm:text-xl mb-8 whitespace-pre-wrap leading-relaxed font-medium text-slate-800 dark:text-slate-100">
                {currentQuestion.questionText}
              </p>
            )}

            {renderAnswerInput(currentQuestion)}
          </div>

          {/* Footer Navigation */}
          <div className="p-4 sm:p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
            {/* Thanh tiến độ */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-6 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center gap-4">
              <Button onClick={handlePrev} variant="secondary" disabled={currentQuestionIndex === 0} className="w-32 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz} className="w-32 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Nộp bài
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-32 flex items-center justify-center gap-2">
                  Tiếp theo <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuizPage;