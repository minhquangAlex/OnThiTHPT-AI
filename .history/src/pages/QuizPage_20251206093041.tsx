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
  

  const handleTimeout = () => {
    if (subjectId) {
        (async () => {
          if (isSubmitting) return;
          setIsSubmitting(true);
          const attemptId = await submitQuiz(subjectId);
          if (attemptId) {
            navigate(`/results/${attemptId}`, { state: { fromQuizCompletion: true } });
          } else {
            // Fallback or error handling if attemptId is not returned
            navigate('/dashboard'); // Or show an error message
          }
        })();
    }
  };
  
  const { displayTime } = useTimer(questions.length * 60, handleTimeout); // 1 minute per question

  useEffect(() => {
    const startQuiz = async () => {
      if (subjectId && subjectId !== 'ai-generated') {
        setIsLoading(true);
        try {
          const fetchedQuestions = await api.getQuestions(subjectId);
          setQuiz(fetchedQuestions, subjectName);
        } catch (error) {
          console.error("Failed to fetch questions:", error);
          alert("Không thể tải được câu hỏi cho môn học này. Vui lòng thử lại.");
          navigate('/dashboard'); // Navigate back if questions can't be loaded
        } finally {
          setIsLoading(false);
        }
      } else {
        // For AI generated quizzes, questions are already in the store
        setIsLoading(false);
      }
    };
    
    // Reset previous quiz state when starting a new one, unless it's an AI quiz
    if (subjectId !== 'ai-generated') {
      resetQuiz();
    }
    startQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, setQuiz, resetQuiz]);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion._id] : null;  // ← SỬA: _id thay vì id

  const handleSelectAnswer = (answer: string) => {
    if (currentQuestion) {
      selectAnswer(currentQuestion._id, answer);  // ← SỬA: _id thay vì id
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      if (subjectId) {
        (async () => {
          if (isSubmitting) return;
          setIsSubmitting(true);
          const attemptId = await submitQuiz(subjectId);
          if (attemptId) {
            navigate(`/results/${attemptId}`, { state: { fromQuizCompletion: true } });
          } else {
            // Fallback or error handling if attemptId is not returned
            navigate('/dashboard'); // Or show an error message
          }
        })();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Handle case where there are no questions for the subject
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Chưa có câu hỏi</h2>
        <p className="mb-6">Hiện tại chưa có câu hỏi nào cho môn học này. Vui lòng quay lại sau.</p>
        <Button onClick={() => navigate('/dashboard')}>Quay về trang chính</Button>
      </div>
    );
  }
  
  if (!currentQuestion) {
    // This case might happen briefly or if something is wrong, but the above check is more specific.
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }
  
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Câu hỏi {currentQuestionIndex + 1}/{questions.length}</h2>
          <div className="flex items-center space-x-2 text-red-500 font-semibold">
              <TimerIcon className="h-6 w-6" />
              <span>{displayTime}</span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-lg mb-6">{currentQuestion.questionText}</p>
          <div className="space-y-4">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSelectAnswer(key)}
                className={`w-full text-left p-4 border rounded-lg transition-colors duration-200 ${
                  selectedAnswer === key
                    ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 ring-2 ring-indigo-500'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="font-bold mr-2">{key}.</span>
                {value}
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