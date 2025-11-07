
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

import AttemptManagement from '../components/AttemptManagement';

const AdminPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questionsCount, setQuestionsCount] = useState<number | null>(null);
  const [todayAttempts, setTodayAttempts] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editSubject, setEditSubject] = useState<any>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // subjects from backend (now includes questionCount)
        const subs = await api.getSubjects();
        setSubjects(subs);

        // Set total questions from the sum of counts
        const totalQ = subs.reduce((acc: number, s: any) => acc + (s.questionCount || 0), 0);
        setQuestionsCount(totalQ);

        // users count (admin-only endpoint) - if token available
        if (token) {
          const usersResp = await api.getUsers(1, 1, ''); // get first page to read total
          setUserCount(usersResp.total || null);
        }

        // fetch stats (today attempts)
        try {
          const stats = await api.getStats();
          setTodayAttempts(stats?.todayAttempts ?? 0);
        } catch (e) {
          console.warn('Không thể lấy số liệu thống kê:', e);
          setTodayAttempts(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  

  const onAttemptDeleted = (createdAt: string) => {
    const attemptDate = new Date(createdAt);
    const today = new Date();
    const isToday = attemptDate.getFullYear() === today.getFullYear() &&
                    attemptDate.getMonth() === today.getMonth() &&
                    attemptDate.getDate() === today.getDate();

    if (isToday) {
      setTodayAttempts(prev => (prev ? prev - 1 : 0));
    }
  };

  return (
  <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Trang quản trị</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Tổng số người dùng</h3>
          <p className="text-3xl font-bold mt-2">{userCount ?? '—'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Số môn học</h3>
          <p className="text-3xl font-bold mt-2">{subjects.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Tổng số câu hỏi</h3>
          <p className="text-3xl font-bold mt-2">{questionsCount ?? '—'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Lượt làm bài hôm nay</h3>
          <p className="text-3xl font-bold mt-2">{todayAttempts ?? '—'}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Quản lý nội dung</h2>
            <div>
              <Button 
                onClick={async () => {
                  if (window.confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ CÁC LƯỢT LÀM BÀI KHÔNG? Hành động này không thể hoàn tác.')) {
                    try {
                      await api.deleteAllAttempts();
                      alert('Tất cả các lượt làm bài đã được xóa. Trang sẽ được tải lại.');
                      window.location.reload();
                    } catch (err: any) {
                      alert('Lỗi khi thực hiện hard reset: ' + err.message);
                    }
                  }
                }}
                variant="danger"
                className="mr-4"
              >
                Hard Reset Attempts
              </Button>
              <Button onClick={() => navigate('/admin/questions/new')}>Thêm câu hỏi mới</Button>
            </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Đây là khu vực để quản lý các môn học, chương, và ngân hàng câu hỏi.
        </p>
        <div className="mt-6">
            <table className="w-full text-left">
                <thead className="border-b dark:border-slate-700">
                    <tr>
                        <th className="p-2">Môn học</th>
                        <th className="p-2">Số câu hỏi</th>
                        <th className="p-2">Chỉnh nội dung</th>
                        <th className="p-2">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key= {s._id} className="border-b dark:border-slate-700">
                      <td className="p-2">
                        {editSubject?._id === s._id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-1 border rounded bg-white dark:bg-slate-800 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td className="p-2">
                        {s.questionCount || 0}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/questions/${s._id}`, { state: { subjectName: s.name } })}
                        >
                          Chỉnh nội dung
                        </Button>
                      </td>
                      <td className="p-2 space-x-2">
                        {editSubject?._id === s._id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (!token) {
                                  alert('Bạn cần đăng nhập lại');
                                  navigate('/login');
                                  return;
                                }
                                if (!editName.trim()) {
                                  alert('Tên môn học không được để trống');
                                  return;
                                }
                                setLoading(true);
                                try {
                                  await api.updateSubject(s._id, { name: editName });
                                  const updatedSubjects = subjects.map(sub => 
                                    sub._id === s._id ? { ...sub, name: editName } : sub
                                  );
                                  setSubjects(updatedSubjects);
                                  setEditSubject(null);
                                  setEditName('');
                                } catch (err: any) {
                                  // If server returned HTML (e.g., not authenticated), show generic message
                                  alert(err.message || 'Lỗi khi cập nhật môn học');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditSubject(null);
                                setEditName('');
                              }}
                            >
                              Hủy
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditSubject(s);
                              setEditName(s.name);
                            }}
                          >
                            Chỉnh sửa
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
        </div>
      </Card>

      <AttemptManagement onAttemptDeleted={onAttemptDeleted} />

      {/* Navigation: create question is handled on a separate page */}
    </div>
  );
};

export default AdminPage;