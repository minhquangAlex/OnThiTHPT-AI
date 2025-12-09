import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Đảm bảo bạn đã cài lucide-react
import api from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validate
  const isLengthValid = password.length >= 8 && password.length <= 50;
  const isComplexValid = /^(?=.*[0-9])(?=.*[A-Z]).{8,}$/.test(password); 
  const isMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLengthValid || !isMatch) return;

    setIsLoading(true);
    try {
      // Lấy param userId hoặc username từ query string
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      const username = params.get('username');

      // Gọi API public reset password
      await api.publicResetPassword({ userId: userId || undefined, username: username || undefined, password });

      alert('Cập nhật mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      navigate('/login');
    } catch (error) {
      console.error('[ResetPasswordPage] Lỗi reset password:', error);
      alert((error as any)?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/50 fixed inset-0 z-50 backdrop-blur-sm">
      <div className="max-w-[480px] w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in-up relative">
        
        {/* Nút đóng/quay lại */}
        <button 
          onClick={() => navigate('/login')} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/login')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Cập nhật mật khẩu mới</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-blue-600 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Điều kiện mật khẩu */}
          <div className="text-xs space-y-2 text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className={isLengthValid ? 'text-green-600 flex items-center gap-2 font-medium' : 'flex items-center gap-2'}>
              {isLengthValid ? '✓' : '•'} Mật khẩu trong khoảng 8-50 ký tự
            </p>
            <p className={isComplexValid ? 'text-green-600 flex items-center gap-2 font-medium' : 'flex items-center gap-2'}>
              {isComplexValid ? '✓' : '•'} Bao gồm ít nhất 01 chữ viết hoa và 01 số
            </p>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={!isLengthValid || !isMatch || isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all mt-2"
          >
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;