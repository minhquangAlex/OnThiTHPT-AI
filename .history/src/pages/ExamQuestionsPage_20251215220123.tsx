import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper và component ảnh
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { Image as ImageIcon } from 'lucide-react'; 

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
    explanation: '', // Đã có field này
    trueFalseOptions: [], 
    shortAnswerCorrect: '' 
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

  const handleDelete = async (id: string) => {
    if (!confirm('CẢNH BÁO: XÓA VĨNH VIỄN CÂU HỎI KHỎI DATABASE?')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || { A: '', B: '', C: '', D: '' }, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '', // Nạp lời giải cũ
        trueFalseOptions: q.trueFalseOptions && q.trueFalseOptions.length > 0 ? q.trueFalseOptions : [{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }, { id: 'c', text: '', isCorrect: false }, { id: 'd', text: '', isCorrect: false }],
        shortAnswerCorrect: q.shortAnswerCorrect || ''
    });
    setEditImageFile(null);
    setEditImagePreview(q.imageUrl ? getFullImageUrl(q.imageUrl) || null : null);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '', trueFalseOptions: [], shortAnswerCorrect: '' }); setEditImageFile(null); setEditImagePreview(null); };
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)); } };

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
    if (!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600 text-lg">{q.correctAnswer || '—'}</span>;
    if (q.type === 'true_false') return <div className="text-xs space-y-1 bg-slate-50 p-2 rounded">{q.trueFalseOptions?.map((opt:any)=><div key={opt.id} className="flex justify-between"><span className="font-bold">{opt.id}:</span> <span className={opt.isCorrect?'text-green-600':'text-red-500'}>{opt.isCorrect?'Đúng':'Sai'}</span></div>)}</div>;
    if (q.type === 'short_answer') return <span className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded">{q.shortAnswerCorrect}</span>;
    return <span>—</span>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Chi tiết Đề thi: {examInfo?.title || '...'}</h1>
            <p className="text-sm text-slate-500">Thời gian: {examInfo?.duration} phút • Tổng số: {questions.length} câu</p>
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
                                <div className="space-y-4">
                                    {/* ... Edit Ảnh, Text, Options (Giữ nguyên logic cũ) ... */}
                                    <div className="flex items-start gap-4 p-3 border rounded">
                                        {editImagePreview && <img src={editImagePreview} className="w-12 h-12 object-contain" />}
                                        <input type="file" accept="image/*" onChange={handleEditFileSelect} className="text-sm" />
                                    </div>
                                    <textarea value={editForm.questionText} onChange={e => setEditForm({...editForm, questionText: e.target.value})} className="w-full p-2 border rounded" rows={2} />
                                    
                                    {(!q.type || q.type === 'multiple_choice') && <div className="grid grid-cols-2 gap-2">{['A','B','C','D'].map(opt => <input key={opt} value={editForm.options[opt]} onChange={e => setEditForm({...editForm, options: {...editForm.options, [opt]: e.target.value}})} className="p-1 border rounded" />)}</div>}
                                    {q.type === 'true_false' && <div className="space-y-2 border p-2 rounded">{editForm.trueFalseOptions.map((opt:any,idx:number)=><div key={opt.id} className="flex gap-2"><span className="font-bold">{opt.id})</span><input className="flex-1 p-1 border rounded" value={opt.text} onChange={e=>{const n=[...editForm.trueFalseOptions];n[idx].text=e.target.value;setEditForm({...editForm,trueFalseOptions:n})}}/><select className="p-1 border rounded" value={opt.isCorrect} onChange={e=>{const n=[...editForm.trueFalseOptions];n[idx].isCorrect=e.target.value==='true';setEditForm({...editForm,trueFalseOptions:n})}}><option value="true">Đúng</option><option value="false">Sai</option></select></div>)}</div>}
                                    {q.type === 'short_answer' && <input value={editForm.shortAnswerCorrect} onChange={e=>setEditForm({...editForm, shortAnswerCorrect: e.target.value})} className="p-2 border rounded w-full font-bold" />}
                                    
                                    {/* --- MỚI: EDIT EXPLANATION --- */}
                                    <div className="mt-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Giải thích chi tiết:</label>
                                        <textarea value={editForm.explanation} onChange={e => setEditForm({...editForm, explanation: e.target.value})} className="w-full p-2 border rounded bg-yellow-50 text-sm" rows={2} placeholder="Nhập lời giải..." />
                                    </div>
                                </div>
                                ) : (
                                <div>
                                    <div className="font-semibold mb-2 text-indigo-600">Câu {index + 1} <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600 uppercase">{q.type || 'MC'}</span></div>
                                    {q.imageUrl && <div className="mb-2"><NgrokImage src={getFullImageUrl(q.imageUrl)} className="max-h-24 rounded border" /></div>}
                                    <div className="whitespace-pre-wrap text-sm">{q.questionText || <i className="text-slate-400">No text</i>}</div>
                                    
                                    {(!q.type || q.type === 'multiple_choice') && q.options && <ul className="list-none p-0 m-0 text-sm text-slate-600 space-y-1">{['A','B','C','D'].map(k => <li key={k} className={q.correctAnswer===k?'text-green-600 font-bold':''}>{k}. {q.options[k]}</li>)}</ul>}
                                    {q.type === 'true_false' && <div className="mt-2 space-y-1 text-sm bg-slate-50 p-2 rounded">{q.trueFalseOptions?.map((o:any)=><div key={o.id}><span className="font-bold">{o.id})</span> {o.text}</div>)}</div>}

                                    {/* --- MỚI: VIEW EXPLANATION --- */}
                                    {q.explanation && (
                                        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 text-xs text-slate-600 dark:text-slate-400 rounded">
                                            <span className="font-bold text-yellow-700">💡 Giải thích:</span> {q.explanation}
                                        </div>
                                    )}
                                </div>
                                )}
                            </td>
                            <td className="p-4 align-top">
                                {editingId === qId && (!q.type || q.type === 'multiple_choice') ? (
                                    <select value={editForm.correctAnswer} onChange={e => setEditForm({...editForm, correctAnswer: e.target.value})} className="p-2 border rounded w-full"><option>A</option><option>B</option><option>C</option><option>D</option></select>
                                ) : renderCorrectAnswer(q)}
                            </td>
                            <td className="p-4 text-right align-top w-32">
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
    </div>
  );
};

export default ExamQuestionsPage;