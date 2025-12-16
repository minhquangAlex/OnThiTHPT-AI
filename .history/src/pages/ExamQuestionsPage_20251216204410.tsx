import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { Image as ImageIcon, CheckSquare, Square, Trash2 } from 'lucide-react'; // Thêm icon

const ExamQuestionsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '', trueFalseOptions: [], shortAnswerCorrect: '' });
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

  // --- LOGIC CHỌN ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(questions.map(q => q._id || q.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn ${selectedIds.size} câu hỏi này khỏi ngân hàng câu hỏi?`)) return;
    
    try {
        await api.deleteQuestionsBulk(Array.from(selectedIds));
        setQuestions(prev => prev.filter(q => !selectedIds.has(q._id || q.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        alert('Đã xóa thành công!');
    } catch (err: any) {
        alert(err.message);
    }
  };

  // ... (Các hàm handleDelete lẻ, startEdit, cancelEdit, saveEdit, handleEditFileSelect cũ giữ nguyên)
  const handleDelete = async (id: string) => { if (!confirm('Xóa vĩnh viễn câu hỏi này?')) return; try { await api.deleteQuestion(id); setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id)); } catch (err: any) { alert(err.message); } };
  const startEdit = (q: any) => { /* Code cũ */ setEditingId(q._id||q.id); setEditForm({...q, options: q.options||{}}); setEditImageFile(null); setEditImagePreview(q.imageUrl?getFullImageUrl(q.imageUrl)!:null); };
  const cancelEdit = () => { setEditingId(null); };
  const handleEditFileSelect = (e: any) => { /* Code cũ */ };
  const saveEdit = async (id: string, type: string) => { /* Code cũ */ };
  
  // Render Helper
  const renderCorrectAnswer = (q: Question) => { /* Code cũ */ 
    if(!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600">{q.correctAnswer}</span>;
    return <span>—</span>; // Rút gọn
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Chi tiết Đề thi: {examInfo?.title}</h1>
            <p className="text-sm text-slate-500">Tổng số: {questions.length} câu</p>
        </div>
        
        {/* --- TOOLBAR --- */}
        <div className="flex gap-2">
            {!isSelectionMode ? (
                <>
                    <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
                    <Button onClick={() => setIsSelectionMode(true)}>Chọn nhiều</Button>
                </>
            ) : (
                <>
                    <span className="flex items-center px-3 font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">
                        Đã chọn: {selectedIds.size}
                    </span>
                    <Button variant="danger" onClick={handleBulkDelete}>
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa ({selectedIds.size})
                    </Button>
                    <Button variant="secondary" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                        Hủy
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
                    {/* Checkbox Header */}
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
                            
                            {/* Checkbox Row */}
                            <td className="p-4 text-center align-top pt-5">
                                {isSelectionMode && (
                                    <button onClick={() => toggleSelection(qId)}>
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-300"/>}
                                    </button>
                                )}
                            </td>

                            {/* Các cột khác giữ nguyên */}
                            <td className="p-4 align-top">
                                {/* ... Hiển thị nội dung (copy code cũ vào đây) ... */}
                                <div className="font-semibold text-indigo-600">Câu {index + 1}</div>
                                {q.questionText}
                            </td>
                            <td className="p-4 align-top">{renderCorrectAnswer(q)}</td>
                            <td className="p-4 text-right align-top">
                                {/* Nút sửa xóa lẻ */}
                                <Button size="sm" variant="danger" onClick={() => handleDelete(qId)}>Xóa</Button>
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