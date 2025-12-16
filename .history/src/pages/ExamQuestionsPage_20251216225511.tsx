import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper và component ảnh
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { Image as ImageIcon, Unlink, CheckSquare, Square, Trash2 } from 'lucide-react'; // Import icon CheckSquare, Square, Trash2

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
        // Lọc bỏ các câu hỏi null
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

  // --- LOGIC CHỌN CÂU HỎI (MỚI) ---
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

  // --- LOGIC GỠ HÀNG LOẠT (MỚI) ---
  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return alert("Vui lòng chọn ít nhất 1 câu hỏi!");
    
    // Cảnh báo rõ ràng
    if (!confirm(`Bạn có chắc muốn GỠ ${selectedIds.size} câu hỏi này khỏi đề thi? (Câu hỏi vẫn tồn tại trong Ngân hàng câu hỏi).`)) return;

    try {
        // Dùng Promise.all để gọi API gỡ từng câu (vì Backend chưa có API gỡ batch cho Exam)
        await Promise.all(Array.from(selectedIds).map(qId => api.removeQuestionFromExam(examId!, qId)));
        
        // Cập nhật giao diện
        setQuestions(prev => prev.filter(q => !selectedIds.has(q._id || q.id)));
        
        // Reset trạng thái
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        alert('Đã gỡ các câu hỏi khỏi đề thi.');
    } catch (err: any) {
        alert(err.message || 'Lỗi khi gỡ câu hỏi');
        // Load lại để đồng bộ
        window.location.reload();
    }
  };

  // --- CÁC HÀM CŨ GIỮ NGUYÊN ---
  const handleRemoveQuestion = async (id: string) => {
    if (!confirm('Bạn có chắc muốn GỠ câu hỏi này khỏi đề thi?')) return;
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
        trueFalseOptions: q.trueFalseOptions && q.trueFalseOptions.length > 0 ? q.trueFalseOptions : [{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }, { id: 'c', text: '', isCorrect: false }, { id: 'd', text: '', isCorrect: false }],
        shortAnswerCorrect: q.shortAnswerCorrect || ''
    });
    setEditImageFile(null);
    if (q.imageUrl) setEditImagePreview(getFullImageUrl(q.imageUrl) || null);
    else setEditImagePreview(null);
  };
  const cancelEdit = () => { setEditingId(null); setEditImageFile(null); setEditImagePreview(null); };
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setEditImageFile(e.target.files[0]); setEditImagePreview(URL.createObjectURL(e.target.files[0])); } };
  const saveEdit = async (id: string, type: string) => {
    try {
      setIsUploading(true);
      let newImageUrl = undefined;
      if (editImageFile) { const res = await api.uploadFile(editImageFile); newImageUrl = res.url; } 
      const payload: any = { questionText: editForm.questionText, explanation: editForm.explanation };
      if (!type || type === 'multiple_choice') { payload.options = editForm.options; payload.correctAnswer = editForm.correctAnswer; } 
      else if (type === 'true_false') { payload.trueFalseOptions = editForm.trueFalseOptions; } 
      else if (type === 'short_answer') { payload.shortAnswerCorrect = editForm.shortAnswerCorrect; }
      if (newImageUrl) payload.imageUrl = newImageUrl;
      await api.updateQuestion(id, payload);
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload, imageUrl: newImageUrl || q.imageUrl } : q)));
      cancelEdit();
    } catch (err: any) { alert(err.message); } finally { setIsUploading(false); }
  };
  const renderCorrectAnswer = (q: Question) => {
    if (!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600">{q.correctAnswer || '—'}</span>;
    if (q.type === 'true_false') return <div className="text-xs space-y-1">{q.trueFalseOptions?.map((opt:any) => <div key={opt.id}><span className="font-bold">{opt.id}:</span> <span className={opt.isCorrect?'text-green-600':'text-red-500'}>{opt.isCorrect?'Đúng':'Sai'}</span></div>)}</div>;
    if (q.type === 'short_answer') return <span className="font-bold text-green-700">{q.shortAnswerCorrect}</span>;
    return <span>—</span>;
  };

  return (
    <div className="container mx-auto py-8">
      
      {/* HEADER & TOOLBAR (CẬP NHẬT) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Chi tiết Đề thi: {examInfo?.title || '...'}</h1>
            <p className="text-sm text-slate-500">
                Thời gian: {examInfo?.duration} phút • Tổng số: {questions.length} câu
            </p>
        </div>
        
        <div className="flex gap-2">
            {!isSelectionMode ? (
                <>
                    <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
                    {/* Nút bật chế độ chọn */}
                    <Button 
                        variant="secondary" 
                        className="border-slate-300"
                        onClick={() => setIsSelectionMode(true)}
                    >
                        <CheckSquare className="w-4 h-4 mr-1"/> Chọn nhiều
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="secondary" onClick={toggleSelectAll}>
                        {selectedIds.size === questions.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                    </Button>

                    <span className="flex items-center px-3 font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">
                        Đã chọn: {selectedIds.size}
                    </span>

                    {/* NÚT GỠ HÀNG LOẠT (MỚI) */}
                    <Button 
                        variant="danger" 
                        onClick={handleBulkRemove}
                        className="flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" /> Gỡ ({selectedIds.size})
                    </Button>

                    <Button variant="secondary" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                        Hủy
                    </Button>
                </>
            )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    {/* CỘT CHECKBOX (MỚI) */}
                    <th className="p-4 w-10 text-center">
                        {isSelectionMode && (
                            <button onClick={toggleSelectAll}>
                                {selectedIds.size === questions.length && questions.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-400"/>}
                            </button>
                        )}
                    </th>
                    <th className="p-4 font-semibold w-1/2">Nội dung câu hỏi</th>
                    <th className="p-4 font-semibold w-1/4">Đáp án đúng</th>
                    <th className="p-4 font-semibold w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => {
                    const qId = q._id || q.id;
                    const isSelected = selectedIds.has(qId);
                    return (
                        <tr key={qId} className={`border-b dark:border-slate-700 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                            
                            {/* CHECKBOX CELL (MỚI) */}
                            <td className="p-4 text-center align-top pt-5">
                                {isSelectionMode && (
                                    <button onClick={() => toggleSelection(qId)}>
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-300"/>}
                                    </button>
                                )}
                            </td>

                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                    /* --- FORM SỬA (Giữ nguyên) --- */
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3"><input type="file" onChange={handleEditFileSelect} /></div>
                                        <textarea value={editForm.questionText} onChange={e=>setEditForm({...editForm, questionText: e.target.value})} className="w-full p-2 border rounded" rows={3}/>
                                        {(!q.type || q.type === 'multiple_choice') && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {['A','B','C','D'].map(opt => (
                                                    <input key={opt} value={editForm.options[opt]} onChange={e => setEditForm({...editForm, options: {...editForm.options, [opt]: e.target.value}})} className="p-1 border rounded text-sm" placeholder={opt} />
                                                ))}
                                            </div>
                                        )}
                                        {q.type === 'true_false' && <div className="space-y-2">{editForm.trueFalseOptions.map((opt:any,idx:number) => <div key={opt.id} className="flex gap-2"><span className="font-bold">{opt.id})</span><input value={opt.text} onChange={e=>{const n=[...editForm.trueFalseOptions];n[idx].text=e.target.value;setEditForm({...editForm,trueFalseOptions:n})}} className="flex-1 border p-1"/><select value={opt.isCorrect?'true':'false'} onChange={e=>{const n=[...editForm.trueFalseOptions];n[idx].isCorrect=e.target.value==='true';setEditForm({...editForm,trueFalseOptions:n})}} className="border p-1"><option value="true">Đúng</option><option value="false">Sai</option></select></div>)}</div>}
                                        {q.type === 'short_answer' && <input value={editForm.shortAnswerCorrect} onChange={e => setEditForm({...editForm, shortAnswerCorrect: e.target.value})} className="w-full p-2 border rounded font-bold" />}
                                        <div className="mt-2"><label className="text-xs font-bold text-slate-500">Giải thích:</label><textarea value={editForm.explanation} onChange={e=>setEditForm({...editForm, explanation: e.target.value})} className="w-full p-2 border rounded text-sm" rows={2}/></div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="font-semibold mb-2 text-indigo-600">Câu {index + 1} <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{q.type || 'MC'}</span></div>
                                        {q.imageUrl && <div className="mb-2"><NgrokImage src={getFullImageUrl(q.imageUrl)} className="max-h-24 rounded border" /></div>}
                                        <div className="whitespace-pre-wrap text-sm">{q.questionText}</div>
                                        {q.explanation && <div className="mt-2 text-xs bg-yellow-50 p-2 rounded text-yellow-800">💡 {q.explanation}</div>}
                                    </div>
                                )}
                            </td>

                            <td className="p-4 align-top">
                                {editingId === qId ? <span className="text-sm italic">Đang sửa...</span> : renderCorrectAnswer(q)}
                            </td>

                            <td className="p-4 text-right align-top w-40">
                                {editingId === qId ? (
                                <div className="flex justify-end gap-2 flex-col">
                                    <Button size="sm" onClick={() => saveEdit(qId, q.type)} disabled={isUploading}>Lưu</Button>
                                    <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={isUploading}>Hủy</Button>
                                </div>
                                ) : (
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                                    {/* Nút Gỡ đơn lẻ (Cũ) */}
                                    <Button 
                                        size="sm" 
                                        className="bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center w-8 h-8 p-0" 
                                        onClick={() => handleRemoveQuestion(qId)}
                                        title="Gỡ"
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