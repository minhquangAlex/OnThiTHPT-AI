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
import NgrokImage from '../components/NgrokImage'; 
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
              isCorrect: false, // Frontend không tự tính đúng sai chính xác cho complex types, để mặc định
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

  // --- TÍNH ĐIỂM CHI TIẾT TỪNG CÂU (MỚI) ---
  const getQuestionScoreInfo = (question: Question, selectedAnswer: string) => {
    const type = question.type || 'multiple_choice';
    let earned = 0;
    let max = 0;

    if (type === 'multiple_choice') {
      max = 0.25;
      if (selectedAnswer === question.correctAnswer) earned = 0.25;
    }
    else if (type === 'short_answer') {
      max = 0.5;
      const userClean = String(selectedAnswer || '').trim().replace(',', '.').toLowerCase();
      const correctClean = String(question.shortAnswerCorrect || '').trim().replace(',', '.').toLowerCase();
      const isNumEqual = !isNaN(Number(userClean)) && !isNaN(Number(correctClean)) && Number(userClean) === Number(correctClean);
      if (userClean === correctClean || isNumEqual) earned = 0.5;
    }
    else if (type === 'true_false') {
      max = 1.0;
      let userTF: any = {};
      try { userTF = JSON.parse(selectedAnswer); } catch {}
      let correctCount = 0;
      question.trueFalseOptions?.forEach((opt: any) => {
        if (userTF[opt.id] === opt.isCorrect) correctCount++;
      });
      if (correctCount === 1) earned = 0.1;
      else if (correctCount === 2) earned = 0.25;
      else if (correctCount === 3) earned = 0.5;
      else if (correctCount === 4) earned = 1.0;
    }
    return { earned, max };
  };

  const renderResultDetail = (question: Question, selectedAnswer: string, isCorrect: boolean) => {
    if (!question.type || question.type === 'multiple_choice') {
      if (!question.options) return <div className="text-red-500">Lỗi dữ liệu câu hỏi</div>;
      return (
        <div className="space-y-2 text-sm">
          {Object.entries(question.options).map(([key, value]) => {
            const isCorrectOption = key === question.correctAnswer;
            const isUserChoice = key === selectedAnswer;
            let optionClass = "flex items-center p-3 rounded-lg border transition-colors ";
            if (isCorrectOption) optionClass += "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-100";
            else if (isUserChoice && !isCorrectOption) optionClass += "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-100";
            else optionClass += "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300";

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
      );
    }

    if (question.type === 'true_false') {
      let userSelection: any = {};
      try { userSelection = JSON.parse(selectedAnswer); } catch {}
      return (
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-xs text-slate-500 px-2 mb-1">
            <span>Nội dung mệnh đề</span><span>Lựa chọn của bạn</span>
          </div>
          {question.trueFalseOptions?.map((opt) => {
            const userVal = userSelection[opt.id];
            const correctVal = opt.isCorrect;
            const isSubCorrect = userVal === correctVal;
            const isUnanswered = userVal === undefined || userVal === null;
            return (
              <div key={opt.id} className={`p-3 border rounded flex items-center justify-between gap-3 transition-colors ${
                  isUnanswered ? 'bg-slate-50 border-slate-200' : 
                  isSubCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                <div className="flex-1 flex items-start gap-2">
                  <span className={`font-bold uppercase w-4 shrink-0 ${isSubCorrect ? 'text-green-600' : (isUnanswered ? 'text-slate-500' : 'text-red-500')}`}>{opt.id})</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{opt.text}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-1 ${
                    userVal === true ? (correctVal === true ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500') : (correctVal === true && !isSubCorrect && !isUnanswered ? 'bg-white text-green-600 border-green-600 border-dashed opacity-70' : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50')
                  }`}>
                    {userVal === true && (correctVal === true ? <CheckCircleIcon className="w-3 h-3"/> : <XCircleIcon className="w-3 h-3"/>)} Đúng
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-1 ${
                    userVal === false ? (correctVal === false ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500') : (correctVal === false && !isSubCorrect && !isUnanswered ? 'bg-white text-green-600 border-green-600 border-dashed opacity-70' : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50')
                  }`}>
                    {userVal === false && (correctVal === false ? <CheckCircleIcon className="w-3 h-3"/> : <XCircleIcon className="w-3 h-3"/>)} Sai
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === 'short_answer') {
      return (
        <div className="mt-2">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Câu trả lời của bạn:</p>
          <div className={`p-3 border-2 rounded-lg text-lg font-bold ${isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'}`}>
            {selectedAnswer || '(Bỏ trống)'}
          </div>
          {!isCorrect && question.shortAnswerCorrect && (
             <div className="mt-2 text-sm text-green-600">
               Đáp án đúng: <strong>{question.shortAnswerCorrect}</strong>
             </div>
          )}
        </div>
      );
    }
    return null;
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
  // Tính tỷ lệ % (Hiển thị)
  // Lưu ý: total ở đây là số lượng câu hỏi, nhưng score là điểm thang 10.
  // Nếu muốn hiển thị %, nên dùng (score/10)*100
  const percentage = Math.round((score / 10) * 100); 
  const chartData = [{ name: 'Điểm', value: score }, { name: 'Mất điểm', value: 10 - score }];
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
                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center md:text-left mt-4 md:mt-0">
            <p className="text-lg text-slate-600 dark:text-slate-300">Tổng điểm:</p>
            <p className={`text-6xl font-bold my-2 ${score >= 5 ? 'text-green-500' : 'text-red-500'}`}>{score.toFixed(2)}</p>
            <p className="text-xl font-medium text-slate-700 dark:text-slate-200">Thang điểm 10</p>
          </div>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          {fromQuizCompletion && <Button onClick={handleRetake}>Làm lại đề này</Button>}
          <Button onClick={handleBackToDashboard} variant="secondary">Về trang chủ</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Chi tiết bài làm</h2>
        <div className="space-y-8">
          {answers.map(({ question, selectedAnswer, isCorrect }, index) => {
            // Lấy thông tin điểm cho từng câu
            const { earned, max } = getQuestionScoreInfo(question, selectedAnswer);

            return (
              <div key={question.id || question._id} className={`p-5 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:bg-red-900/10'}`}>
                
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1">Câu {index + 1}:</span>
                  
                  {/* Badge Trạng thái */}
                  <span className={`text-xs font-bold px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? 'Đúng' : 'Sai / Chưa hoàn thành'}
                  </span>

                  {/* Badge Điểm số (MỚI) */}
                  <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 ml-auto sm:ml-0">
                    +{earned} / {max} điểm
                  </span>

                </div>

                {/* HIỂN THỊ ẢNH CÂU HỎI */}
                {question.imageUrl && (
                  <div className="my-3 flex justify-start">
                    <NgrokImage 
                      src={getFullImageUrl(question.imageUrl) || ''} 
                      alt="Đề bài" 
                      className="max-h-[250px] object-contain rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}

                {question.questionText && <p className="text-slate-800 dark:text-slate-200 font-medium mt-2">{question.questionText}</p>}

                {/* RENDER CHI TIẾT ĐÁP ÁN DỰA VÀO LOẠI CÂU HỎI */}
                {renderResultDetail(question, selectedAnswer, isCorrect)}
                
                {question.explanation && (
                  <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-lg text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">💡 Giải thích:</p>
                    {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default ResultsPage;