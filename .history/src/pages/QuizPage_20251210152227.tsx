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
import { Question } from '../types';

// --- HÀM HELPER: Lấy đường dẫn ảnh đầy đủ từ Backend ---
const getFullImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;

  // Lấy API URL từ biến môi trường hoặc fallback cứng
  const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://undisputedly-nonsocialistic-sheba.ngrok-free.dev/api';
  
  // Cắt bỏ đuôi '/api' để lấy domain gốc của backend (nơi chứa folder uploads)
  const rootUrl = apiUrl.replace(/\/api\/?$/, '');
  
  return `${rootUrl}${imagePath}`;
};

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
            navigate('/dashboard'); 
          }
        })();
    }
  };
  
  const { displayTime } = useTimer(questions.length * 60 || 600, handleTimeout); // Default 10 mins if 0

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
  }, [subjectId]);

  const currentQuestion = questions[currentQuestionIndex];
  // Lấy câu trả lời hiện tại từ store (có thể là string hoặc JSON string)
  const selectedAnswerRaw = currentQuestion ? answers[currentQuestion._id] : null;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      if (subjectId && !isSubmitting) {
        (async () => {
          setIsSubmitting(true);
          const attemptId = await submitQuiz(subjectId);
          if (attemptId) {
            navigate(`/results/${attemptId}`, { state: { fromQuizCompletion: true } });
          } else {
            navigate('/dashboard'); 
          }
        })();
      }
    }
  };

  // --- HÀM RENDER GIAO DIỆN NHẬP LIỆU ---
  const renderAnswerInput = (question: Question) => {
    // 1. TRẮC NGHIỆM 4 LỰA CHỌN (Phần I)
    // (Mặc định nếu không có type thì coi là multiple_choice để tương thích ngược)
    if (!question.type || question.type === 'multiple_choice') {
      return (
        <div className="space-y-4">
          {['A', 'B', 'C', 'D'].map((key) => (
            <button
              key={key}
              onClick={() => selectAnswer(question._id, key)}
              className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                selectedAnswerRaw === key
                  ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 ring-2 ring-indigo-500 shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="font-bold mr-2 text-indigo-600 dark:text-indigo-400">{key}.</span>
              <span className="text-slate-800 dark:text-slate-200">
                {question.options?.[key as keyof typeof question.options]}
              </span>
            </button>
          ))}
        </div>
      );
    }

    // 2. ĐÚNG / SAI (Phần II)
    if (question.type === 'true_false') {
      // Parse dữ liệu từ store (vì store lưu string, ta cần object để hiển thị)
      let currentTF: Record<string, boolean | null> = { a: null, b: null, c: null, d: null };
      try {
        if (selectedAnswerRaw) currentTF = JSON.parse(selectedAnswerRaw);
      } catch (e) { /* ignore error */ }

      const handleTFChange = (id: string, value: boolean) => {
        const newValue = { ...currentTF, [id]: value };
        // Lưu lại vào store dưới dạng chuỗi JSON
        selectAnswer(question._id, JSON.stringify(newValue));
      };

      return (
        <div className="space-y-4">
          {question.trueFalseOptions?.map((opt) => (
            <div key={opt.id} className="p-4 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <span className="font-bold mr-2 text-indigo-600 uppercase">{opt.id})</span>
                <span className="text-slate-800 dark:text-slate-200">{opt.text}</span>
              </div>
              <div className="flex gap-4 shrink-0">
                {/* Nút Đúng */}
                <label className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded border transition-colors ${currentTF[opt.id] === true ? 'bg-green-100 border-green-500 text-green-700' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name={`tf-${question._id}-${opt.id}`} 
                    className="hidden"
                    checked={currentTF[opt.id] === true}
                    onChange={() => handleTFChange(opt.id, true)}
                  />
                  <span className="font-bold">Đúng</span>
                </label>
                
                {/* Nút Sai */}
                <label className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded border transition-colors ${currentTF[opt.id] === false ? 'bg-red-100 border-red-500 text-red-700' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name={`tf-${question._id}-${opt.id}`} 
                    className="hidden"
                    checked={currentTF[opt.id] === false}
                    onChange={() => handleTFChange(opt.id, false)}
                  />
                  <span className="font-bold">Sai</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 3. TRẢ LỜI NGẮN (Phần III)
    if (question.type === 'short_answer') {
      return (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nhập kết quả của bạn (Số thập phân hoặc số nguyên):
          </label>
          <input
            type="text"
            value={selectedAnswerRaw || ''}
            onChange={(e) => selectAnswer(question._id, e.target.value)}
            placeholder="Ví dụ: 2025 hoặc -1.5"
            className="w-full p-4 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none text-lg font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          />
          <p className="text-xs text-slate-500 mt-2 italic">
            * Lưu ý: Điền chính xác con số, dùng dấu chấm (.) cho số thập phân.
          </p>
        </div>
      );
    }

    return <p className="text-red-500">Loại câu hỏi không hỗ trợ hiển thị.</p>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Chưa có câu hỏi</h2>
        <Button onClick={() => navigate('/dashboard')}>Quay về trang chính</Button>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }
  
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <Card>
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Câu {currentQuestionIndex + 1}/{questions.length}
            </h2>
            {/* Badge hiển thị loại phần thi */}
            <span className={`text-xs font-bold px-2 py-1 rounded mt-1 inline-block ${
              currentQuestion.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
              currentQuestion.type === 'short_answer' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {currentQuestion.type === 'true_false' ? 'PHẦN II: ĐÚNG / SAI' : 
               currentQuestion.type === 'short_answer' ? 'PHẦN III: TRẢ LỜI NGẮN' : 
               'PHẦN I: TRẮC NGHIỆM'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-red-600 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900 shadow-sm">
              <TimerIcon className="h-5 w-5" />
              <span>{displayTime}</span>
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="p-6">
          
          {/* Ảnh câu hỏi (Nếu có) */}
          {currentQuestion.imageUrl && (
            <div className="mb-6 flex justify-center">
              <NgrokImage 
                src={getFullImageUrl(currentQuestion.imageUrl) || ''} 
                alt="Hình minh họa" 
                className="max-h-[350px] max-w-full object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            </div>
          )}

          {/* Text câu hỏi */}
          {currentQuestion.questionText && (
            <p className="text-lg mb-6 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
              {currentQuestion.questionText}
            </p>
          )}

          {/* Render vùng nhập câu trả lời tùy biến */}
          {renderAnswerInput(currentQuestion)}

        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
           <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
               <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
           </div>
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3 text-base">
              {isSubmitting ? <Spinner size="sm" /> : (currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo ➜' : 'Nộp bài ✅')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuizPage;