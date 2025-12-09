import React from 'react';

interface OverviewStatsProps {
  stats: any;
}

const OverviewStats: React.FC<OverviewStatsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Tổng số đề đã làm',
      value: stats?.totalAttempts || 0,
      unit: 'đề',
      icon: '📋',
      color: 'indigo',
    },
    {
      label: 'Điểm trung bình/lượt thi',
      value: stats?.averageScore || 0,
      unit: '/10',
      icon: '⭐',
      color: 'purple',
    },
    {
      label: 'Tổng thời gian ôn',
      value: stats?.totalStudyTime || 0,
      unit: 'giờ',
      icon: '⏱️',
      color: 'blue',
    },
    {
      label: 'Câu hỏi làm đúng',
      value: `${stats?.correctAnswers || 0}/${stats?.totalQuestions || 0}`,
      unit: 'câu',
      icon: '✅',
      color: 'green',
    },
  ];

  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    green: 'from-green-500 to-green-600 shadow-green-500/25',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${colorClasses[card.color as keyof typeof colorClasses]} rounded-lg shadow-lg p-6 text-white overflow-hidden relative`}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">{card.label}</p>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{card.value}</span>
              <span className="text-sm text-white/70">{card.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewStats;
