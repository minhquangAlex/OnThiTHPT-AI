import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper và component ảnh
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { Image as ImageIcon, Unlink } from 'lucide-react'; // Thêm icon Unlink

const ExamQuestionsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ SỬA ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ 
    questionText: '', 
    options: {}, 
    correctAnswer: 'A', 
    explanation: '', 
    trueFalseOptions: [], 
    shortAnswerCorrect: '' 
  });
  
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // --- STATE CHỌN NHIỀU (MỚI) ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      if (!examId) return;
      setLoading(true);
      try {
        const exam = await api.getExamById(examId);
        setExamInfo(exam);
        // Lọc bỏ các câu hỏi null (nếu có câu đã bị xóa khỏi DB)
        setQuestions((exam.questions || []).filter((q: any) => q !== null));
      } catch (err) {
        console.error(err);
        alert('Không thể tải đề thi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);
  

  // --- HÀM GỠ CÂU HỎI KHỎI ĐỀ THI (THAY THẾ HÀM DELETE) ---
  const handleRemoveQuestion = async (id: string) => {
    if (!confirm('Bạn có chắc muốn GỠ câu hỏi này khỏi đề thi? (Câu hỏi vẫn tồn tại trong Ngân hàng câu hỏi).')) return;
    try {
      await api.removeQuestionFromExam(examId!, id);
      setQuestions(prev => prev.filter(q => (q._id || q.id) !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gỡ câu hỏi');
    }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || { A: '', B: '', C: '', D: '' }, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '',
        trueFalseOptions: q.trueFalseOptions && q.trueFalseOptions.length > 0 ? q.trueFalseOptions : [
            { id: 'a', text: '', isCorrect: false }, 
            { id: 'b', text: '', isCorrect: false }, 
            { id: 'c', text: '', isCorrect: false }, 
            { id: 'd', text: '', isCorrect: false }
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

  const saveEdit = async (id: string, type: string) => {
    try {
      setIsUploading(true);
      let newImageUrl = undefined;

      if (editImageFile) {
          const res = await api.uploadFile(editImageFile);
          newImageUrl = res.url;
      } 

      const payload: any = { 
          questionText: editForm.questionText, 
          explanation: editForm.explanation,
      };

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
      
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload, imageUrl: newImageUrl || q.imageUrl } : q)));
      
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật câu hỏi');
    } finally {
      setIsUploading(false);
    }
  };

  // --- RENDER ĐÁP ÁN ĐÚNG ---
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Chi tiết Đề thi: {examInfo?.title || '...'}</h1>
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
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => {
                    const qId = q._id || q.id;
                    return (
                        <tr key={qId} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            
                            {/* CỘT 1: NỘI DUNG & FORM SỬA */}
                            <td className="p-4 align-top">
                                {editingId === qId ? (
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

                                    {/* --- EDIT: CÁC TRƯỜNG THEO LOẠI CÂU HỎI --- */}
                                    
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

                                    {q.type === 'true_false' && (
                                        <div className="space-y-2 border p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
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

                                    {q.type === 'short_answer' && (
                                        <div className="p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/10">
                                            <input 
                                                value={editForm.shortAnswerCorrect}
                                                onChange={(e) => setEditForm({ ...editForm, shortAnswerCorrect: e.target.value })}
                                                className="w-full p-2 border border-green-300 rounded focus:ring-green-500 font-bold text-lg dark:bg-slate-800 dark:border-green-700"
                                                placeholder="VD: 2025"
                                            />
                                        </div>
                                    )}

                                    {/* --- EDIT: GIẢI THÍCH (MỚI) --- */}
                                    <div className="mt-3">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Giải thích chi tiết:</label>
                                        <textarea
                                            value={editForm.explanation}
                                            onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                                            className="w-full p-2 border rounded bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-sm focus:ring-yellow-500"
                                            rows={3}
                                            placeholder="Nhập lời giải hoặc hướng dẫn..."
                                        />
                                    </div>
                                </div>
                                ) : (
                                <div>
                                    {/* --- VIEW MODE --- */}
                                    <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
                                        Câu {index + 1} 
                                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal uppercase">
                                            {q.type || 'MC'}
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

                                    {q.questionText && <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 mb-2">{q.questionText}</div>}
                                    {!q.questionText && !q.imageUrl && <div className="text-slate-400 italic mb-2">No content</div>}

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

                                    {/* --- VIEW: GIẢI THÍCH (MỚI) --- */}
                                    {q.explanation && (
                                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 text-sm text-slate-700 dark:text-slate-300 rounded-r">
                                            <p className="font-bold text-xs text-yellow-700 dark:text-yellow-500 mb-1 flex items-center gap-1">💡 GIẢI THÍCH:</p>
                                            <div className="whitespace-pre-wrap leading-relaxed">{q.explanation}</div>
                                        </div>
                                    )}
                                </div>
                                )}
                            </td>

                            {/* CỘT 2: ĐÁP ÁN ĐÚNG */}
                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                    (!q.type || q.type === 'multiple_choice') ? (
                                        <select value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} className="p-2 border rounded w-full bg-white dark:bg-slate-800">
                                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                        </select>
                                    ) : <div className="text-xs text-slate-500 italic">Xem chi tiết để sửa</div>
                                ) : (
                                    renderCorrectAnswer(q)
                                )}
                            </td>

                            {/* CỘT 3: HÀNH ĐỘNG */}
                            <td className="p-4 text-right align-top w-40">
                                {editingId === qId ? (
                                <div className="flex justify-end gap-2 flex-col">
                                    <Button size="sm" onClick={() => saveEdit(qId, q.type)} disabled={isUploading}>
                                        {isUploading ? 'Lưu...' : 'Lưu'}
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={isUploading}>Hủy</Button>
                                </div>
                                ) : (
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                                    
                                    {/* 👇 NÚT GỠ CÂU HỎI (MÀU CAM) 👇 */}
                                    <Button 
                                        size="sm" 
                                        className="bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center w-8 h-8 p-0" 
                                        onClick={() => handleRemoveQuestion(qId)}
                                        title="Gỡ khỏi đề thi (Unlink)"
                                    >
                                        <Unlink className="w-4 h-4" />
                                    </Button>
                                </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExamQuestionsPage;