import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { TimerIcon } from '../components/icons/CoreIcons';
import Spinner from '../components/Spinner';
import { useTimer } from '../hooks/useTimer';
import api from '../services/api';
import { useQuizStore } from '../store/useQuizStore';

const QuizPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const subjectName = (location.state as any)?.subjectName;
  const navigate = useNavigate();
  const {
    questions,
    currentQuestionIndex,
    answers,
    setQuiz,
    selectAnswer,
    nextQuestion,
    submitQuiz,
    resetQuiz,
  } = useQuizStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm helper để submit và điều hướng
  const performSubmit = async () => {
    if (subjectId && !isSubmitting) {
      setIsSubmitting(true);
      const attemptId = await submitQuiz(subjectId);
      if (attemptId) {
        navigate(`/results/${attemptId}`, { state: { fromQuizCompletion: true } });
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleTimeout = () => {
    performSubmit();
  };
  
  const { displayTime } = useTimer(questions.length * 60, handleTimeout);

  useEffect(() => {
    const startQuiz = async () => {
      if (subjectId && subjectId !== 'ai-generated') {
        setIsLoading(true);
        try {
          const fetchedQuestions = await api.getQuestions(subjectId);
          setQuiz(fetchedQuestions, subjectName);
        } catch (error) {
          console.error("Failed to fetch questions:", error);
          alert("Không thể tải câu hỏi. Vui lòng thử lại.");
          navigate('/dashboard');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    if (subjectId !== 'ai-generated') {
      resetQuiz();
    }
    startQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, setQuiz, resetQuiz]);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  const handleSelectAnswer = (answer: string) => {
    if (currentQuestion) {
      selectAnswer(currentQuestion.id, answer);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      performSubmit();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Chưa có câu hỏi</h2>
        <Button onClick={() => navigate('/dashboard')}>Quay về trang chính</Button>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }
  
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  // SỬA LỖI 2: Chuẩn hóa việc hiển thị Options để tránh lỗi sai key
  // Tạo mảng các nhãn chuẩn
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']; 

  // Hàm để lấy danh sách options chuẩn hóa (dù input là Array hay Object)
  const getNormalizedOptions = (options: any) => {
    if (Array.isArray(options)) {
      // Nếu là mảng ["Nội dung A", "Nội dung B"...]
      return options.map((value, index) => ({
        key: OPTION_LABELS[index] || String(index), // Dùng nhãn A, B, C...
        value: value
      }));
    } else if (typeof options === 'object' && options !== null) {
      // Nếu là object { A: "Nội dung A", B: "Nội dung B" ... }
      // Hoặc object { "0": "Nội dung A", "1": "Nội dung B" ... }
      return Object.entries(options).map(([k, v], index) => {
          // Kiểm tra xem key có phải là số (0, 1, 2...) không. Nếu phải thì chuyển sang A, B, C...
          const isNumericKey = !isNaN(parseInt(k));
          const normalizedKey = isNumericKey ? (OPTION_LABELS[index] || k) : k;
          return {
              key: normalizedKey,
              value: v as string
          };
      });
    }
    return [];
  };

  const normalizedOptions = getNormalizedOptions(currentQuestion.options);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Câu {currentQuestionIndex + 1}/{questions.length}</h2>
          <div className="flex items-center space-x-2 text-red-500 font-semibold">
              <TimerIcon className="h-6 w-6" />
              <span>{displayTime}</span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-lg mb-6 whitespace-pre-wrap">{currentQuestion.questionText}</p>
          <div className="space-y-4">
            {normalizedOptions.map(({ key, value }) => (
              <button
                key={key}
                onClick={() => handleSelectAnswer(key)}
                className={`w-full text-left p-4 border rounded-lg transition-colors duration-200 flex ${
                  selectedAnswer === key
                    ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 ring-2 ring-indigo-500'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="font-bold mr-3 min-w-[24px]">{key}.</span>
                <span>{value}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 border-t dark:border-slate-700">
           <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4">
               <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
           </div>
          <Button onClick={handleNext} disabled={!selectedAnswer || isSubmitting} className="w-full">
            {isSubmitting ? <Spinner size="sm" /> : (currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Nộp bài')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuizPage;