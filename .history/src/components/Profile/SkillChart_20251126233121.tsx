import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SkillChartProps {
  stats: any;
  attempts: any[];
  subjectsMap?: Record<string, string>;
}

const SkillChart: React.FC<SkillChartProps> = ({ stats, attempts, subjectsMap = {} }) => {
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);

  useEffect(() => {
    // Tính toán hiệu suất theo môn học
    const performanceMap = new Map<string, { correct: number; total: number }>();

    attempts.forEach((attempt: any) => {
      const subjectId = attempt.subjectId?.toString() || 'unknown';
      const subjectName = getSubjectName(subjectId);

      if (!performanceMap.has(subjectId)) {
        performanceMap.set(subjectId, { correct: 0, total: 0 });
      }

      const stats = performanceMap.get(subjectId)!;
      attempt.answers?.forEach((answer: any) => {
        if (answer.isCorrect) stats.correct++;
        stats.total++;
      });
    });

    // Chuyển đổi dữ liệu cho biểu đồ: tính điểm trên thang 0..10
    const data = Array.from(performanceMap.entries()).map(([subjectId, s]) => {
      const avgOutOf10 = s.total > 0 ? (s.correct / s.total) * 10 : 0;
      const subjectLabel = subjectsMap[String(subjectId)] || getSubjectName(subjectId);
      return {
        subject: subjectLabel,
        subjectKey: subjectId,
        score10: Math.round(avgOutOf10 * 10) / 10,
        correct: s.correct,
        total: s.total,
      };
    });

    setSubjectPerformance(data);
  }, [attempts]);

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

  const colors = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Biểu đồ năng lực */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          📊 Năng lực theo môn học
        </h3>

        {subjectPerformance.length > 0 ? (
          <div className="space-y-6">
            {/* Biểu đồ cột */}
            <ResponsiveContainer width="100%" height={300} minHeight={300}>
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="subject"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[0, 10]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => `${value} / 10`}
                />
                <Bar dataKey="score10" fill="#6366f1" radius={[8, 8, 0, 0]}>
                  {subjectPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Chi tiết hiệu suất */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjectPerformance.map((perf, index) => {
                const score = perf.score10 ?? 0;
                const isWeak = score < 5;
                const isModerate = score >= 5 && score < 7;
                const isGood = score >= 7;

                return (
                  <div
                    key={index}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {perf.subject}
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {score}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">/10</span>
                    </div>
                    <div className="flex gap-1 justify-center mb-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded-sm ${
                            i < Math.ceil((score / 10) * 10)
                              ? isWeak
                                ? 'bg-red-500'
                                : isModerate
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {isWeak ? '⚠️ Báo động' : isModerate ? '📈 Cần cố gắng' : '✅ Tốt'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              Hãy làm một số bài tập để xem phân tích năng lực của bạn
            </p>
          </div>
        )}
      </div>

      {/* Gợi ý cải thiện */}
      {subjectPerformance.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg shadow-md p-6 border border-indigo-200 dark:border-indigo-700/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            💡 Gợi ý cải thiện
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {getAnalysisText(subjectPerformance)}
          </p>
        </div>
      )}
    </div>
  );
};

const getAnalysisText = (performance: any[]): string => {
  if (performance.length === 0) {
    return 'Chưa có dữ liệu để phân tích.';
  }
  const weakestSubject = performance.reduce((prev, curr) =>
    (curr.score10 ?? 0) < (prev.score10 ?? 0) ? curr : prev
  );

  const bestSubject = performance.reduce((prev, curr) =>
    (curr.score10 ?? 0) > (prev.score10 ?? 0) ? curr : prev
  );

  const wScore = weakestSubject.score10 ?? 0;
  const bScore = bestSubject.score10 ?? 0;

  if (wScore < 5) {
    return `Dựa trên kết quả gần đây, bạn đang yếu phần ${weakestSubject.subject} (${wScore}/10). Hãy luyện thêm các bài tập về ${weakestSubject.subject} để cải thiện điểm số. Tuy nhiên, bạn cũng đang làm tốt ở ${bestSubject.subject} (${bScore}/10), hãy tiếp tục duy trì nhé!`;
  } else if (wScore < 7) {
    return `Bạn đang có tiến bộ! Môn ${bestSubject.subject} là điểm mạnh của bạn (${bScore}/10). Để cải thiện thêm, hãy tập trung vào ${weakestSubject.subject} (${wScore}/10) bằng cách làm thêm bài tập luyện tập.`;
  } else {
    return `Tuyệt vời! Bạn đang làm rất tốt ở tất cả các môn học. ${bestSubject.subject} là điểm mạnh nhất của bạn (${bScore}/10). Hãy tiếp tục duy trì và cố gắng nâng cao hơn nữa!`;
  }
};

export default SkillChart;
