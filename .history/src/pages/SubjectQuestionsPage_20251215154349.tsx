import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { FilePlus, Image as ImageIcon, CheckSquare, Square, X } from 'lucide-react';

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State Form Sửa
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE MỚI CHO TẠO ĐỀ THI ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // --- LOGIC CHỌN CÂU HỎI ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(questions.map(q => q._id || q.id)));
    }
  };

  // --- LOGIC TẠO ĐỀ ---
  const handleCreateExamProcess = async (mode: 'random' | 'manual', title: string, duration: number) => {
    try {
        const payload: any = {
            subjectId: subjectId!,
            title: title,
            duration: duration
        };

        if (mode === 'manual') {
            if (selectedIds.size === 0) return alert('Vui lòng chọn ít nhất 1 câu hỏi!');
            payload.questions = Array.from(selectedIds);
        }

        await api.createFixedExam(payload);
        alert('Đã tạo đề thi thành công! Học sinh có thể thấy đề này ở mục "Bộ đề tuyển chọn".');
        setShowCreateModal(false);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    } catch (err: any) {
        alert(err.message || 'Lỗi khi tạo đề thi.');
    }
  };

  // --- CÁC HÀM CŨ (DELETE, EDIT) ---
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
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || { A: '', B: '', C: '', D: '' }, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '',
        trueFalseOptions: q.trueFalseOptions || [],
        shortAnswerCorrect: q.shortAnswerCorrect || ''
    });
    setEditImageFile(null);
    setEditImagePreview(q.imageUrl ? getFullImageUrl(q.imageUrl) || null : null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
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
      alert(err.message || 'Lỗi khi cập nhật');
    } finally {
      setIsUploading(false);
    }
  };

  const renderCorrectAnswer = (q: Question) => {
    if (!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600 text-lg">{q.correctAnswer || '—'}</span>;
    if (q.type === 'true_false') return <div className="text-xs space-y-1">{q.trueFalseOptions?.map((opt:any) => <div key={opt.id}><span className="font-bold uppercase">{opt.id}:</span> <span className={opt.isCorrect?'text-green-600':'text-red-500'}>{opt.isCorrect?'Đúng':'Sai'}</span></div>)}</div>;
    if (q.type === 'short_answer') return <span className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded">{q.shortAnswerCorrect}</span>;
    return <span>—</span>;
  };

  return (
    <div className="container mx-auto py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Quản lý câu hỏi: {subjectNameFromState || subjectId}</h1>
            <p className="text-sm text-slate-500">Tổng số: {questions.length} câu</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {!isSelectionMode ? (
                <>
                    <Button variant="secondary" onClick={() => navigate('/admin')}>Quay lại</Button>
                    <Button onClick={() => navigate('/admin/questions/new', { state: { subjectId } })}>Thêm câu hỏi</Button>
                    <Button 
                        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2" 
                        onClick={() => setShowCreateModal(true)} 
                    >
                        <FilePlus className="w-4 h-4" /> Đóng gói đề thi
                    </Button>
                </>
            ) : (
                <>
                    <span className="flex items-center px-3 font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">
                        Đã chọn: {selectedIds.size}
                    </span>
                    <Button 
                        className="bg-green-600 hover:bg-green-700" 
                        onClick={() => setShowCreateModal(true)} 
                    >
                        Tạo đề từ {selectedIds.size} câu
                    </Button>
                    <Button variant="danger" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                        Hủy chọn
                    </Button>
                </>
            )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-8 text-center">Đang tải...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <th className="p-4 w-10 text-center">
                        {isSelectionMode && (
                            <button onClick={toggleSelectAll}>
                                {selectedIds.size === questions.length && questions.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-400"/>}
                            </button>
                        )}
                    </th>
                    <th className="p-4 font-semibold w-1/2">Nội dung</th>
                    <th className="p-4 font-semibold w-1/4">Đáp án</th>
                    <th className="p-4 font-semibold w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => {
                    const qId = q._id || q.id;
                    const isSelected = selectedIds.has(qId);
                    return (
                        <tr key={qId} className={`border-b dark:border-slate-700 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                            
                            {/* Checkbox */}
                            <td className="p-4 text-center align-top pt-5">
                                {isSelectionMode && (
                                    <button onClick={() => toggleSelection(qId)}>
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-300"/>}
                                    </button>
                                )}
                            </td>

                            {/* Nội dung & Edit Form */}
                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                    <div className="space-y-3">
                                        {/* Giao diện sửa (Ảnh, Text) */}
                                        <div className="flex items-center gap-3 p-2 border rounded">
                                            {editImagePreview && <img src={editImagePreview} className="w-12 h-12 object-contain" />}
                                            <input type="file" accept="image/*" onChange={handleEditFileSelect} className="text-sm" />
                                        </div>
                                        <textarea 
                                            value={editForm.questionText} 
                                            onChange={e => setEditForm({...editForm, questionText: e.target.value})}
                                            className="w-full p-2 border rounded" rows={2} 
                                        />
                                        {/* ... (Phần render input sửa chi tiết giữ nguyên logic bài trước) ... */}
                                        {(!q.type || q.type === 'multiple_choice') && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {['A','B','C','D'].map(opt => (
                                                    <input key={opt} value={editForm.options[opt]} onChange={e => setEditForm({...editForm, options: {...editForm.options, [opt]: e.target.value}})} className="p-1 border rounded text-sm" placeholder={opt} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="font-semibold mb-2 text-indigo-600 text-sm">
                                            Câu {index + 1} <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{q.type || 'MC'}</span>
                                        </div>
                                        {q.imageUrl && <NgrokImage src={getFullImageUrl(q.imageUrl)} className="max-h-24 mb-2 rounded border" />}
                                        <div className="whitespace-pre-wrap text-sm">{q.questionText}</div>
                                    </div>
                                )}
                            </td>

                            {/* Đáp án */}
                            <td className="p-4 align-top">{renderCorrectAnswer(q)}</td>

                            {/* Hành động */}
                            <td className="p-4 text-right align-top">
                                {editingId === qId ? (
                                    <div className="flex flex-col gap-2 items-end">
                                        <Button size="sm" onClick={() => saveEdit(qId, q.type)} disabled={isUploading}>Lưu</Button>
                                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Hủy</Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(qId)}>Xóa</Button>
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

      {/* --- MODAL TẠO ĐỀ THI --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Đóng gói đề thi</h3>
                    <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                
                {!isSelectionMode ? (
                    // Lựa chọn chế độ
                    <div className="space-y-3">
                        <p className="text-slate-600 mb-4">Chọn phương thức tạo đề:</p>
                        <button 
                            className="w-full p-4 border-2 border-indigo-100 hover:border-indigo-500 rounded-lg flex items-center gap-3 transition-all bg-indigo-50/50"
                            onClick={() => {
                                const title = prompt("Nhập tên đề thi ngẫu nhiên:");
                                if(title) handleCreateExamProcess('random', title, 45);
                            }}
                        >
                            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600"><FilePlus className="w-5 h-5" /></div>
                            <div className="text-left">
                                <div className="font-bold text-slate-800">Tạo Ngẫu Nhiên</div>
                                <div className="text-xs text-slate-500">Hệ thống tự chọn câu hỏi theo ma trận</div>
                            </div>
                        </button>

                        <button 
                            className="w-full p-4 border-2 border-green-100 hover:border-green-500 rounded-lg flex items-center gap-3 transition-all bg-green-50/50"
                            onClick={() => {
                                setShowCreateModal(false);
                                setIsSelectionMode(true); // Chuyển sang chế độ chọn
                            }}
                        >
                            <div className="p-2 bg-green-100 rounded-full text-green-600"><CheckSquare className="w-5 h-5" /></div>
                            <div className="text-left">
                                <div className="font-bold text-slate-800">Chọn Thủ Công</div>
                                <div className="text-xs text-slate-500">Tự tích chọn từng câu hỏi vào đề</div>
                            </div>
                        </button>
                    </div>
                ) : (
                    // Nhập thông tin đề thủ công
                    <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm font-medium text-center">
                            Đang đóng gói <b>{selectedIds.size}</b> câu hỏi đã chọn.
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên đề thi</label>
                            <input id="exam-title" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500" placeholder="VD: Kiểm tra 15 phút..." autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Thời gian làm bài (phút)</label>
                            <input id="exam-duration" type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500" defaultValue={45} />
                        </div>
                        <Button 
                            className="w-full mt-2 py-2" 
                            onClick={() => {
                                const title = (document.getElementById('exam-title') as HTMLInputElement).value;
                                const duration = Number((document.getElementById('exam-duration') as HTMLInputElement).value);
                                if(!title) return alert('Vui lòng nhập tên đề');
                                handleCreateExamProcess('manual', title, duration);
                            }}
                        >
                            Hoàn tất tạo đề
                        </Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default SubjectQuestionsPage;