import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Thêm import Link
import Button from '../components/Button';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // use foundUser.name if available (two-step flow)
      const loginName = foundUser?.name || username;
      const data = await api.login(loginName, password);
      login({ ...data, id: data._id }, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!username.trim()) return setError('Vui lòng nhập tên đăng nhập');
    setIsLoading(true);
    try {
      // search users by name
      const res: any = await api.getUsers(1, 10, username.trim());
      const users = res?.users || [];
      if (!users || users.length === 0) {
        setError('Không tìm thấy tài khoản với tên đăng nhập này');
        return;
      }
      // pick first match
      const user = users[0];
      setFoundUser(user);
      setStep('password');
    } catch (err: any) {
      console.error('🔴 [LoginPage] error fetching user:', err);
      setError(err.message || 'Lỗi khi tìm tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
        {step === 'username' ? (
          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                placeholder="Nhập tên đăng nhập của bạn"
                required
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => navigate('/')} type="button" className="flex-1 px-4 py-2 border rounded-md">Quay lại</button>
              <button onClick={handleContinue} type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md">Tiếp tục</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tài khoản</label>
              <input
                type="text"
                value={foundUser?.name || username}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-md bg-gray-100"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/reset-password', { state: { username: foundUser?.name || username } })}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                required
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('username'); setFoundUser(null); setPassword(''); }} className="flex-1 px-4 py-2 border rounded-md">Quay lại</button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Đăng nhập'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;