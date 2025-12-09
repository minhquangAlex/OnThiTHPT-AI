import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess?: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSignupSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'signup' | 'login'>('signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (step === 'signup') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setLoginData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return false;
    }
    if (formData.name.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email không hợp lệ');
      return false;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!loginData.password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 [SignupModal] Bắt đầu đăng nhập với:', { username: loginData.username });
      
      const response = await api.login(loginData.username, loginData.password);
      console.log('✅ [SignupModal] Đăng nhập thành công:', response);
      
      // Login và lưu token
      login({ ...response, id: response._id }, response.token);
      
      // Reset form và đóng modal
      setLoginData({ username: '', password: '' });
      setError(null);
      onClose();
      
      // Chuyển đến dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ [SignupModal] Lỗi đăng nhập:', err);
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('🔵 [SignupModal] Bắt đầu đăng ký với:', { name: formData.name, email: formData.email });
      
      const response = await api.register(formData.name, formData.password, formData.email);
      console.log('✅ [SignupModal] Đăng ký thành công:', response);
      
      // Auto login sau khi signup
      login({ ...response, id: response._id }, response.token);
      
      // Reset form và đóng modal
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setError(null);
      onClose();
      
      if (onSignupSuccess) {
        onSignupSuccess();
      }
    } catch (err: any) {
      console.error('❌ [SignupModal] Lỗi đăng ký:', err);
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {step === 'signup' ? '📝 Tham gia ngay cùng chúng tôi' : '🔐 Đăng nhập'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Nền tảng ôn luyện thông minh, cá nhân hóa lộ trình học tập và tối ưu điểm số của bạn.
              </p>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                  ❌ {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email của bạn"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu (≥6 ký tự)"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? '⏳ Đang xử lý...' : '✅ Đăng ký'}
              </button>

              <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
      onClose();         // 1. Đóng Modal hiện tại lại
      navigate('/login'); // 2. Chuyển hướng sang trang đăng nhập
    }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Điều hướng đến trang đăng nhập...
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Hãy dùng tài khoản của bạn để đăng nhập
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-b-lg text-xs text-slate-500 dark:text-slate-400">
          Bằng cách tham gia, bạn đồng ý với Điều khoản & Điều kiện chung cách báo một cách riêng tư
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
