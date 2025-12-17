import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Subject } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { generateQuizWithAI } from '../services/geminiService';
import { useQuizStore } from '../store/useQuizStore';
import { Sparkles, BookOpen } from 'lucide-react'; // Thêm icon trang trí

const DashboardPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { setQuiz } = useQuizStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSubjects();
        setSubjects(data);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjects();
  }, []);
  
  const handleGenerateAIQuiz = async () => {
    setIsGenerating(true);
    const aiQuestions = await generateQuizWithAI("Toán", "Khảo sát hàm số", 5);
    if (aiQuestions && aiQuestions.length > 0) {
      setQuiz(aiQuestions, "Đề AI tạo");
      navigate('/quiz/ai-generated');
    } else {
      alert("Không thể tạo đề từ AI. Vui lòng thử lại.");
    }
    setIsGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Tách môn ĐGNL ra khỏi danh sách thường
  const dgnlSubject = subjects.find(s => s.slug === 'dgnl');
  const normalSubjects = subjects.filter(s => s.slug !== 'dgnl');

  return (
    <div className="container mx-auto py-6 px-4">
      
      {/* Header & AI Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Thư viện ôn thi</h1>
        <Button onClick={handleGenerateAIQuiz} disabled={isGenerating} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-none shadow-lg">
            {isGenerating ? <Spinner size="sm" /> : <><Sparkles className="w-4 h-4 mr-2"/> Tạo đề nhanh với AI</>}
        </Button>
      </div>

      {/* --- PHẦN 1: LUYỆN THI ĐÁNH GIÁ NĂNG LỰC (FEATURED) --- */}
      {dgnlSubject && (
        <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="text-2xl">🔥</span> Kỳ thi trọng điểm
            </h2>
            <Link to={`/exam-selection/${dgnlSubject._id}`} state={{ subjectName: dgnlSubject.name }}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 group cursor-pointer">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>
                    
                    <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <dgnlSubject.icon className="w-8 h-8 text-white" />
                                </div>
                                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Mới 2025
                                </span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold mb-3">{dgnlSubject.name}</h3>
                            <p className="text-blue-100 text-lg max-w-2xl">
                                {dgnlSubject.description || "Luyện đề tổng hợp 120 câu chuẩn cấu trúc ĐHQG TP.HCM."}
                            </p>
                            <div className="mt-6 flex gap-4">
                                <span className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium backdrop-blur-sm border border-white/30">
                                    📝 120 Câu hỏi
                                </span>
                                <span className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium backdrop-blur-sm border border-white/30">
                                    ⏱️ 150 Phút
                                </span>
                            </div>
                        </div>
                        
                        <div className="shrink-0">
                            <button className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full shadow-lg group-hover:bg-blue-50 transition-colors">
                                Vào ôn thi ngay &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
      )}

      {/* --- PHẦN 2: ÔN LUYỆN TỪNG MÔN --- */}
      <div>
        <h2 className="text-xl font-bold mb-6 text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500"/> Môn học thành phần
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {normalSubjects.map((subject) => (
                <Link to={`/exam-selection/${subject._id}`} state={{ subjectName: subject.name }} key={subject._id}>
                <Card className="p-6 flex flex-col items-center justify-center text-center h-48 group hover:border-indigo-500 transition-all hover:shadow-md bg-white dark:bg-slate-800">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                        <subject.icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {subject.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{subject.questionCount || 0} câu hỏi</p>
                </Card>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;