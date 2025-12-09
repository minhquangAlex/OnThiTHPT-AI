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
  const [attempts, setAttempts] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // --- HÀM QUAN TRỌNG: Tính toán thống nhất với RecentActivity ---
  const computeAttemptStats = (a: any) => {
    // 1. Ưu tiên lấy số liệu tổng hợp từ Backend (để khớp với bảng Lịch sử)
    let correct = a.correctAnswers ?? a.correct ?? 0;
    let total = a.totalQuestions ?? a.total ?? 0;

    // 2. Fallback: Chỉ khi backend không có số liệu, mới tự đếm từ mảng answers
    if (total === 0 && Array.isArray(a.answers) && a.answers.length > 0) {
        correct = a.answers.filter((ans: any) => ans.isCorrect).length;
        total = a.answers.length;
    }

    // 3. Tính điểm hệ 10 cho bài này
    // Công thức: (Số câu đúng / Tổng số câu) * 10
    const scoreOutOf10 = total > 0 ? (correct / total) * 10 : 0;

    return { correct, total, scoreOutOf10 };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // 1. Lấy danh sách bài làm
        let userAttempts: any[] = [];
        try {
          // Thử lấy endpoint cá nhân trước
          userAttempts = await api.getAllAttempts(); // Giả sử API này đã filter theo user hoặc backend tự filter
          // Nếu API trả về tất cả mọi người, cần filter ở frontend (như code cũ của bạn)
          if (Array.isArray(userAttempts) && userAttempts.length > 0 && userAttempts[0].userId) {
             userAttempts = userAttempts.filter((att: any) => att.userId === user?.id);
          }
        } catch (err) {
          console.warn('Lỗi lấy dữ liệu attempts:', err);
          userAttempts = [];
        }

        // Sắp xếp mới nhất lên đầu để đồng bộ hiển thị
        userAttempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAttempts(userAttempts);

        // 2. Tính toán thống kê tổng quan (Overview Stats)
        const totalAttempts = userAttempts.length;
        let totalCorrectOfAllTime = 0;
        let totalQuestionsOfAllTime = 0;
        let sumOfScores = 0;

        userAttempts.forEach((attempt: any) => {
          const s = computeAttemptStats(attempt);
          
          totalCorrectOfAllTime += s.correct;
          totalQuestionsOfAllTime += s.total;
          
          // Cộng dồn điểm số của bài này vào tổng điểm
          sumOfScores += s.scoreOutOf10;
        });

        // Tính điểm trung bình = Tổng điểm các bài / Số lượng bài
        // Làm tròn đến 1 chữ số thập phân (ví dụ: 7.8)
        const averageScore = totalAttempts > 0 ? Math.round((sumOfScores / totalAttempts) * 10) / 10 : 0;

        setUserStats({
          totalAttempts, // Tổng số đề đã làm
          averageScore,  // Điểm trung bình
          totalStudyTime: Math.round((totalAttempts * 30) / 60), // Giả định 30 phút/đề -> ra giờ
          correctAnswers: totalCorrectOfAllTime, // Tổng số câu đúng
          totalQuestions: totalQuestionsOfAllTime, // Tổng số câu đã làm
        });

        // 3. Lấy tên môn học để hiển thị đẹp hơn
        try {
          const subjects = await api.getSubjects();
          const map: Record<string, string> = {};
          subjects.forEach((s: any) => {
            const key = s._id || s.id || s.slug;
            if (key) map[String(key)] = s.name;
          });
          setSubjectsMap(map);
        } catch (e) {
          console.warn('Không thể tải danh sách môn học:', e);
        }

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!user) return <div className="text-center py-12">Vui lòng đăng nhập</div>;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Trang Cá Nhân</h1>
          <p className="text-slate-600 dark:text-slate-400">Theo dõi tiến độ học tập của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <ProfileInfo user={user} userStats={userStats} />
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mt-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 px-2">Menu</h3>
              <div className="space-y-1">
                {[
                  { id: 'overview', label: '📊 Tổng Quan' },
                  { id: 'activity', label: '📝 Lịch Sử Làm Bài' },
                  { id: 'settings', label: '⚙️ Cài Đặt' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'overview' && (
              <div className="animate-fade-in-up space-y-6">
                <OverviewStats stats={userStats} />
                <SkillChart stats={userStats} attempts={attempts} subjectsMap={subjectsMap} />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="animate-fade-in-up">
                <RecentActivity attempts={attempts} subjectsMap={subjectsMap} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-fade-in-up">
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