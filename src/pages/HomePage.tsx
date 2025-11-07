
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto text-center py-16 px-4 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto backdrop-blur-sm p-8 rounded-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-8">
            Chinh phục kỳ thi THPT Quốc Gia với AI
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Nền tảng ôn luyện thông minh, cá nhân hóa lộ trình học tập và tối đa hóa điểm số của bạn. 
            <span className="block mt-2 font-semibold">Sẵn sàng để bắt đầu chưa?</span>
          </p>
          <div className="mt-10">
            <Link to="/login">
              <Button size="lg" className="transform hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-indigo-500/25">
                Bắt đầu ngay
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="group p-8 bg-white dark:bg-slate-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Ôn tập hiệu quả</h3>
            <p className="text-slate-600 dark:text-slate-400">Ngân hàng câu hỏi đa dạng, bám sát cấu trúc đề thi mới nhất của Bộ GD-ĐT.</p>
          </div>
          
          <div className="group p-8 bg-white dark:bg-slate-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">AI Tutor 24/7</h3>
            <p className="text-slate-600 dark:text-slate-400">Giải đáp mọi thắc mắc, giải thích cặn kẽ từng câu hỏi với trợ lý AI thông minh.</p>
          </div>
          
          <div className="group p-8 bg-white dark:bg-slate-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Thống kê tiến độ</h3>
            <p className="text-slate-600 dark:text-slate-400">Theo dõi điểm mạnh, điểm yếu qua các biểu đồ trực quan, cá nhân hóa lộ trình học.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;