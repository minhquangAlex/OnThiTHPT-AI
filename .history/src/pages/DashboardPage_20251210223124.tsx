import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Subject } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { generateQuizWithAI } from '../services/geminiService';
import { useQuizStore } from '../store/useQuizStore';
import { useNavigate } from 'react-router-dom';


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
        console.log('--- [DEBUG] Data received on DashboardPage ---', data);
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
    // Simple prompt for demo purposes
    const aiQuestions = await generateQuizWithAI("Toán", "Khảo sát hàm số", 5);
    if (aiQuestions && aiQuestions.length > 0) {
      setQuiz(aiQuestions);
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

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chọn môn học</h1>
        <Button onClick={handleGenerateAIQuiz} disabled={isGenerating}>
            {isGenerating ? <Spinner size="sm" /> : 'Tạo đề nhanh với AI'}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => {
          const slug = subject.slug;
          if (!slug) {
            console.error('CRITICAL ERROR: Subject object is missing slug!', subject);
            return null;
          }
          return (
            // 👇 SỬA ĐƯỜNG DẪN TẠI ĐÂY: Thay /quiz/ thành /exam-selection/
            <Link 
              to={`/exam-selection/${subject._id}`} 
              state={{ subjectName: subject.name }} 
              key={subject._id}
            >
              <Card className="p-6 flex flex-col items-center justify-center text-center h-48 group">
                <subject.icon className="h-16 w-16 text-indigo-500 group-hover:scale-110 transition-transform" />
                <h3 className="mt-4 text-xl font-semibold">{subject.name}</h3>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;