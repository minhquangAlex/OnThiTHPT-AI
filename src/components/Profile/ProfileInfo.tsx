import React from 'react';
import type { User } from '../../types';

interface ProfileInfoProps {
  user: User;
  userStats: any;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, userStats }) => {
  // Determine badges based on stats
  const getBadges = () => {
    const badges = [];
    if (userStats?.totalAttempts >= 5) {
      badges.push({ icon: '📚', label: 'Học sinh chăm chỉ' });
    }
    if (userStats?.averageScore >= 8) {
      badges.push({ icon: '⭐', label: 'Điểm cao' });
    }
    if (userStats?.totalAttempts >= 10 && userStats?.averageScore >= 9 ) {
      badges.push({ icon: '🏆', label: 'Chuyên gia' });
    }
    return badges.length > 0 ? badges : [{ icon: '🌟', label: 'Thành viên mới' }];
  };

  const badges = getBadges();
  const joinDate = new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      {/* Header Background */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex flex-col items-center -mt-12 mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-4 border-white dark:border-slate-800 flex items-center justify-center text-4xl shadow-lg">
            {user.name?.charAt(0).toUpperCase() || '👤'}
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white text-center">
            {user.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Học sinh</p>
        </div>

        {/* User Info */}
        <div className="space-y-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {(
                  (user as any).email || `${user.name}@student.edu.vn`
                )}
            </p>
          </div>
          {/* Optional class and school */}
          {(user as any).className && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lớp</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{(user as any).className}</p>
            </div>
          )}
          {(user as any).school && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trường</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{(user as any).school}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Thành viên từ</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {joinDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Vai trò</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
            </p>
          </div>
        </div>

        {/* Badges/Gamification */}
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
            HÌNH HIỆU & DANH HIỆU
          </p>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-700/50"
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {badge.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
