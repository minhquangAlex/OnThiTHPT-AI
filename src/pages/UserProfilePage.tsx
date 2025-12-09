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
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Helper to compute correct/total/scoreOutOf10 from an attempt object
  const computeAttemptStats = (a: any) => {
    const answers = Array.isArray(a.answers) ? a.answers : [];
    if (answers.length > 0) {
      const correct = answers.filter((ans: any) => ans.isCorrect).length;
      const total = answers.length;
      const scoreOutOf10 = total > 0 ? Math.round(((correct / total) * 10) * 10) / 10 : 0;
      return { correct, total, scoreOutOf10 };
    }

    const correct = a.correctAnswers ?? a.correct ?? 0;
    const total = a.totalQuestions ?? a.total ?? 0;

    let scoreOutOf10 = 0;
    if (typeof a.score === 'number') {
      // normalize if backend stored score as percent (0..100)
      scoreOutOf10 = a.score > 10 ? Math.round((a.score / 10) * 10) / 10 : a.score;
    } else {
      scoreOutOf10 = total > 0 ? Math.round(((correct / total) * 10) * 10) / 10 : 0;
    }

    return { correct, total, scoreOutOf10 };
  };

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

        // Tính toán thống kê tổng quan (chuẩn hoá trên thang 0..10) - trung bình trên tất cả lượt làm bài
        const totalAttempts = userAttempts.length;
        let totalCorrect = 0;
        let totalQuestions = 0;
        let sumScore = 0;

        userAttempts.forEach((attempt: any) => {
          const s = computeAttemptStats(attempt);
          totalCorrect += s.correct;
          totalQuestions += s.total;
          sumScore += s.scoreOutOf10;
        });

        const averageScore = totalAttempts > 0 ? Math.round((sumScore / totalAttempts) * 10) / 10 : 0;

        // Lấy thống kê câu hỏi (chỉ nếu có quyền, thường là admin)
        let qStats = [];
        // Bỏ qua getQuestionStats vì học sinh không có quyền
        // try {
        //   qStats = await api.getQuestionStats();
        // } catch (err) {
        //   console.warn('Không thể lấy thống kê câu hỏi:', err);
        //   qStats = [];
        // }
        
        setUserStats({
          totalAttempts,
          averageScore: Math.round(averageScore * 10) / 10,
          totalStudyTime: Math.round((totalAttempts * 30) / 60), // Giả định 30 phút mỗi bài thi
          correctAnswers: totalCorrect,
          totalQuestions,
        });

        setSubjectStats(qStats);
        // Fetch subjects and build map id->name (used to show subject names instead of ids)
        try {
          const subjects = await api.getSubjects();
          const map: Record<string, string> = {};
          subjects.forEach((s: any) => {
            // prefer _id, fallback to id or slug
            const key = s._id || s.id || s.slug;
            if (key) map[String(key)] = s.name;
          });
          setSubjectsMap(map);
        } catch (e) {
          console.warn('Không thể tải danh sách môn học:', e);
        }
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
                <SkillChart stats={userStats} attempts={attempts} subjectsMap={subjectsMap} />
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="animate-fadeIn">
                <RecentActivity attempts={attempts} subjectsMap={subjectsMap} />
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
