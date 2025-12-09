
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogoIcon, UserIcon, LogoutIcon } from './icons/CoreIcons';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-indigo-500" />
            <span className="text-xl font-bold text-slate-800 dark:text-white">OnThiTHPT AI</span>
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-slate-600 dark:text-slate-300">
                  Chào, {user.name}
                </span>
                <Link to="/profile" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Trang cá nhân">
                  <UserIcon className="h-6 w-6 text-slate-500 hover:text-indigo-500" />
                </Link>
                 {user.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-indigo-500 dark:text-slate-300 dark:hover:text-indigo-400">
                        Admin
                    </Link>
                 )}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Đăng xuất"
                >
                  <LogoutIcon className="h-6 w-6 text-slate-500" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;