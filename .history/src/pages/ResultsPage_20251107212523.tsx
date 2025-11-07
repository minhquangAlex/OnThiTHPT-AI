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

// Define a unified structure for the result data to be displayed
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
          console.log('--- [DEBUG] ResultsPage - fetchedAttempt:', fetchedAttempt);
          if (fetchedAttempt && fetchedAttempt.answers) {
            setDisplayData({
              score: fetchedAttempt.score,
              total: fetchedAttempt.total,
              subjectId: fetchedAttempt.subjectId.slug,
              subjectName: fetchedAttempt.subjectId.name,
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
          if (err.response) {
            if (err.response.status === 404) {
              setError('Không tìm thấy lượt làm bài với ID đã cung cấp.');
            } else if (err.response.status === 403) {
              setError('Bạn không có quyền truy cập vào lượt làm bài này.');
            } else {
              setError(err.response.data?.message || 'Lỗi khi tải kết quả.');
            }
          } else {
            setError(err.message || 'Lỗi mạng hoặc lỗi không xác định.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchAttempt();
    }
  }, [attemptId]);

  // Effect 2: For showing data from the store when no ID is in the URL
  useEffect(() => {
    if (!attemptId) {
      if (storeResult) {
        setDisplayData({
          score: storeResult.score,
          total: storeResult.totalQuestions,
          subjectId: storeResult.subjectId,
          subjectName: storeResult.subjectName,
          answers: storeQuestions.map(q => {
            const selectedAnswer = storeResult.answers[q._id];  // ← SỬA: q._id thay vì q.id
            return {
              question: q,
              selectedAnswer,
              isCorrect: selectedAnswer === q.correctAnswer,
            };
          }),
        });
        setLoading(false);
      } else {
        // No ID and no store result -> show nothing.
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

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (!displayData) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Không có kết quả để hiển thị.</h2>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Quay về trang chính
        </Button>
      </div>
    );
  }

  const { score, total, userName, answers, subjectName } = displayData;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const chartData = [
    { name: 'Đúng', value: score },
    { name: 'Sai', value: total - score },
  ];
  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-8 mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">Kết quả bài làm{subjectName ? `: ${subjectName}` : ''}</h1>
        {userName && <p className="text-center text-slate-500">Lượt làm của: {userName}</p>}
        <div className="flex flex-col md:flex-row items-center justify-around">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer minHeight={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center md:text-left">
            <p className="text-lg">Tỉ lệ đúng:</p>
            <p className={`text-6xl font-bold ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</p>
            <p className="text-xl text-slate-600 dark:text-slate-400">({score} / {total} câu)</p>
          </div>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          {fromQuizCompletion && <Button onClick={handleRetake}>Làm lại</Button>}
          <Button onClick={handleBackToDashboard} variant="secondary">Về trang chính</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Xem lại đáp án</h2>
        <div className="space-y-6">
          {answers.map(({ question, selectedAnswer }, index) => (
            <div key={question.id || question._id} className="p-4 rounded-md bg-slate-100 dark:bg-slate-800">
              <p className="font-semibold mb-2">Câu {index + 1}: {question.questionText}</p>
              <div className="space-y-2 text-sm">
                {Object.entries(question.options).map(([key, value]) => {
                  const isCorrectOption = key === question.correctAnswer;
                  const isUserChoice = key === selectedAnswer;
                  let optionClass = "flex items-center p-2 rounded ";
                  if (isCorrectOption) {
                    optionClass += "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
                  } else if (isUserChoice && !isCorrectOption) {
                    optionClass += "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
                  }
                  return (
                    <div key={key} className={optionClass}>
                      {isCorrectOption && <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />}
                      {!isCorrectOption && isUserChoice && <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />}
                      <span className="font-bold mr-1">{key}.</span> {value}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/50 rounded-md text-sm">
                <p><span className="font-bold">Giải thích:</span> {question.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ResultsPage;