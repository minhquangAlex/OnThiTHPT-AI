import { FilePlus, Image as ImageIcon } from 'lucide-react'; // Thêm icon
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import NgrokImage from '../components/NgrokImage';
import api from '../services/api';
import { Question } from '../types';
import { getFullImageUrl } from '../utils/imageHelper';

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State quản lý việc sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
  
  // --- STATE MỚI CHO ẢNH ---
  const [editImageFile, setEditImageFile] = useState<File | null>(null); // File mới chọn
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null); // Link hiển thị (ảnh cũ hoặc ảnh mới)
  const [isUploading, setIsUploading] = useState(false); // Trạng thái đang upload

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
        await api.createFixedExam({
            subjectId: subjectId!,
            title: title
        });
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

  // --- BẮT ĐẦU SỬA ---
  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    
    // Fill dữ liệu text
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || {}, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '' 
    });

    // Fill dữ liệu ảnh
    setEditImageFile(null); // Reset file mới
    if (q.imageUrl) {
        setEditImagePreview(getFullImageUrl(q.imageUrl) || null); // Hiện ảnh cũ
    } else {
        setEditImagePreview(null);
    }
  };

  // --- HỦY SỬA ---
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // --- CHỌN ẢNH MỚI ---
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) return alert('Ảnh quá lớn (>5MB)');
        
        setEditImageFile(file);
        setEditImagePreview(URL.createObjectURL(file)); // Tạo link preview tạm thời
    }
  };

  // --- LƯU SỬA (CÓ UPLOAD ẢNH) ---
  const saveEdit = async (id: string) => {
    try {
      setIsUploading(true);
      let newImageUrl = undefined;

      // 1. Nếu có chọn ảnh mới -> Upload lên Cloudinary trước
      if (editImageFile) {
          const res = await api.uploadFile(editImageFile);
          newImageUrl = res.url;
      } 

      // 2. Gom dữ liệu update
      const payload: any = { 
          questionText: editForm.questionText, 
          options: editForm.options, 
          correctAnswer: editForm.correctAnswer, 
          explanation: editForm.explanation 
      };

      // Chỉ gửi field imageUrl nếu có ảnh mới (nếu không gửi, backend giữ nguyên ảnh cũ)
      if (newImageUrl) {
          payload.imageUrl = newImageUrl;
      }

      await api.updateQuestion(id, payload);
      
      // 3. Cập nhật state local để UI thay đổi ngay lập tức
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload, imageUrl: newImageUrl || q.imageUrl } : q)));
      
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật câu hỏi');
    } finally {
      setIsUploading(false);
    }
  };

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
                    
                    {/* CỘT 1: NỘI DUNG */}
                    <td className="p-4 align-top">
                        {editingId === (q._id || q.id) ? (
                        <div className="space-y-3">
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
                                    <label className="block text-sm font-medium mb-1">Hình ảnh minh họa</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleEditFileSelect}
                                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Chọn ảnh mới để thay thế ảnh cũ.</p>
                                </div>
                            </div>

                            {/* --- EDIT: TEXT --- */}
                            <textarea
                                value={editForm.questionText}
                                onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                                className="w-full p-2 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                rows={3}
                                placeholder="Nội dung câu hỏi..."
                            />

                            {/* --- EDIT: OPTIONS (Chỉ cho MC) --- */}
                            {(!q.type || q.type === 'multiple_choice') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <label key={opt} className="text-sm block">
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
                            
                            {/* Note cho các loại câu hỏi khác */}
                            {(q.type === 'true_false' || q.type === 'short_answer') && (
                                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                    ⚠️ Hiện tại chỉ hỗ trợ sửa nội dung câu hỏi và ảnh tại đây. Để sửa chi tiết đáp án Đúng/Sai hoặc Tự luận, vui lòng xóa đi tạo lại.
                                </p>
                            )}
                        </div>
                        ) : (
                        <div>
                            {/* --- VIEW MODE --- */}
                            <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
                                Câu {index + 1} 
                                <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal uppercase">
                                    {q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Tự luận' : 'Trắc nghiệm'}
                                </span>
                            </div>
                            
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
                                <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 mb-2">{q.questionText}</div>
                            ) : !q.imageUrl && (
                                <div className="text-slate-400 italic mb-2">No content</div>
                            )}

                            {/* Options */}
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

                    {/* CỘT 2: ĐÁP ÁN ĐÚNG */}
                    <td className="p-4 align-top">
                        {editingId === (q._id || q.id) ? (
                            (!q.type || q.type === 'multiple_choice') ? (
                                <select value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} className="p-2 border rounded w-full bg-white dark:bg-slate-800">
                                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                </select>
                            ) : <div className="text-xs text-slate-500 italic">—</div>
                        ) : (
                            renderCorrectAnswer(q)
                        )}
                    </td>

                    {/* CỘT 3: HÀNH ĐỘNG */}
                    <td className="p-4 text-right align-top w-40">
                        {editingId === (q._id || q.id) ? (
                        <div className="flex justify-end gap-2 flex-col">
                            <Button size="sm" onClick={() => saveEdit(q._id || q.id)} disabled={isUploading}>
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