import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import api from '../services/api';
import { Clock, FileText, Shuffle, ArrowRight, BrainCircuit, Languages, FlaskConical, Calculator } from 'lucide-react';
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
  
  // Xác định xem có phải là môn ĐGNL không
  const isDGNL = subjectName.toLowerCase().includes('đánh giá năng lực') || subjectName.toLowerCase().includes('đgnl');

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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">
            Ôn thi môn: <span className="text-indigo-600">{subjectName}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {isDGNL 
              ? "Bài thi tổng hợp đánh giá năng lực cơ bản để học đại học của ĐHQG TP.HCM."
              : "Chọn phương thức luyện tập phù hợp với bạn."}
          </p>
      </div>

      {/* --- KHỐI 1: TẠO ĐỀ NGẪU NHIÊN --- */}
      <div className="mb-12">
        {isDGNL ? (
          // === GIAO DIỆN ĐẶC BIỆT CHO ĐGNL ===
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-2xl">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

             <div className="relative z-10 p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-6">
                        <div>
                            <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Cấu trúc chuẩn 2025</span>
                            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Đề thi Đánh Giá Năng Lực</h2>
                            <p className="text-blue-100 mt-2 text-lg">Tổng hợp 120 câu hỏi trắc nghiệm khách quan đa lựa chọn.</p>
                        </div>

                        {/* Thống kê cấu trúc */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* Phần 1 */}
    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Languages className="w-12 h-12" />
        </div>
        <Languages className="w-6 h-6 text-blue-300 mb-2"/>
        <div className="font-bold text-lg">Phần 1: Ngôn ngữ</div>
        <div className="text-sm text-blue-200">Tiếng Việt & Tiếng Anh</div>
        <div className="mt-2 pt-2 border-t border-white/10 text-xs font-medium">
            <div className="flex justify-between"><span>Tiếng Việt:</span> <span>30 câu</span></div>
            <div className="flex justify-between"><span>Tiếng Anh:</span> <span>30 câu</span></div>
            <div className="font-bold text-yellow-300 mt-1">Tổng: 60 câu</div>
        </div>
    </div>

    {/* Phần 2 */}
    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calculator className="w-12 h-12" />
        </div>
        <Calculator className="w-6 h-6 text-green-300 mb-2"/>
        <div className="font-bold text-lg">Phần 2: Toán học</div>
        <div className="text-sm text-blue-200">Tư duy logic toán học</div>
        <div className="mt-2 pt-2 border-t border-white/10 text-xs font-medium">
            <div className="flex justify-between"><span>Toán học:</span> <span>30 câu</span></div>
            <div className="font-bold text-yellow-300 mt-1">Tổng: 30 câu</div>
        </div>
    </div>

    {/* Phần 3 */}
    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FlaskConical className="w-12 h-12" />
        </div>
        <FlaskConical className="w-6 h-6 text-purple-300 mb-2"/>
        <div className="font-bold text-lg">Phần 3: Khoa học</div>
        <div className="text-sm text-blue-200">Tư duy & Suy luận</div>
        <div className="mt-2 pt-2 border-t border-white/10 text-xs font-medium">
            <div className="flex justify-between"><span>Logic/Số liệu:</span> <span>12 câu</span></div>
            <div className="flex justify-between"><span>Suy luận KH:</span> <span>18 câu</span></div>
            <div className="font-bold text-yellow-300 mt-1">Tổng: 30 câu</div>
        </div>
    </div>
</div>

                        <div className="flex items-center gap-6 text-sm font-medium pt-2">
                             <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-400"/> 150 Phút</div>
                             <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-yellow-400"/> 120 Câu hỏi</div>
                             <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-yellow-400"/> 1200 Điểm</div>
                        </div>
                    </div>

                    {/* Nút Bắt đầu to */}
                    <div className="shrink-0 w-full md:w-auto">
                        <button 
                            onClick={handleStartRandom}
                            className="w-full md:w-auto px-8 py-4 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
                        >
                          Làm bài thi thử ngay <ArrowRight className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        ) : (
          // === GIAO DIỆN CHO MÔN THƯỜNG (CŨ) ===
          <Card className="p-0 overflow-hidden border-none shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-indigo-100 font-medium uppercase tracking-wider text-sm">
                  <Shuffle className="w-4 h-4" /> Đề xuất
                </div>
                <h3 className="text-2xl font-bold mb-2">Tạo đề thi ngẫu nhiên</h3>
                <p className="text-indigo-100 mb-4 max-w-xl">
                  Hệ thống sẽ tự động tổng hợp câu hỏi từ ngân hàng đề theo đúng ma trận.
                </p>
                {config && (
                  <div className="flex flex-wrap gap-3 text-xs font-semibold bg-white/10 p-3 rounded-lg w-fit backdrop-blur-sm">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {config.duration} phút</span>
                    <span>•</span>
                    <span>{config.structure?.multiple_choice || 0} TN</span>
                    <span>•</span>
                    <span>{config.structure?.true_false || 0} Đ/S</span>
                    <span>•</span>
                    <span>{config.structure?.short_answer || 0} TL</span>
                  </div>
                )}
              </div>
              <button 
                  onClick={handleStartRandom}
                  className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Bắt đầu ngay <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </Card>
        )}
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
                  <span className="mx-1">•</span>
                  <span>{exam.questions?.length || 0} câu</span>
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