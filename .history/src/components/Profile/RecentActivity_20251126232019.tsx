import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RecentActivityProps {
  attempts: any[];
  subjectsMap?: Record<string, string>;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ attempts = [], subjectsMap = {} }) => {
  const navigate = useNavigate();

  const getBadgeColor = (scoreOutOf10: number) => {
    if (scoreOutOf10 >= 8) return 'bg-green-100 text-green-800';
    if (scoreOutOf10 >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      const datePart = d.toLocaleDateString('vi-VN');
      const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${datePart} ${timePart}`;
    } catch {
      return new Date(dateString).toLocaleString();
    }
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Hoạt động gần đây</h3>

      {sortedAttempts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Ngày</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Môn</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Đúng</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Tổng</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Điểm</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {sortedAttempts.map((a) => {
                const date = formatDate(a.createdAt);
                   const answers = Array.isArray(a.answers) ? a.answers : [];
                   const correctFromAnswers = answers.length > 0 ? answers.filter((ans: any) => ans.isCorrect).length : undefined;
                   const correct = typeof correctFromAnswers === 'number' ? correctFromAnswers : (a.correctAnswers ?? a.correct ?? 0);
                   const total = a.totalQuestions ?? a.total ?? (answers.length || 0);
                const scoreOutOf10 = total > 0 ? Math.round(((correct / total) * 10) * 10) / 10 : 0; // 1 decimal
                const subjectLabel = a.subjectName || subjectsMap[String(a.subject) || String(a.subjectId)] || a.subject || a.subjectId || 'Unknown';

                return (
                  <tr key={a._id}>
                    <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{date}</td>
                    <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{subjectLabel}</td>
                    <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{correct}</td>
                    <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{total}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(scoreOutOf10)}`}>
                        {scoreOutOf10}/10
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/results/${a._id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-xs font-medium"
                        >
                          👁️ Xem
                        </button>
                        <button
                          onClick={() => navigate(`/quiz/${a.subject || a.subjectId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs font-medium"
                        >
                          🔄 Làm lại
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Bạn chưa làm bài tập nào</p>
          <button
            onClick={() => (window.location.hash = '#/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            📚 Quay lại bài tập
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
