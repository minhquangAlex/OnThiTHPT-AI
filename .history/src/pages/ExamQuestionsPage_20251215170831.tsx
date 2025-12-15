import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';

const ExamQuestionsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!examId) return;
      setLoading(true);
      try {
        // Lấy chi tiết đề thi (API getExamById trả về { ..., questions: [...] })
        const exam = await api.getExamById(examId);
        setExamInfo(exam);
        setQuestions(exam.questions || []);
      } catch (err) {
        console.error(err);
        alert('Không thể tải đề thi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);

  // Hàm render đáp án (Copy từ SubjectQuestionsPage)
  const renderCorrectAnswer = (q: Question) => {
    if (!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{q.correctAnswer || '—'}</span>;
    if (q.type === 'true_false') return <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 min-w-[120px]">{q.trueFalseOptions?.map((opt:any) => <div key={opt.id}><span className="font-bold uppercase">{opt.id}:</span> <span className={opt.isCorrect?'text-green-600':'text-red-500'}>{opt.isCorrect?'Đúng':'Sai'}</span></div>)}</div>;
    if (q.type === 'short_answer') return <span className="font-bold text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded border border-green-200 dark:border-green-800 inline-block">{q.shortAnswerCorrect}</span>;
    return <span>—</span>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Chi tiết Đề thi: {examInfo?.title || 'Đang tải...'}</h1>
            <p className="text-sm text-slate-500">
                Thời gian: {examInfo?.duration} phút • Tổng số: {questions.length} câu
            </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/2">Nội dung câu hỏi</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4">Đáp án đúng</th>
                    {/* Ở trang này Admin chỉ XEM, nếu muốn sửa thì phải vào Ngân hàng câu hỏi gốc */}
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-right">Trạng thái</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => (
                    <tr key={q._id || q.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 align-top">
                            <div>
                                <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
                                    Câu {index + 1} 
                                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal uppercase">
                                        {q.type || 'MC'}
                                    </span>
                                </div>
                                {q.imageUrl && (
                                    <div className="mb-3">
                                        <NgrokImage src={getFullImageUrl(q.imageUrl)} alt="question" className="max-h-40 max-w-full object-contain rounded border border-slate-300 bg-white" />
                                    </div>
                                )}
                                {q.questionText && <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 mb-2">{q.questionText}</div>}
                                {(!q.type || q.type === 'multiple_choice') && q.options && (
                                    <ul className="list-none p-0 m-0 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                        {['A', 'B', 'C', 'D'].map(key => (
                                            <li key={key} className={`${q.correctAnswer === key ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                                                <span className="inline-block w-5 font-bold">{key}.</span> {(q.options as any)[key]}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {q.type === 'true_false' && (
                                    <div className="mt-2 space-y-1 text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        {q.trueFalseOptions?.map((o: any) => (
                                            <div key={o.id} className="flex gap-2">
                                                <span className="font-bold uppercase text-indigo-500">{o.id})</span> 
                                                <span className="text-slate-700 dark:text-slate-300">{o.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="p-4 align-top">{renderCorrectAnswer(q)}</td>
                        <td className="p-4 text-right align-top text-sm text-slate-400 italic">
                            (Read-only)
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExamQuestionsPage;