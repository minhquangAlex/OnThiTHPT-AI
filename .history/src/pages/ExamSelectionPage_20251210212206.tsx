import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../services/api';
import { Clock, FileText, Shuffle } from 'lucide-react';

const ExamSelectionPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [fixedExams, setFixedExams] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [subjectName, setSubjectName] = useState(subjectNameFromState || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      try {
        // API này trả về danh sách đề cố định + cấu hình môn học
        const res = await api.getExamsBySubject(subjectId!); 
        setFixedExams(res.fixedExams);
        setConfig(res.config);
        if (res.subjectName) setSubjectName(res.subjectName);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, [subjectId]);

  const handleStartRandom = async () => {
    // Chuyển hướng sang QuizPage với mode = random
    navigate(`/quiz/${subjectId}?mode=random`, { 
        state: { subjectName, duration: config?.duration } 
    });
  };

  const handleStartFixed = (examId: string, duration: number) => {
    // Chuyển hướng sang QuizPage với mode = fixed
    navigate(`/quiz/${subjectId}?mode=fixed&examId=${examId}`, { 
        state: { subjectName, duration } 
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">
        Ôn thi môn: {subjectName}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Chọn đề thi để bắt đầu làm bài.
      </p>

      {/* KHỐI 1: TẠO ĐỀ NGẪU NHIÊN */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-600">
          <Shuffle className="w-5 h-5" /> Luyện tập ngẫu nhiên
        </h2>
        <Card className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold">Đề thi cấu trúc chuẩn 2025</h3>
              <p className="opacity-90 mt-1">
                Hệ thống sẽ tự động tạo đề dựa trên ma trận đề thi của Bộ GD&ĐT.
              </p>
              {config && (
                <div className="flex gap-4 mt-3 text-sm font-medium bg-white/20 p-2 rounded w-fit">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {config.duration} phút</span>
                  <span>•</span>
                  <span>{config.structure?.multiple_choice || 0} Trắc nghiệm</span>
                  <span>•</span>
                  <span>{config.structure?.true_false || 0} Đúng/Sai</span>
                  <span>•</span>
                  <span>{config.structure?.short_answer || 0} Tự luận</span>
                </div>
              )}
            </div>
            <button 
                onClick={handleStartRandom}
                className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-full shadow-lg hover:bg-gray-100 transition-transform active:scale-95"
            >
              Bắt đầu ngay
            </button>
          </div>
        </Card>
      </div>

      {/* KHỐI 2: DANH SÁCH ĐỀ CỐ ĐỊNH */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <FileText className="w-5 h-5" /> Bộ đề tuyển chọn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixedExams.map((exam) => (
            <Card key={exam._id} className="p-5 hover:border-indigo-500 transition-colors cursor-pointer group" onClick={() => handleStartFixed(exam._id, exam.duration)}>
              <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600">{exam.title}</h3>
              <div className="flex justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration} phút</span>
                <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
          {fixedExams.length === 0 && (
            <p className="text-slate-500 italic col-span-3">Chưa có đề thi cố định nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSelectionPage;