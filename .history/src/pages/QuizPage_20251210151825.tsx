// frontend/src/pages/QuizPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { TimerIcon } from '../components/icons/CoreIcons';
import Spinner from '../components/Spinner';
import { useTimer } from '../hooks/useTimer';
import api from '../services/api';
import { useQuizStore } from '../store/useQuizStore';
import NgrokImage from '../components/NgrokImage';
import { getFullImageUrl } from '../utils/imageHelper';
import { Question } from '../types';

const QuizPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { questions, currentQuestionIndex, answers, setQuiz, selectAnswer, nextQuestion, submitQuiz, resetQuiz } = useQuizStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Logic Timer & Load câu hỏi (Giữ nguyên logic cũ của bạn)
  const handleTimeout = () => { /* ... giữ nguyên ... */ };
  const { displayTime } = useTimer(questions.length * 60 || 600, handleTimeout);

  useEffect(() => {
    const start = async () => {
      if(subjectId && subjectId !== 'ai-generated') {
        setIsLoading(true);
        try {
          const qs = await api.getQuestions(subjectId);
          setQuiz(qs, '');
        } catch(e) { navigate('/dashboard'); }
        finally { setIsLoading(false); }
      } else setIsLoading(false);
    };
    if (subjectId !== 'ai-generated') resetQuiz();
    start();
  }, [subjectId]);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswerRaw = currentQuestion ? answers[currentQuestion._id] : null;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) nextQuestion();
    else if (!isSubmitting) {
      setIsSubmitting(true);
      submitQuiz(subjectId!).then(id => id ? navigate(`/results/${id}`, {state:{fromQuizCompletion:true}}) : navigate('/dashboard'));
    }
  };

  // --- RENDER INPUT THEO LOẠI CÂU HỎI ---
  const renderInput = (q: Question) => {
    // 1. Trắc nghiệm
    if (!q.type || q.type === 'multiple_choice') {
      return (
        <div className="space-y-3">
          {['A','B','C','D'].map(k => (
            <button key={k} onClick={() => selectAnswer(q._id, k)}
              className={`w-full text-left p-4 border rounded-lg ${selectedAnswerRaw === k ? 'bg-indigo-100 border-indigo-500' : 'hover:bg-slate-50'}`}
            >
              <span className="font-bold mr-2 text-indigo-600">{k}.</span> {q.options?.[k as keyof typeof q.options]}
            </button>
          ))}
        </div>
      );
    }
    // 2. Đúng Sai
    if (q.type === 'true_false') {
      let curr = { a: null, b: null, c: null, d: null };
      try { if(selectedAnswerRaw) curr = JSON.parse(selectedAnswerRaw); } catch {}
      return (
        <div className="space-y-3">
          {q.trueFalseOptions?.map(opt => (
            <div key={opt.id} className="flex items-center justify-between p-3 border rounded bg-white dark:bg-slate-800">
              <span className="flex-1 font-medium"><span className="text-indigo-600 mr-2">{opt.id})</span> {opt.text}</span>
              <div className="flex gap-2">
                {/* Đúng */}
                <label className={`cursor-pointer px-3 py-1 border rounded ${curr[opt.id as keyof typeof curr] === true ? 'bg-green-500 text-white' : ''}`}>
                  <input type="radio" className="hidden" checked={curr[opt.id as keyof typeof curr] === true}
                    onChange={() => selectAnswer(q._id, JSON.stringify({ ...curr, [opt.id]: true }))} /> Đúng
                </label>
                {/* Sai */}
                <label className={`cursor-pointer px-3 py-1 border rounded ${curr[opt.id as keyof typeof curr] === false ? 'bg-red-500 text-white' : ''}`}>
                  <input type="radio" className="hidden" checked={curr[opt.id as keyof typeof curr] === false}
                    onChange={() => selectAnswer(q._id, JSON.stringify({ ...curr, [opt.id]: false }))} /> Sai
                </label>
              </div>
            </div>
          ))}
        </div>
      );
    }
    // 3. Trả lời ngắn
    if (q.type === 'short_answer') {
      return (
        <div className="mt-4">
          <label className="block mb-2 font-medium">Đáp án của bạn:</label>
          <input type="text" className="w-full p-3 border-2 border-indigo-300 rounded text-lg"
            placeholder="Nhập số..."
            value={selectedAnswerRaw || ''}
            onChange={e => selectAnswer(q._id, e.target.value)}
          />
        </div>
      );
    }
  };

  if (isLoading || !currentQuestion) return <div className="h-64 flex items-center justify-center"><Spinner/></div>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <Card>
        <div className="p-6 border-b flex justify-between bg-slate-50 dark:bg-slate-800 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">Câu {currentQuestionIndex + 1}/{questions.length}</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
              {currentQuestion.type === 'true_false' ? 'Phần II: Đúng/Sai' : currentQuestion.type === 'short_answer' ? 'Phần III: Trả lời ngắn' : 'Phần I: Trắc nghiệm'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-red-600 font-bold bg-white px-3 py-1 rounded border">
            <TimerIcon className="h-5 w-5" /><span>{displayTime}</span>
          </div>
        </div>
        <div className="p-6">
          {currentQuestion.imageUrl && (
            <div className="mb-4 flex justify-center">
              <NgrokImage src={getFullImageUrl(currentQuestion.imageUrl) || ''} className="max-h-[300px] object-contain rounded" />
            </div>
          )}
          {currentQuestion.questionText && <p className="text-lg mb-6 whitespace-pre-wrap">{currentQuestion.questionText}</p>}
          
          {renderInput(currentQuestion)}
        </div>
        <div className="p-6 border-t bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end">
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm"/> : (currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Nộp bài')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
export default QuizPage;