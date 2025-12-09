import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RecentActivityProps {
  attempts: any[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ attempts }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 8) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (percentage >= 5) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
  };

  const getSubjectName = (slug: string): string => {
    const subjectNames: { [key: string]: string } = {
      'math': 'Toán',
      'physics': 'Vật lý',
      'chemistry': 'Hóa học',
      'biology': 'Sinh học',
      'english': 'Tiếng Anh',
      'history': 'Lịch sử',
    };
    return subjectNames[slug] || slug;
  };

  // Sort attempts by date, most recent first
  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          📝 Lịch sử làm bài
        </h3>

        {sortedAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Môn học
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Điểm
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Câu hỏi
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Ngày làm
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAttempts.map((attempt, index) => {
                  const totalQuestions = attempt.answers?.length || attempt.total || 0;
                  const correctAnswers = attempt.score || 0;
                  const subjectName = getSubjectName(attempt.subjectId?.toString() || 'Unknown');

                  return (
                    <tr
                      key={attempt._id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {subjectName}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                            correctAnswers,
                            totalQuestions
                          )}`}
                        >
                          {correctAnswers}/{totalQuestions}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                        {totalQuestions}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(attempt.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => navigate(`/results/${attempt._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-xs font-medium"
                          >
                            👁️ Xem
                          </button>
                          <button
                            onClick={() => navigate(`/quiz/${attempt.subjectId}`)}
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
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Bạn chưa làm bài tập nào
            </p>
            <button
              onClick={() => window.location.hash = '#/dashboard'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              📚 Quay lại bài tập
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
