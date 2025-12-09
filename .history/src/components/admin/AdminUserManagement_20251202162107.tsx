import React, { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import api from '../../services/api';

type RoleFilter = 'all' | 'admin' | 'student' | 'teacher';
type StatusFilter = 'all' | 'active' | 'banned';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const base = 'px-2 py-1 rounded text-xs font-medium';
  if (role === 'admin') return <span className={base + ' bg-purple-900 text-purple-100'}>Admin</span>;
  if (role === 'student') return <span className={base + ' bg-green-900 text-green-100'}>Học sinh</span>;
  return <span className={base + ' bg-slate-700 text-slate-100'}>{role}</span>;
};

const StatusBadge: React.FC<{ banned: boolean }> = ({ banned }) => {
  const base = 'px-2 py-1 rounded text-xs font-medium';
  if (banned) return <span className={base + ' bg-red-900 text-red-100'}>Bị khóa</span>;
  return <span className={base + ' bg-green-900 text-green-100'}>Hoạt động</span>;
};

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAttempts = async (userList: any[]) => {
    try {
      const allAttempts = await api.getAllAttempts();
      const attemptMap = new Map<string, number>();
      
      userList.forEach(user => {
        const userAttempts = allAttempts.filter((a: any) => String(a.userId) === String(user._id));
        attemptMap.set(String(user._id), userAttempts.length);
      });
      
      setUsersWithAttempts(attemptMap);
    } catch (err: any) {
      console.error('Không thể tải số lượt làm bài', err);
    }
  };

  const loadAttempts = async (userList: any[]) => {
    try {
      const allAttempts = await api.getAllAttempts();
      const attemptMap = new Map<string, number>();
      
      userList.forEach(user => {
        const userAttempts = allAttempts.filter((a: any) => String(a.userId) === String(user._id));
        attemptMap.set(String(user._id), userAttempts.length);
      });
      
      setUsersWithAttempts(attemptMap);
    } catch (err: any) {
      console.error('Không thể tải số lượt làm bài', err);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const resp: any = await api.getUsers(page, limit, search || '');
      // resp expected { users, total, page, limit }
      const list = resp?.users || resp?.data || [];
      setUsers(list);
      setTotal(resp?.total ?? null);
      
      // Load attempt counts for these users
      await loadAttempts(list);
    } catch (err: any) {
      console.error('Không thể tải users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    await load();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!window.confirm('Bạn có chắc muốn thay đổi quyền của người dùng này?')) return;
    try {
      await api.updateUser(userId, { role: newRole });
      await load();
      alert('Đã cập nhật quyền');
    } catch (err: any) {
      alert('Lỗi khi cập nhật quyền: ' + (err.message || err));
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPass = prompt('Nhập mật khẩu mới cho user (admin reset)');
    if (!newPass) return;
    try {
      await api.resetPassword(userId, newPass);
      alert('Đã đặt lại mật khẩu');
    } catch (err: any) {
      alert('Lỗi khi đặt lại mật khẩu: ' + (err.message || err));
    }
  };

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? 'Mở khóa' : 'Khóa';
    if (!window.confirm(`${action} tài khoản này?`)) return;
    try {
      await api.updateUser(userId, { banned: !isBanned });
      await load();
      alert('Đã ' + (isBanned ? 'mở khóa' : 'khóa') + ' tài khoản');
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || err));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Xóa tài khoản sẽ vĩnh viễn loại bỏ dữ liệu. Bạn có chắc?')) return;
    try {
      await api.deleteUser(userId);
      alert('Đã xóa tài khoản');
      await load();
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + (err.message || err));
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && u.banned === true) return false;
    if (statusFilter === 'banned' && u.banned !== true) return false;
    return true;
  });

  return (
    <Card className="mb-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Quản lý tài khoản</h2>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="px-3 py-2 rounded bg-slate-700 text-white"
            />
            <Button type="submit">Tìm</Button>
          </form>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="text-sm text-slate-400 block mb-1">Vai trò</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="px-2 py-1 rounded bg-slate-800 text-white">
            <option value="all">Tất cả</option>
            <option value="admin">Admin</option>
            <option value="student">Học sinh</option>
            <option value="teacher">Giáo viên</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-1">Trạng thái</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="px-2 py-1 rounded bg-slate-800 text-white">
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Bị khóa</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-700">
            <tr>
              <th className="p-2">Người dùng</th>
              <th className="p-2">Vai trò</th>
              <th className="p-2">Trạng thái</th>
              <th className="p-2">Ngày tham gia</th>
              <th className="p-2">Số đề đã làm</th>
              <th className="p-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} className="border-b border-slate-700">
                <td className="p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white">{(u.name || '?')[0]?.toUpperCase()}</div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-2"><RoleBadge role={u.role || 'student'} /></td>
                <td className="p-2"><StatusBadge banned={u.banned === true} /></td>
                <td className="p-2">{new Date(u.createdAt || u._id?.toString().slice(0,8) || Date.now()).toLocaleDateString()}</td>
                <td className="p-2">{usersWithAttempts.get(String(u._id)) ?? 0}</td>
                <td className="p-2 space-x-2">
                  <Button size="sm" onClick={() => {
                    const newName = prompt('Sửa tên hiển thị', u.name);
                    if (!newName) return;
                    api.updateUser(u._id, { name: newName }).then(() => load()).catch((e) => alert('Lỗi: ' + e.message));
                  }}>Sửa</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleChangeRole(u._id, u.role === 'admin' ? 'student' : 'admin')}>{u.role === 'admin' ? 'Giảm quyền' : 'Nâng quyền'}</Button>
                  <Button size="sm" variant="danger" onClick={() => handleResetPassword(u._id)}>Đặt lại mật khẩu</Button>
                  <Button size="sm" variant={u.banned ? "secondary" : "danger"} onClick={() => handleToggleBan(u._id, u.banned === true)}>{u.banned ? 'Mở khóa' : 'Khóa'}</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(u._id)}>Xóa</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-slate-400">Tổng: {total ?? '-'}</div>
        <div className="flex gap-2">
          <Button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Trước</Button>
          <Button onClick={() => setPage(p => p+1)}>Tiếp</Button>
        </div>
      </div>
    </Card>
  );
};

export default AdminUserManagement;
