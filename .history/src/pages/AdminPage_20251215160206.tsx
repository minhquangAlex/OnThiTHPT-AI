import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import AttemptManagement from '../components/AttemptManagement';
import { FileText, Database } from 'lucide-react'; // Thêm icon cho đẹp

const AdminPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  
  // State thống kê
  const [userCount, setUserCount] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questionsCount, setQuestionsCount] = useState<number | null>(null);
  const [todayAttempts, setTodayAttempts] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State sửa môn học
  const [editSubject, setEditSubject] = useState<any>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Lấy danh sách môn học
        const subs = await api.getSubjects();
        setSubjects(subs);

        // 2. Tính tổng số câu hỏi
        const totalQ = subs.reduce((acc: number, s: any) => acc + (s.questionCount || 0), 0);
        setQuestionsCount(totalQ);

        // 3. Lấy số lượng user (Chỉ Admin mới gọi được)
        if (token) {
          const usersResp = await api.getUsers(1, 1, ''); 
          setUserCount(usersResp.total || null);
        }

        // 4. Lấy thống kê hôm nay
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

  const handleUpdateSubjectName = async (s: any) => {
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
      alert(err.message || 'Lỗi khi cập nhật môn học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Trang quản trị</h1>
      
      {/* --- KHỐI THỐNG KÊ --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Tổng số người dùng</h3>
          <p className="text-3xl font-bold mt-2 text-indigo-600">{userCount ?? '—'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Số môn học</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{subjects.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Tổng số câu hỏi</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{questionsCount ?? '—'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-slate-500 dark:text-slate-400">Lượt làm bài hôm nay</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">{todayAttempts ?? '—'}</p>
        </Card>
      </div>

      {/* --- QUẢN LÝ NGƯỜI DÙNG --- */}
      <AdminUserManagement />

      {/* --- QUẢN LÝ NỘI DUNG (MÔN HỌC / CÂU HỎI / ĐỀ THI) --- */}
      <Card className="p-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold">Quản lý nội dung</h2>
              <p className="text-slate-500 text-sm mt-1">Quản lý kho câu hỏi và đóng gói đề thi.</p>
            </div>
            
            <div className="flex gap-2">
              {/* Nút Hard Reset */}
              <Button 
                onClick={async () => {
                  if (confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ CÁC LƯỢT LÀM BÀI KHÔNG? Hành động này không thể hoàn tác.')) {
                    try {
                      await api.deleteAllAttempts();
                      alert('Đã xóa sạch dữ liệu làm bài. Trang sẽ tải lại.');
                      window.location.reload();
                    } catch (err: any) {
                      alert('Lỗi: ' + err.message);
                    }
                  }
                }}
                variant="danger"
                size="sm"
              >
                Reset Dữ liệu thi
              </Button>

              {/* Nút Fix lỗi điểm (đã thêm từ trước) */}
              <Button 
                  onClick={async () => {
                      if (confirm('Hệ thống sẽ tính lại điểm cho TOÀN BỘ bài làm theo thang điểm 10 chuẩn. Tiếp tục?')) {
                          try {
                              setLoading(true);
                              const res = await api.recalculateScores();
                              alert(`Hoàn tất! Đã cập nhật ${res.updated} lượt làm bài.`);
                              window.location.reload();
                          } catch (e: any) {
                              alert(e.message);
                          } finally {
                              setLoading(false);
                          }
                      }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  size="sm"
              >
                  Fix lỗi điểm
              </Button>

              <Button size="sm" onClick={() => navigate('/admin/questions/new')}>+ Thêm câu hỏi</Button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <th className="p-3 font-semibold">Môn học</th>
                        <th className="p-3 font-semibold text-center">Kho câu hỏi</th>
                        <th className="p-3 font-semibold">Quản lý Dữ liệu</th>
                        <th className="p-3 font-semibold text-right">Cấu hình</th>
                    </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {/* Cột Tên Môn */}
                      <td className="p-3 font-medium">
                        {editSubject?._id === s._id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-1.5 border rounded bg-white dark:bg-slate-900 border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                             {/* Nếu có icon component, có thể render ở đây */}
                             <span>{s.name}</span>
                          </div>
                        )}
                      </td>
                      
                      {/* Cột Số câu hỏi */}
                      <td className="p-3 text-center">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                          {s.questionCount || 0}
                        </span>
                      </td>

                      {/* Cột Chức năng chính (Quan trọng) */}
                      <td className="p-3">
                        <div className="flex gap-2">
                            {/* Nút vào Ngân hàng câu hỏi */}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex items-center gap-1"
                              onClick={() => navigate(`/admin/questions/${s._id}`, { state: { subjectName: s.name } })}
                            >
                              <Database className="w-3 h-3" /> Ngân hàng
                            </Button>
                            
                            {/* 👇 NÚT MỚI: QUẢN LÝ ĐỀ THI 👇 */}
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                              onClick={() => navigate(`/admin/exams/${s._id}`)}
                            >
                              <FileText className="w-3 h-3" /> Đề thi
                            </Button>
                        </div>
                      </td>

                      {/* Cột Hành động (Sửa tên) */}
                      <td className="p-3 text-right">
                        {editSubject?._id === s._id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleUpdateSubjectName(s)}>Lưu</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setEditSubject(null); setEditName(''); }}>Hủy</Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary" // Ghost button cho đỡ rối
                            className="text-slate-500 hover:text-slate-700"
                            onClick={() => {
                              setEditSubject(s);
                              setEditName(s.name);
                            }}
                          >
                            Sửa tên
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
        </div>
      </Card>

      {/* --- QUẢN LÝ LƯỢT LÀM BÀI --- */}
      <AttemptManagement onAttemptDeleted={onAttemptDeleted} />
    </div>
  );
};

export default AdminPage;