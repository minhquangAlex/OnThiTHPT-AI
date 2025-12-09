import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuizStore } from '../store/useQuizStore';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { CheckCircleIcon, XCircleIcon } from '../components/icons/CoreIcons';
import { Question } from '../types';
// Import hàm helper
import { getFullImageUrl } from '../utils/imageHelper';

interface DisplayableResult {
  score: number;
  total: number;
  subjectId: string;
  subjectName?: string;
  userName?: string;
  answers: Array<{
    question: Question;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
}

const ResultsPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fromQuizCompletion } = (location.state || {}) as { fromQuizCompletion?: boolean };

  const { result: storeResult, questions: storeQuestions, resetQuiz } = useQuizStore();

  const [displayData, setDisplayData] = useState<DisplayableResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attemptId) {
      setLoading(true);
      setError(null);
      const fetchAttempt = async () => {
        try {
          const fetchedAttempt = await api.getAttemptById(attemptId);
          if (fetchedAttempt && fetchedAttempt.answers) {
            setDisplayData({
              score: fetchedAttempt.score,
              total: fetchedAttempt.total,
              subjectId: fetchedAttempt.subjectId?.slug || 'unknown',
              subjectName: fetchedAttempt.subjectId?.name || 'Môn học',
              userName: fetchedAttempt.userId?.name,
              answers: fetchedAttempt.answers.map((a: any) => ({
                question: a.questionId,
                selectedAnswer: a.selectedAnswer,
                isCorrect: a.isCorrect,
              })).filter((a: any) => a.question),
            });
          } else {
            setDisplayData(null);
            setError('Không tìm thấy dữ liệu cho lượt làm bài này.');
          }
        } catch (err: any) {
          setDisplayData(null);
          setError(err.message || 'Lỗi khi tải kết quả.');
        } finally {
          setLoading(false);
        }
      };
      fetchAttempt();
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) {
      if (storeResult) {
        setDisplayData({
          score: storeResult.score,
          total: storeResult.totalQuestions,
          subjectId: storeResult.subjectId,
          subjectName: storeResult.subjectName,
          answers: storeQuestions.map(q => {
            const selectedAnswer = storeResult.answers[q._id];
            return {
              question: q,
              selectedAnswer,
              isCorrect: selectedAnswer === q.correctAnswer,
            };
          }),
        });
        setLoading(false);
      } else {
        setDisplayData(null);
        setLoading(false);
      }
    }
  }, [attemptId, storeResult, storeQuestions]);


  const handleRetake = () => {
    resetQuiz();
    if (displayData) {
      navigate(`/quiz/${displayData.subjectId}`, { state: { subjectName: displayData.subjectName } });
    }
  };

  const handleBackToDashboard = () => {
    resetQuiz();
    navigate('/dashboard');
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (!displayData) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold">Không có kết quả.</h2>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">Quay về trang chính</Button>
      </div>
    );
  }

  const { score, total, userName, answers, subjectName } = displayData;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const chartData = [{ name: 'Đúng', value: score }, { name: 'Sai', value: total - score }];
  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="p-8 mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">Kết quả bài làm{subjectName ? `: ${subjectName}` : ''}</h1>
        {userName && <p className="text-center text-slate-500">Thí sinh: {userName}</p>}
        <div className="flex flex-col md:flex-row items-center justify-around mt-6">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer minHeight={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center md:text-left mt-4 md:mt-0">
            <p className="text-lg text-slate-600 dark:text-slate-300">Điểm số đạt được:</p>
            <p className={`text-6xl font-bold my-2 ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</p>
            <p className="text-xl font-medium text-slate-700 dark:text-slate-200">{score} / {total} câu đúng</p>
          </div>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          {fromQuizCompletion && <Button onClick={handleRetake}>Làm lại đề này</Button>}
          <Button onClick={handleBackToDashboard} variant="secondary">Về trang chủ</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Chi tiết đáp án</h2>
        <div className="space-y-8">
          {answers.map(({ question, selectedAnswer }, index) => (
            <div key={question.id || question._id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              
              <div className="mb-4">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">Câu {index + 1}:</span>
                
                {/* --- KHU VỰC HIỂN THỊ ẢNH (MỚI) --- */}
                {question.imageUrl && (
                  <div className="my-3 flex justify-start">
                    <img 
                      src={getFullImageUrl(question.imageUrl)} 
                      alt="Đề bài" 
                      className="max-h-[250px] object-contain rounded-lg border border-slate-300 dark:border-slate-600 bg-white"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                )}
                {/* ---------------------------------- */}

                {question.questionText && <span className="text-slate-800 dark:text-slate-200 font-medium">{question.questionText}</span>}
              </div>

              <div className="space-y-2 text-sm pl-2">
                {Object.entries(question.options).map(([key, value]) => {
                  const isCorrectOption = key === question.correctAnswer;
                  const isUserChoice = key === selectedAnswer;
                  let optionClass = "flex items-center p-3 rounded-lg border transition-colors ";
                  
                  if (isCorrectOption) {
                    optionClass += "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-100";
                  } else if (isUserChoice && !isCorrectOption) {
                    optionClass += "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-100";
                  } else {
                    optionClass += "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300";
                  }

                  return (
                    <div key={key} className={optionClass}>
                      <div className="flex-shrink-0 w-6">
                        {isCorrectOption && <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
                        {!isCorrectOption && isUserChoice && <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
                      </div>
                      <span className="font-bold mr-2 w-4">{key}.</span> 
                      <span>{value}</span>
                    </div>
                  );
                })}
              </div>
              
              {question.explanation && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-lg text-sm text-slate-700 dark:text-slate-300">
                  <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">💡 Giải thích:</p>
                  {question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ResultsPage;