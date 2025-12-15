import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

import AITutor from './components/AITutor';
import Header from './components/Header';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NewQuestionPage from './pages/NewQuestionPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import SubjectQuestionsPage from './pages/SubjectQuestionsPage';
import UserProfilePage from './pages/UserProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ExamSelectionPage from './pages/ExamSelectionPage'; // <--- 1. IMPORT MỚI
import SubjectExamsPage from './pages/SubjectExamsPage';
import ExamQuestionsPage from './pages/ExamQuestionsPage';
const App: React.FC = () => {
  const { user } = useAuthStore();

  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <HashRouter>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            
            {/* 👇 2. THÊM ROUTE CHO TRANG CHỌN ĐỀ 👇 */}
            <Route path="/exam-selection/:subjectId" element={<ProtectedRoute><ExamSelectionPage /></ProtectedRoute>} />

            <Route path="/quiz/:subjectId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/results/:attemptId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/questions/new" element={<ProtectedRoute><NewQuestionPage /></ProtectedRoute>} />
            <Route path="/admin/questions/:subjectId" element={<ProtectedRoute><SubjectQuestionsPage /></ProtectedRoute>} />
            <Route path="/admin/exams/:subjectId" element={<ProtectedRoute><SubjectExamsPage /></ProtectedRoute>} />
          </Routes>
        </main>
        {user && <AITutor />}
      </HashRouter>
    </div>
  );
};

export default App;