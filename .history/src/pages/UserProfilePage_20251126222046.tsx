import React, { useEffect, useState } from 'react';
import AccountSettings from '../components/Profile/AccountSettings';
import OverviewStats from '../components/Profile/OverviewStats';
import ProfileInfo from '../components/Profile/ProfileInfo';
import RecentActivity from '../components/Profile/RecentActivity';
import SkillChart from '../components/Profile/SkillChart';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

type TabType = 'overview' | 'activity' | 'settings';

const UserProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userStats, setUserStats] = useState<any>(null);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Lấy attempts của user hiện tại (không phải tất cả attempts)
        let userAttempts: any[] = [];
        
        try {
          // Cố gắng lấy từ endpoint /my-attempts trước
          userAttempts = await api.getMyAttempts();
        } catch (error) {
          // Nếu endpoint không tồn tại, thử lấy tất cả rồi filter
          try {
            const allAttempts = await api.getAllAttempts();
            userAttempts = allAttempts.filter((attempt: any) => attempt.userId === user?.id);
          } catch (err) {
            console.warn('Không thể lấy dữ liệu attempts, sử dụng dữ liệu mặc định', err);
            userAttempts = [];
          }
        }

        setAttempts(userAttempts);

        // Tính toán thống kê tổng quan
        const totalAttempts = userAttempts.length;
        const averageScore = totalAttempts > 0
          ? userAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalAttempts
          : 0;
        
        // Tính tổng số câu trả lời đúng
        let totalCorrect = 0;
        let totalQuestions = 0;
        userAttempts.forEach((attempt: any) => {
          attempt.answers?.forEach((answer: any) => {
            if (answer.isCorrect) totalCorrect++;
            totalQuestions++;
          });
        });

        // Lấy thống kê câu hỏi (nếu có quyền)
        let qStats = [];
        try {
          qStats = await api.getQuestionStats();
        } catch (err) {
          console.warn('Không thể lấy thống kê câu hỏi:', err);
          qStats = [];
        }
        
        setUserStats({
          totalAttempts,
          averageScore: Math.round(averageScore * 10) / 10,
          totalStudyTime: Math.round((totalAttempts * 30) / 60), // Giả định 30 phút mỗi bài thi
          correctAnswers: totalCorrect,
          totalQuestions,
        });

        setSubjectStats(qStats);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu của user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!user) {
    return <div className="text-center py-12">Vui lòng đăng nhập</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Trang Cá Nhân
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Theo dõi tiến độ học tập và phân tích điểm mạnh yếu của bạn
          </p>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar (30%) */}
          <div className="lg:col-span-1">
            <ProfileInfo user={user} userStats={userStats} />
            
            {/* Navigation Menu */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mt-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Menu</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Tổng Quan
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📝 Lịch Sử
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  ⚙️ Cài Đặt
                </button>
              </div>
            </div>
          </div>

          {/* Right Content Area (70%) */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Stats Cards */}
                <OverviewStats stats={userStats} />
                
                {/* Skill Chart */}
                <SkillChart stats={userStats} attempts={attempts} />
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="animate-fadeIn">
                <RecentActivity attempts={attempts} />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="animate-fadeIn">
                <AccountSettings user={user} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
