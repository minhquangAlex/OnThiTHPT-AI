import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { FilePlus, Image as ImageIcon, Upload } from 'lucide-react';

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State quản lý việc sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // FORM SỬA: Mở rộng thêm các trường cho TF và ShortAnswer
  const [editForm, setEditForm] = useState<any>({ 
    questionText: '', 
    options: {}, 
    correctAnswer: 'A', 
    explanation: '',
    trueFalseOptions: [], // Mới
    shortAnswerCorrect: '' // Mới
  });
  
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleCreateExam = async () => {
    const title = prompt('Nhập tên đề thi (Ví dụ: Đề thi thử HK1):');
    if (!title) return;
    if (!confirm(`Hệ thống sẽ lấy ngẫu nhiên câu hỏi từ ngân hàng môn này để tạo thành đề thi "${title}". Tiếp tục?`)) return;

    try {
        await api.createFixedExam({ subjectId: subjectId!, title: title });
        alert('Đã tạo đề thi thành công! Học sinh có thể thấy đề này ở mục "Bộ đề tuyển chọn".');
    } catch (err: any) {
        alert(err.message || 'Lỗi khi tạo đề thi.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa câu hỏi');
    }
  };

  // --- BẮT ĐẦU SỬA (CẬP NHẬT LOGIC) ---
  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    
    // Nạp dữ liệu vào form, bao gồm cả các trường mới
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || { A: '', B: '', C: '', D: '' }, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '',
        // Nếu không có dữ liệu cũ thì tạo mặc định
        trueFalseOptions: q.trueFalseOptions && q.trueFalseOptions.length > 0 ? q.trueFalseOptions : [
            { id: 'a', text: '', isCorrect: false },
            { id: 'b', text: '', isCorrect: false },
            { id: 'c', text: '', isCorrect: false },
            { id: 'd', text: '', isCorrect: false },
        ],
        shortAnswerCorrect: q.shortAnswerCorrect || ''
    });

    setEditImageFile(null);
    if (q.imageUrl) {
        setEditImagePreview(getFullImageUrl(q.imageUrl) || null);
    } else {
        setEditImagePreview(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '', trueFalseOptions: [], shortAnswerCorrect: '' });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) return alert('Ảnh quá lớn (>5MB)');
        setEditImageFile(file);
        setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // --- LƯU SỬA (CẬP NHẬT LOGIC) ---
  const saveEdit = async (id: string, type: string) => {
    try {
      setIsUploading(true);
      let newImageUrl = undefined;

      if (editImageFile) {
          const res = await api.uploadFile(editImageFile);
          newImageUrl = res.url;
      } 

      // Tạo payload cơ bản
      const payload: any = { 
          questionText: editForm.questionText, 
          explanation: editForm.explanation,
      };

      // Thêm dữ liệu tùy theo loại câu hỏi
      if (!type || type === 'multiple_choice') {
          payload.options = editForm.options;
          payload.correctAnswer = editForm.correctAnswer;
      } else if (type === 'true_false') {
          payload.trueFalseOptions = editForm.trueFalseOptions;
      } else if (type === 'short_answer') {
          payload.shortAnswerCorrect = editForm.shortAnswerCorrect;
      }

      if (newImageUrl) payload.imageUrl = newImageUrl;

      await api.updateQuestion(id, payload);
      
      // Update local state
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload, imageUrl: newImageUrl || q.imageUrl } : q)));
      
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật câu hỏi');
    } finally {
      setIsUploading(false);
    }
  };

  // --- RENDER ANSWER COLUMN (Cột hiển thị đáp án đúng - chỉ xem) ---
  const renderCorrectAnswer = (q: Question) => {
    if (!q.type || q.type === 'multiple_choice') {
        return <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{q.correctAnswer || '—'}</span>;
    }
    if (q.type === 'true_false') {
        return (
            <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 min-w-[120px]">
                {q.trueFalseOptions?.map((opt: any) => (
                    <div key={opt.id} className="flex items-center justify-between gap-2 border-b last:border-0 border-slate-200 dark:border-slate-600 pb-1 last:pb-0 mb-1 last:mb-0">
                        <span className="font-bold uppercase w-4 text-slate-500">{opt.id}:</span>
                        <span className={`font-bold ${opt.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {opt.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    if (q.type === 'short_answer') {
        return (
            <span className="font-bold text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded border border-green-200 dark:border-green-800 inline-block">
                {q.shortAnswerCorrect || '(Trống)'}
            </span>
        );
    }
    return <span>—</span>;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Quản lý câu hỏi: {subjectNameFromState || subjectId}</h1>
      
      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => navigate('/admin')}>Quay lại</Button>
        <Button className="ml-2" onClick={() => navigate('/admin/questions/new', { state: { subjectId } })}>Thêm câu hỏi mới</Button>
        <Button className="ml-2 bg-purple-600 hover:bg-purple-700 flex items-center gap-2" onClick={handleCreateExam}>
            <FilePlus className="w-4 h-4" /> Đóng gói thành Đề thi
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/2">Nội dung câu hỏi</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4">Đáp án đúng</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => (
                    <tr key={q._id || q.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* CỘT 1: NỘI DUNG & FORM SỬA */}
                    <td className="p-4 align-top">
                        {editingId === (q._id || q.id) ? (
                        <div className="space-y-4">
                            {/* --- EDIT: ẢNH --- */}
                            <div className="flex items-start gap-4 p-3 border rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <div className="shrink-0 w-20 h-20 bg-white border rounded flex items-center justify-center overflow-hidden">
                                    {editImagePreview ? (
                                        <img src={editImagePreview} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="text-slate-300 w-8 h-8" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1 cursor-pointer text-indigo-600 hover:underline">
                                        Chọn ảnh mới
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleEditFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-slate-400">Hỗ trợ JPG, PNG. Tối đa 5MB.</p>
                                </div>
                            </div>

                            {/* --- EDIT: TEXT CÂU HỎI --- */}
                            <textarea
                                value={editForm.questionText}
                                onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Nội dung câu hỏi..."
                            />

                            {/* --- EDIT: CÁC TRƯỜNG THEO LOẠI CÂU HỎI (QUAN TRỌNG) --- */}
                            
                            {/* 1. TRẮC NGHIỆM */}
                            {(!q.type || q.type === 'multiple_choice') && (
                                <div className="grid grid-cols-1 gap-2">
                                    {['A', 'B', 'C', 'D'].map((opt) => (
                                        <div key={opt} className="flex gap-2 items-center">
                                            <span className="font-bold w-4 text-slate-500">{opt}</span>
                                            <input 
                                                value={editForm.options?.[opt] || ''} 
                                                onChange={(e) => setEditForm({ ...editForm, options: { ...editForm.options, [opt]: e.target.value } })} 
                                                className="w-full p-2 border rounded text-sm dark:bg-slate-800 dark:border-slate-600" 
                                            />
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                                        <span className="text-sm font-bold">Đáp án đúng:</span>
                                        <select 
                                            value={editForm.correctAnswer} 
                                            onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} 
                                            className="p-1 border rounded bg-white dark:bg-slate-800"
                                        >
                                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* 2. ĐÚNG / SAI (MỚI) */}
                            {q.type === 'true_false' && (
                                <div className="space-y-2 border p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Chỉnh sửa các ý:</p>
                                    {editForm.trueFalseOptions.map((opt: any, idx: number) => (
                                        <div key={opt.id} className="flex items-center gap-2">
                                            <span className="font-bold uppercase w-6 text-indigo-600">{opt.id})</span>
                                            <input 
                                                className="flex-1 p-1.5 border rounded text-sm dark:bg-slate-800 dark:border-slate-600"
                                                value={opt.text}
                                                onChange={(e) => {
                                                    const newArr = [...editForm.trueFalseOptions];
                                                    newArr[idx].text = e.target.value;
                                                    setEditForm({ ...editForm, trueFalseOptions: newArr });
                                                }}
                                            />
                                            <select 
                                                className={`p-1.5 border rounded text-sm font-bold w-20 ${opt.isCorrect ? 'text-green-600' : 'text-red-500'}`}
                                                value={opt.isCorrect ? 'true' : 'false'}
                                                onChange={(e) => {
                                                    const newArr = [...editForm.trueFalseOptions];
                                                    newArr[idx].isCorrect = e.target.value === 'true';
                                                    setEditForm({ ...editForm, trueFalseOptions: newArr });
                                                }}
                                            >
                                                <option value="true">Đúng</option>
                                                <option value="false">Sai</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. TRẢ LỜI NGẮN (MỚI) */}
                            {q.type === 'short_answer' && (
                                <div className="p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/10">
                                    <label className="block text-sm font-bold text-green-700 dark:text-green-400 mb-1">Đáp án số chính xác:</label>
                                    <input 
                                        value={editForm.shortAnswerCorrect}
                                        onChange={(e) => setEditForm({ ...editForm, shortAnswerCorrect: e.target.value })}
                                        className="w-full p-2 border border-green-300 rounded focus:ring-green-500 font-bold text-lg dark:bg-slate-800 dark:border-green-700"
                                        placeholder="VD: 2025"
                                    />
                                </div>
                            )}
                        </div>
                        ) : (
                        <div>
                            {/* --- VIEW MODE --- */}
                            <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400 flex justify-between">
                                <span>Câu {index + 1}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal uppercase">
                                    {q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Tự luận' : 'Trắc nghiệm'}
                                </span>
                            </div>
                            
                            {q.imageUrl && (
                            <div className="mb-3">
                                <NgrokImage 
                                    src={getFullImageUrl(q.imageUrl)} 
                                    alt="question" 
                                    className="max-h-40 max-w-full object-contain rounded border border-slate-300 bg-white"
                                />
                            </div>
                            )}

                            {q.questionText ? (
                                <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 mb-2">{q.questionText}</div>
                            ) : !q.imageUrl && (
                                <div className="text-slate-400 italic mb-2">No content</div>
                            )}

                            {/* Options View */}
                            {(!q.type || q.type === 'multiple_choice') && q.options && (
                            <ul className="list-none p-0 m-0 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                {['A', 'B', 'C', 'D'].map(key => (
                                <li key={key} className={`${q.correctAnswer === key ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                                    <span className="inline-block w-5 font-bold">{key}.</span> {q.options[key]}
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
                        )}
                    </td>

                    {/* CỘT 2: ĐÁP ÁN ĐÚNG (View Only) */}
                    <td className="p-4 align-top">
                        {renderCorrectAnswer(q)}
                    </td>

                    {/* CỘT 3: HÀNH ĐỘNG */}
                    <td className="p-4 text-right align-top w-40">
                        {editingId === (q._id || q.id) ? (
                        <div className="flex justify-end gap-2 flex-col">
                            <Button size="sm" onClick={() => saveEdit(q._id || q.id, q.type)} disabled={isUploading}>
                                {isUploading ? 'Lưu...' : 'Lưu'}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={isUploading}>Hủy</Button>
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