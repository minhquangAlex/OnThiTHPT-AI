import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper và component ảnh
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { Image as ImageIcon, Unlink } from 'lucide-react'; // Thêm icon Unlink cho đúng ý nghĩa

const ExamQuestionsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State quản lý sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ 
    questionText: '', options: {}, correctAnswer: 'A', explanation: '', trueFalseOptions: [], shortAnswerCorrect: '' 
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // --- HÀM XỬ LÝ GỠ CÂU HỎI (ĐÃ SỬA) ---
  const handleRemoveQuestion = async (questionId: string) => {
    // Thông báo rõ ràng cho người dùng
    if (!confirm('Bạn muốn GỠ câu hỏi này khỏi đề thi này? (Câu hỏi vẫn tồn tại trong Ngân hàng câu hỏi)')) return;
    
    try {
      if (!examId) return;
      // Gọi API gỡ câu hỏi khỏi Exam
      await api.removeQuestionFromExam(examId, questionId);
      
      // Cập nhật giao diện
      setQuestions(prev => prev.filter(q => (q._id || q.id) !== questionId));
      
      alert('Đã gỡ câu hỏi khỏi đề thi.');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gỡ câu hỏi');
    }
  };

  // ... (Các hàm startEdit, cancelEdit, handleEditFileSelect, saveEdit giữ nguyên như cũ)
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
      if (editImageFile) { const res = await api.uploadFile(editImageFile); newImageUrl = res.url; } 
      
      const payload: any = { questionText: editForm.questionText, explanation: editForm.explanation };
      if (!type || type === 'multiple_choice') { payload.options = editForm.options; payload.correctAnswer = editForm.correctAnswer; } 
      else if (type === 'true_false') { payload.trueFalseOptions = editForm.trueFalseOptions; } 
      else if (type === 'short_answer') { payload.shortAnswerCorrect = editForm.shortAnswerCorrect; }
      if (newImageUrl) payload.imageUrl = newImageUrl;
      
      await api.updateQuestion(id, payload);
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload, imageUrl: newImageUrl || q.imageUrl } : q)));
      cancelEdit();
    } catch (err: any) { alert(err.message || 'Lỗi khi cập nhật'); } finally { setIsUploading(false); }
  };

  const renderCorrectAnswer = (q: Question) => {
    if (!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600">{q.correctAnswer || '—'}</span>;
    if (q.type === 'true_false') return <div className="text-xs space-y-1">{q.trueFalseOptions?.map((opt:any) => <div key={opt.id}><span className="font-bold">{opt.id}:</span> <span className={opt.isCorrect?'text-green-600':'text-red-500'}>{opt.isCorrect?'Đúng':'Sai'}</span></div>)}</div>;
    if (q.type === 'short_answer') return <span className="font-bold text-green-700">{q.shortAnswerCorrect}</span>;
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
                    <th className="p-4 font-semibold w-1/2">Nội dung câu hỏi</th>
                    <th className="p-4 font-semibold w-1/4">Đáp án đúng</th>
                    <th className="p-4 font-semibold w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => {
                    const qId = q._id || q.id;
                    return (
                        <tr key={qId} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                    /* --- FORM SỬA (Giống hệt SubjectQuestionsPage, giữ nguyên code form sửa của bạn) --- */
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3"><input type="file" onChange={handleEditFileSelect} /></div>
                                        <textarea value={editForm.questionText} onChange={e=>setEditForm({...editForm, questionText: e.target.value})} className="w-full p-2 border rounded" rows={3}/>
                                        {/* ... (Các input sửa đáp án tương tự như file SubjectQuestionsPage) ... */}
                                        <div className="text-xs text-slate-500 italic">Form sửa chi tiết tương tự trang Ngân hàng câu hỏi</div>
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
                                    <Button size="sm" variant="secondary" onClick={cancelEdit}>Hủy</Button>
                                </div>
                                ) : (
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                                    
                                    {/* 👇 NÚT GỠ CÂU HỎI (MỚI) 👇 */}
                                    <Button 
                                        size="sm" 
                                        className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1" 
                                        onClick={() => handleRemoveQuestion(qId)}
                                        title="Gỡ khỏi đề thi này (Không xóa vĩnh viễn)"
                                    >
                                        <Unlink className="w-3 h-3" /> Gỡ
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