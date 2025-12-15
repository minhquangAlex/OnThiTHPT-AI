import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { FilePlus, Image as ImageIcon, CheckSquare, Square, X, Wand2, Upload } from 'lucide-react';

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State form sửa đầy đủ
  const [editForm, setEditForm] = useState<any>({ 
    questionText: '', 
    options: { A: '', B: '', C: '', D: '' }, 
    correctAnswer: 'A', 
    explanation: '', 
    trueFalseOptions: [], 
    shortAnswerCorrect: '' 
  });
  
  // State xử lý ảnh khi sửa
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State tạo đề thi
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examConfig, setExamConfig] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const qs = await api.getQuestions(subjectId);
        setQuestions(qs);
        try {
            const res = await api.getExamsBySubject(subjectId);
            setExamConfig(res.config);
        } catch (e) { console.warn('No exam config'); }
      } catch (err) {
        console.error(err);
        alert('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  // --- LOGIC CHỌN CÂU HỎI ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(questions.map(q => q._id || q.id)));
  };

  const handleQuickSelect = (type: string, count: number) => {
      const candidates = questions.filter(q => (q.type || 'multiple_choice') === type);
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      const newSet = new Set(selectedIds);
      candidates.forEach(q => newSet.delete(q._id || q.id));
      selected.forEach(q => newSet.add(q._id || q.id));
      setSelectedIds(newSet);
  };

  const handleCreateExamProcess = async (mode: 'random' | 'manual', title: string, duration: number) => {
    try {
        const payload: any = { subjectId: subjectId!, title: title, duration: duration };
        if (mode === 'manual') {
            if (selectedIds.size === 0) return alert('Vui lòng chọn ít nhất 1 câu hỏi!');
            payload.questions = Array.from(selectedIds);
        }
        await api.createFixedExam(payload);
        alert('Đã tạo đề thi thành công!');
        setShowCreateModal(false);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    } catch (err: any) {
        alert(err.message || 'Lỗi khi tạo đề thi.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try { await api.deleteQuestion(id); setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id)); } catch (err: any) { alert(err.message); }
  };

  // --- LOGIC SỬA CÂU HỎI ---
  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    setEditForm({ 
        questionText: q.questionText || '', 
        options: q.options || { A: '', B: '', C: '', D: '' }, 
        correctAnswer: q.correctAnswer || 'A', 
        explanation: q.explanation || '',
        trueFalseOptions: q.trueFalseOptions && q.trueFalseOptions.length > 0 ? q.trueFalseOptions : [
            { id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }, 
            { id: 'c', text: '', isCorrect: false }, { id: 'd', text: '', isCorrect: false }
        ],
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
        if (file.size > 5 * 1024 * 1024) return alert('Ảnh quá lớn (>5MB)');
        setEditImageFile(file);
        setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const saveEdit = async (id: string, type: string) => {
    try {
      setIsUploading(true);
      let newImageUrl = undefined;

      // 1. Upload ảnh nếu có
      if (editImageFile) {
          const res = await api.uploadFile(editImageFile);
          newImageUrl = res.url;
      } 

      // 2. Tạo payload
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

      if (newImageUrl !== undefined) payload.imageUrl = newImageUrl;

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
    if (!q.type || q.type === 'multiple_choice') return <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{q.correctAnswer || '—'}</span>;
    if (q.type === 'true_false') return <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800 p-2 rounded border dark:border-slate-700 min-w-[120px]">{q.trueFalseOptions?.map((opt: any) => <div key={opt.id} className="flex justify-between"><span className="font-bold uppercase">{opt.id}:</span> <span className={opt.isCorrect?'text-green-600':'text-red-500'}>{opt.isCorrect?'Đúng':'Sai'}</span></div>)}</div>;
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
        
        <div className="flex flex-wrap gap-2 items-center">
            {!isSelectionMode ? (
                <>
                    <Button variant="secondary" onClick={() => navigate('/admin')}>Quay lại</Button>
                    <Button onClick={() => navigate('/admin/questions/new', { state: { subjectId } })}>Thêm câu hỏi</Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
                        <FilePlus className="w-4 h-4" /> Đóng gói đề thi
                    </Button>
                </>
            ) : (
                <>
                    {examConfig && (
                        <div className="flex gap-2 items-center mr-3 bg-white dark:bg-slate-800 p-1.5 rounded-lg border shadow-sm">
                            <span className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1"><Wand2 className="w-3 h-3"/> Auto:</span>
                            <button onClick={() => handleQuickSelect('multiple_choice', examConfig.structure?.multiple_choice || 0)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">+{examConfig.structure?.multiple_choice} P.I</button>
                            <button onClick={() => handleQuickSelect('true_false', examConfig.structure?.true_false || 0)} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200">+{examConfig.structure?.true_false} P.II</button>
                            <button onClick={() => handleQuickSelect('short_answer', examConfig.structure?.short_answer || 0)} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-200">+{examConfig.structure?.short_answer} P.III</button>
                        </div>
                    )}
                    <span className="flex items-center px-3 font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">Đã chọn: {selectedIds.size}</span>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateModal(true)}>Tạo đề</Button>
                    <Button variant="danger" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>Hủy</Button>
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
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/2">Nội dung câu hỏi</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4">Đáp án đúng</th>
                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-right">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((q, index) => {
                    const qId = q._id || q.id;
                    const isSelected = selectedIds.has(qId);
                    return (
                        <tr key={qId} className={`border-b dark:border-slate-700 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                            <td className="p-4 text-center align-top pt-5">
                                {isSelectionMode && (
                                    <button onClick={() => toggleSelection(qId)}>
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-300"/>}
                                    </button>
                                )}
                            </td>
                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                    <div className="space-y-4">
                                        {/* EDIT IMAGE */}
                                        <div className="flex items-start gap-4 p-3 border rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                            <div className="shrink-0 w-20 h-20 bg-white border rounded flex items-center justify-center overflow-hidden">
                                                {editImagePreview ? <img src={editImagePreview} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300 w-8 h-8" />}
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium mb-1 cursor-pointer text-indigo-600 hover:underline">
                                                    Chọn ảnh mới <input type="file" accept="image/*" onChange={handleEditFileSelect} className="hidden" />
                                                </label>
                                                <p className="text-xs text-slate-400">Thay thế ảnh cũ (nếu có)</p>
                                            </div>
                                        </div>

                                        {/* EDIT TEXT */}
                                        <textarea value={editForm.questionText} onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" rows={3} />

                                        {/* EDIT DETAILS */}
                                        {(!q.type || q.type === 'multiple_choice') && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {['A','B','C','D'].map(opt => (
                                                    <input key={opt} value={editForm.options[opt]} onChange={e => setEditForm({...editForm, options: {...editForm.options, [opt]: e.target.value}})} className="p-2 border rounded text-sm" placeholder={opt} />
                                                ))}
                                                <select value={editForm.correctAnswer} onChange={e => setEditForm({...editForm, correctAnswer: e.target.value})} className="p-2 border rounded col-span-2 bg-indigo-50"><option>A</option><option>B</option><option>C</option><option>D</option></select>
                                            </div>
                                        )}
                                        {q.type === 'true_false' && (
                                            <div className="space-y-2 border p-3 rounded bg-slate-50">
                                                {editForm.trueFalseOptions.map((opt:any, idx:number) => (
                                                    <div key={opt.id} className="flex gap-2">
                                                        <span className="font-bold w-6 uppercase">{opt.id})</span>
                                                        <input className="flex-1 p-1 border rounded text-sm" value={opt.text} onChange={e=>{const n=[...editForm.trueFalseOptions]; n[idx].text=e.target.value; setEditForm({...editForm, trueFalseOptions:n})}} />
                                                        <select className="p-1 border rounded text-sm w-20" value={opt.isCorrect?'true':'false'} onChange={e=>{const n=[...editForm.trueFalseOptions]; n[idx].isCorrect=(e.target.value==='true'); setEditForm({...editForm, trueFalseOptions:n})}}><option value="true">Đúng</option><option value="false">Sai</option></select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === 'short_answer' && (
                                            <input value={editForm.shortAnswerCorrect} onChange={e=>setEditForm({...editForm, shortAnswerCorrect: e.target.value})} className="w-full p-2 border border-green-500 rounded font-bold" placeholder="Đáp án số" />
                                        )}

                                        {/* EDIT EXPLANATION */}
                                        <textarea value={editForm.explanation} onChange={e=>setEditForm({...editForm, explanation: e.target.value})} className="w-full p-2 border rounded bg-yellow-50 text-sm" rows={2} placeholder="Giải thích chi tiết..." />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Câu {index + 1} <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-600">{q.type || 'MC'}</span></div>
                                        {q.imageUrl && <div className="mb-2"><NgrokImage src={getFullImageUrl(q.imageUrl)} className="max-h-24 rounded border" /></div>}
                                        <div className="whitespace-pre-wrap text-sm mb-2">{q.questionText || <i className="text-slate-400">No text</i>}</div>
                                        
                                        {q.explanation && <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-xs text-slate-600 mt-2">💡 {q.explanation}</div>}
                                    </div>
                                )}
                            </td>

                            <td className="p-4 align-top">{renderCorrectAnswer(q)}</td>

                            <td className="p-4 text-right align-top">
                                {editingId === qId ? (
                                    <div className="flex flex-col gap-2 items-end">
                                        <Button size="sm" onClick={() => saveEdit(qId, q.type)} disabled={isUploading}>{isUploading ? 'Lưu...' : 'Lưu'}</Button>
                                        <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={isUploading}>Hủy</Button>
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

      {/* MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Đóng gói đề thi</h3>
                    <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                {!isSelectionMode ? (
                    <div className="space-y-3">
                        <button className="w-full p-4 border-2 border-indigo-100 hover:border-indigo-500 rounded-lg flex items-center gap-3 bg-indigo-50/50" onClick={() => { const t = prompt("Nhập tên đề thi:"); if(t) handleCreateExamProcess('random', t, examConfig?.duration || 45); }}>
                            <FilePlus className="w-5 h-5 text-indigo-600" /><div className="text-left font-bold">Tạo Ngẫu Nhiên</div>
                        </button>
                        <button className="w-full p-4 border-2 border-green-100 hover:border-green-500 rounded-lg flex items-center gap-3 bg-green-50/50" onClick={() => { setShowCreateModal(false); setIsSelectionMode(true); }}>
                            <CheckSquare className="w-5 h-5 text-green-600" /><div className="text-left font-bold">Chọn Thủ Công</div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-center text-sm font-medium text-green-600">Đang chọn {selectedIds.size} câu.</p>
                        <input id="exam-title" className="w-full p-2 border rounded" placeholder="Tên đề thi" autoFocus />
                        <input id="exam-duration" type="number" className="w-full p-2 border rounded" defaultValue={45} placeholder="Thời gian (phút)" />
                        <Button className="w-full mt-2" onClick={() => {
                             const title = (document.getElementById('exam-title') as HTMLInputElement).value;
                             const dur = Number((document.getElementById('exam-duration') as HTMLInputElement).value);
                             if(!title) return alert('Nhập tên');
                             handleCreateExamProcess('manual', title, dur);
                        }}>Hoàn tất</Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default SubjectQuestionsPage;