import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { FilePlus } from 'lucide-react'; 
const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State form sửa (chỉ hỗ trợ sửa text cơ bản, nếu cần sửa full 3 loại thì cần nâng cấp thêm)
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });

  useEffect(() => {
    const load = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const qs = await api.getQuestions(subjectId);
        setQuestions(qs);
      } catch (err) {
        console.error(err);
        alert('Không thể tải câu hỏi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa câu hỏi');
    }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    // Lưu ý: Form sửa nhanh này hiện tại mới chỉ hỗ trợ Multiple Choice. 
    // Các loại câu hỏi khác nên chuyển sang trang Edit chi tiết (nếu có).
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || {}, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '' 
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const payload = { questionText: editForm.questionText, options: editForm.options, correctAnswer: editForm.correctAnswer, explanation: editForm.explanation };
      await api.updateQuestion(id, payload);
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload } : q)));
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật câu hỏi');
    }
  };

  // --- HÀM HELPER HIỂN THỊ ĐÁP ÁN ĐÚNG ---
  const renderCorrectAnswer = (q: Question) => {
    // 1. Trắc nghiệm (Phần I)
    if (!q.type || q.type === 'multiple_choice') {
        return <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{q.correctAnswer || '—'}</span>;
    }

    // 2. Đúng / Sai (Phần II)
    if (q.type === 'true_false') {
        return (
            <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                {q.trueFalseOptions?.map((opt: any) => (
                    <div key={opt.id} className="flex items-center justify-between gap-2">
                        <span className="font-bold uppercase w-4 text-slate-500">{opt.id}:</span>
                        <span className={`font-bold ${opt.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {opt.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // 3. Trả lời ngắn (Phần III)
    if (q.type === 'short_answer') {
        return (
            <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded border border-green-200 inline-block">
                {q.shortAnswerCorrect || '(Trống)'}
            </span>
        );
    }

    return <span>—</span>;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Quản lý câu hỏi: {subjectNameFromState || subjectId}</h1>
      <div className="mb-4">
        <Button onClick={() => navigate('/admin')}>Quay lại</Button>
        <Button className="ml-2" onClick={() => navigate('/admin/questions/new', { state: { subjectId } })}>Thêm câu hỏi cho môn này</Button>
      </div>

      <Card className="p-4 overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 w-1/2">Nội dung</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4">Đáp án đúng</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => (
                    <tr key={q._id || q.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 align-top">
                        {editingId === (q._id || q.id) ? (
                        <div>
                            {/* Form chỉnh sửa nhanh */}
                            <textarea
                            value={editForm.questionText}
                            onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                            className="w-full p-2 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            rows={3}
                            />
                            {/* Chỉ hiện options nếu là trắc nghiệm */}
                            {(!q.type || q.type === 'multiple_choice') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <label key={opt} className="text-sm">
                                        <div className="text-xs text-slate-500 mb-1 font-bold">{opt}</div>
                                        <input 
                                            value={editForm.options?.[opt] || ''} 
                                            onChange={(e) => setEditForm({ ...editForm, options: { ...editForm.options, [opt]: e.target.value } })} 
                                            className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500" 
                                        />
                                    </label>
                                ))}
                                </div>
                            )}
                        </div>
                        ) : (
                        <div>
                            <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Câu {index + 1} <span className="text-xs text-slate-400 font-normal">({q.type || 'multiple_choice'})</span>:</div>
                            
                            {/* Hiển thị Ảnh */}
                            {q.imageUrl && (
                            <div className="mb-3">
                                <NgrokImage 
                                src={getFullImageUrl(q.imageUrl)} 
                                alt="question" 
                                className="max-h-40 max-w-full object-contain rounded border border-slate-300 bg-white"
                                />
                            </div>
                            )}

                            {/* Hiển thị Text */}
                            {q.questionText ? (
                            <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{q.questionText}</div>
                            ) : !q.imageUrl && (
                            <div className="text-slate-400 italic">No content</div>
                            )}

                            {/* Hiển thị Options (Nếu là trắc nghiệm) */}
                            {(!q.type || q.type === 'multiple_choice') && q.options && (
                            <ul className="list-none p-0 m-0 mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                {['A', 'B', 'C', 'D'].map(key => (
                                <li key={key} className={`${q.correctAnswer === key ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                                    <span className="inline-block w-5 font-bold">{key}.</span> {q.options[key]}
                                </li>
                                ))}
                            </ul>
                            )}
                            
                            {/* Hiển thị nội dung cho True/False */}
                            {q.type === 'true_false' && (
                                <div className="mt-2 space-y-1 text-sm">
                                    {q.trueFalseOptions?.map((o: any) => (
                                        <div key={o.id}><span className="font-bold uppercase">{o.id})</span> {o.text}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}
                    </td>
                    <td className="p-3 align-top">
                        {editingId === (q._id || q.id) ? (
                            // Form sửa đáp án nhanh (chỉ hiện cho MC)
                            (!q.type || q.type === 'multiple_choice') ? (
                                <select value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} className="p-2 border rounded w-full">
                                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                </select>
                            ) : <div className="text-xs text-slate-500 italic">Vào chi tiết để sửa</div>
                        ) : (
                            // Render đáp án đúng
                            renderCorrectAnswer(q)
                        )}
                    </td>
                    <td className="p-3 text-right align-top w-40">
                        {editingId === (q._id || q.id) ? (
                        <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => saveEdit(q._id || q.id)}>Lưu</Button>
                            <Button size="sm" variant="secondary" onClick={cancelEdit}>Hủy</Button>
                        </div>
                        ) : (
                        <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(q._id || q.id)}>Xóa</Button>
                        </div>
                        )}
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

export default SubjectQuestionsPage;