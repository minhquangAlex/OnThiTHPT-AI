import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import Button from './Button';
import Card from './Card';
import Spinner from './Spinner';

interface Attempt {
  _id: string;
  userId: { name: string } | null;
  subjectId: { name: string; slug: string; };
  score: number;
  total: number;
  createdAt: string;
}

interface SubjectStat {
  subjectId: string;
  subjectName: string;
  averageScore: number;
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  subjectId: string;
  totalAttempts: number;
  correctAttempts: number;
  correctPercentage: number;
  questionCreatedAt?: string;
  label?: string;
}

interface AttemptManagementProps {
  onAttemptDeleted: (createdAt: string) => void;
}

const AttemptManagement: React.FC<AttemptManagementProps> = ({ onAttemptDeleted }) => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [questionsForSubject, setQuestionsForSubject] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attemptsData, subjectStatsData, questionStatsData] = await Promise.all([
          api.getAllAttempts(),
          api.getSubjectStats(),
          api.getQuestionStats(),
        ]);
        setAttempts(attemptsData);
        setSubjectStats(subjectStatsData);
        setQuestionStats(questionStatsData);
        if (subjectStatsData.length > 0) {
          setSelectedSubject(subjectStatsData[0].subjectId);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Khi chọn môn học, tải danh sách câu hỏi để sắp xếp biểu đồ
  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedSubject) return;
      try {
        const qs = await api.getQuestions(selectedSubject);
        setQuestionsForSubject(qs || []);
      } catch (err) {
        setQuestionsForSubject([]);
      }
    };
    loadQuestions();
  }, [selectedSubject]);

  const handleDelete = async (attemptId: string, createdAt: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lượt làm bài này không?')) {
      try {
        await api.deleteAttempt(attemptId);
        setAttempts(prevAttempts => prevAttempts.filter(a => a._id !== attemptId));
        onAttemptDeleted(createdAt);
      } catch (err: any) {
        alert('Lỗi khi xóa lượt làm bài: ' + (err.message || 'Vui lòng thử lại'));
      }
    }
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500">{error}</p>;

  // Xử lý dữ liệu biểu đồ
  const questionOrderMap = new Map<string, number>();
  questionsForSubject.forEach((q, idx) => {
    const id = q._id || q.id || q.questionId;
    if (id) questionOrderMap.set(id.toString(), idx);
  });

  const filteredQuestionStats = questionStats
    .filter(stat => stat.subjectId === selectedSubject)
    .slice()
    .sort((a, b) => {
      const ia = questionOrderMap.has(a.questionId?.toString()) ? questionOrderMap.get(a.questionId.toString())! : null;
      const ib = questionOrderMap.has(b.questionId?.toString()) ? questionOrderMap.get(b.questionId.toString())! : null;
      if (ia !== null && ib !== null) return ia - ib;
      if (ia !== null) return -1;
      if (ib !== null) return 1;
      const ta = a.questionCreatedAt ? new Date(a.questionCreatedAt).getTime() : 0;
      const tb = b.questionCreatedAt ? new Date(b.questionCreatedAt).getTime() : 0;
      return ta - tb;
    })
    .map((s, idx) => ({
      ...s,
      correctPercentage: Math.round((s.correctPercentage ?? 0) * 100),
      label: `Câu ${idx + 1}`,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 text-slate-100 p-3 rounded shadow-lg" style={{ minWidth: 240 }}>
          <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>{data.label}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>{data.questionText}</div>
          <div style={{ fontSize: 12, color: '#93c5fd' }}>Tỷ lệ đúng: {data.correctPercentage}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4">Quản lý lượt làm bài</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Thống kê và quản lý các lượt làm bài của người dùng.
      </p>

      <div className="space-y-8">
        {/* Biểu đồ thống kê câu hỏi */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Thống kê câu hỏi</h3>
          <div className="mb-4">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full max-w-xs p-2 border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            >
              {subjectStats.map(s => (
                <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
              ))}
            </select>
          </div>
            {filteredQuestionStats.length > 0 ? (
            <div style={{ width: '100%', height: 400, minWidth: 0, minHeight: 250 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <BarChart
                  data={filteredQuestionStats}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      width={150} 
                      tick={{ fontSize: 12, fill: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                  <Legend />
                    <Bar dataKey="correctPercentage" name="Tỷ lệ đúng" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 italic">Không có dữ liệu thống kê cho môn học này.</p>
          )}
        </div>

        {/* Bảng điểm trung bình môn */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Điểm trung bình môn học</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Điểm trung bình</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((stat) => (
                  <tr key={stat.subjectId} className="border-b dark:border-slate-700">
                    <td className="p-3">{stat.subjectName}</td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {stat.averageScore.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng kết quả chi tiết */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Kết quả chi tiết các lượt làm bài</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-200">Người làm</th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-200">Môn học</th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-200">Điểm (Thang 10)</th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-200">Ngày làm</th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {attempt.userId?.name || 'Không xác định'}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {attempt.subjectId?.name || 'Không xác định'}
                      </span>
                    </td>
                    
                    {/* --- HIỂN THỊ ĐIỂM SỐ CHUẨN --- */}
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {/* Hiển thị trực tiếp score, vì backend đã tính thang 10 */}
                      {Number(attempt.score).toFixed(2)}
                    </td>
                    {/* ------------------------------- */}

                    <td className="p-3 text-sm text-slate-500">
                      {new Date(attempt.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button 
                        onClick={() => navigate(`/results/${attempt._id}`)} 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                      >
                        Xem chi tiết
                      </button>
                      <Button 
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(attempt._id, attempt.createdAt)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AttemptManagement;