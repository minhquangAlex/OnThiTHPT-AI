import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import api from '../services/api';
import { Clock, FileText, Shuffle, ArrowRight } from 'lucide-react';
import Spinner from '../components/Spinner';

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

  const handleStartRandom = () => {
    navigate(`/quiz/${subjectId}?mode=random`, { 
        state: { subjectName } 
    });
  };

  const handleStartFixed = (examId: string) => {
    navigate(`/quiz/${subjectId}?mode=fixed&examId=${examId}`, { 
        state: { subjectName } 
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">
        Ôn thi môn: <span className="text-indigo-600">{subjectName}</span>
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Chọn phương thức luyện tập phù hợp với bạn.
      </p>

      {/* KHỐI 1: LUYỆN TẬP NGẪU NHIÊN */}
      <div className="mb-10 transform transition-all hover:scale-[1.01]">
        <Card className="p-0 overflow-hidden border-none shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 text-indigo-100 font-medium uppercase tracking-wider text-sm">
                <Shuffle className="w-4 h-4" /> Đề xuất
              </div>
              <h3 className="text-2xl font-bold mb-2">Tạo đề thi ngẫu nhiên chuẩn 2025</h3>
              <p className="text-indigo-100 mb-4 max-w-xl">
                Hệ thống sẽ tự động tổng hợp câu hỏi từ ngân hàng đề theo đúng ma trận của Bộ Giáo dục & Đào tạo.
              </p>
              {config && (
                <div className="flex flex-wrap gap-3 text-xs font-semibold bg-white/10 p-3 rounded-lg w-fit backdrop-blur-sm">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {config.duration} phút</span>
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
                className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-full shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              Bắt đầu ngay <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </Card>
      </div>

      {/* KHỐI 2: DANH SÁCH ĐỀ CỐ ĐỊNH */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white border-l-4 border-indigo-500 pl-3">
          <FileText className="w-6 h-6 text-indigo-500" /> Bộ đề tuyển chọn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fixedExams.map((exam) => (
            <Card key={exam._id} className="p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-full" onClick={() => handleStartFixed(exam._id)}>
              <div>
                <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{exam.duration} phút</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                <span className="text-xs text-slate-400">{new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                <span className="text-sm font-medium text-indigo-600 group-hover:underline">Làm bài &rarr;</span>
              </div>
            </Card>
          ))}
          {fixedExams.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-slate-500">Chưa có đề thi cố định nào cho môn này.</p>
                <button onClick={handleStartRandom} className="text-indigo-600 font-medium hover:underline mt-2">Hãy thử tạo đề ngẫu nhiên</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSelectionPage;