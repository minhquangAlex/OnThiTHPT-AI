import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper và component ảnh
import { getFullImageUrl } from '../utils/imageHelper';
import NgrokImage from '../components/NgrokImage';
import { Question } from '../types';
import { FilePlus, Image as ImageIcon, CheckSquare, Square, X, Wand2, Info } from 'lucide-react'; // Thêm Wand2, Info

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State form sửa
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '', trueFalseOptions: [], shortAnswerCorrect: '' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE MỚI CHO TẠO ĐỀ THI ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // --- NEW: State lưu cấu hình đề thi ---
  const [examConfig, setExamConfig] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        // 1. Load câu hỏi
        const qs = await api.getQuestions(subjectId);
        setQuestions(qs);

        // 2. Load cấu hình đề thi (để biết số lượng cần chọn)
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

  // --- LOGIC CHỌN CÂU HỎI (CŨ) ---
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

  // --- NEW: LOGIC CHỌN NHANH THÔNG MINH ---
  const handleQuickSelect = (type: string, count: number) => {
      // 1. Lọc ra các câu hỏi thuộc loại này
      // (Nếu type='multiple_choice', lấy cả những câu không có type vì mặc định là MC)
      const candidates = questions.filter(q => {
          const qType = q.type || 'multiple_choice';
          return qType === type;
      });

      // 2. Xáo trộn ngẫu nhiên
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      
      // 3. Lấy N câu đầu tiên
      const selected = shuffled.slice(0, count);
      
      // 4. Cập nhật vào Set (giữ nguyên các câu đã chọn trước đó của loại khác)
      const newSet = new Set(selectedIds);
      
      // Xóa các câu cùng loại cũ đi trước khi thêm mới (để tránh bị cộng dồn quá số lượng)
      // (Hoặc giữ nguyên tùy logic, ở đây mình chọn cách: Reset loại này -> Chọn lại mới)
      candidates.forEach(q => newSet.delete(q._id || q.id));
      
      // Thêm câu mới chọn
      selected.forEach(q => newSet.add(q._id || q.id));
      
      setSelectedIds(newSet);
  };

  // --- LOGIC TẠO ĐỀ (CẬP NHẬT) ---
  const handleCreateExamProcess = async (mode: 'random' | 'manual', title: string, duration: number) => {
    try {
        const payload: any = {
            subjectId: subjectId!,
            title: title,
            duration: duration
        };

        if (mode === 'manual') {
            if (selectedIds.size === 0) return alert('Vui lòng chọn ít nhất 1 câu hỏi!');
            
            // --- NEW: VALIDATION CẤU TRÚC ĐỀ ---
            if (examConfig) {
                const selectedList = questions.filter(q => selectedIds.has(q._id || q.id));
                const countMC = selectedList.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length;
                const countTF = selectedList.filter(q => q.type === 'true_false').length;
                const countSA = selectedList.filter(q => q.type === 'short_answer').length;

                const reqMC = examConfig.structure?.multiple_choice || 0;
                const reqTF = examConfig.structure?.true_false || 0;
                const reqSA = examConfig.structure?.short_answer || 0;

                let warningMsg = '';
                if (countMC !== reqMC) warningMsg += `- Trắc nghiệm: ${countMC}/${reqMC}\n`;
                if (countTF !== reqTF) warningMsg += `- Đúng/Sai: ${countTF}/${reqTF}\n`;
                if (countSA !== reqSA) warningMsg += `- Tự luận: ${countSA}/${reqSA}\n`;

                if (warningMsg) {
                    if (!confirm(`Cảnh báo: Cấu trúc đề chưa chuẩn!\n\n${warningMsg}\nBạn có chắc muốn tạo đề này không?`)) {
                        return;
                    }
                }
            }
            // -------------------------------------

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

  // ... (Giữ nguyên các hàm handleDelete, startEdit, cancelEdit, saveEdit, handleEditFileSelect cũ)
  const handleDelete = async (id: string) => { if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return; try { await api.deleteQuestion(id); setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id)); } catch (err: any) { alert(err.message || 'Lỗi khi xóa câu hỏi'); } };
  const startEdit = (q: any) => { setEditingId(q._id || q.id); setEditForm({ questionText: q.questionText || '', options: q.options || { A: '', B: '', C: '', D: '' }, correctAnswer: q.correctAnswer || 'A', explanation: q.explanation || '', trueFalseOptions: q.trueFalseOptions || [], shortAnswerCorrect: q.shortAnswerCorrect || '' }); setEditImageFile(null); if (q.imageUrl) { setEditImagePreview(getFullImageUrl(q.imageUrl) || null); } else { setEditImagePreview(null); } };
  const cancelEdit = () => { setEditingId(null); setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '', trueFalseOptions: [], shortAnswerCorrect: '' }); setEditImageFile(null); setEditImagePreview(null); };
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; if (file.size > 5 * 1024 * 1024) return alert('Ảnh quá lớn (>5MB)'); setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)); } };
  const saveEdit = async (id: string, type: string) => { try { setIsUploading(true); let newImageUrl = undefined; if (editImageFile) { const res = await api.uploadFile(editImageFile); newImageUrl = res.url; } const payload: any = { questionText: editForm.questionText, explanation: editForm.explanation, }; if (!type || type === 'multiple_choice') { payload.options = editForm.options; payload.correctAnswer = editForm.correctAnswer; } else if (type === 'true_false') { payload.trueFalseOptions = editForm.trueFalseOptions; } else if (type === 'short_answer') { payload.shortAnswerCorrect = editForm.shortAnswerCorrect; } if (newImageUrl) payload.imageUrl = newImageUrl; await api.updateQuestion(id, payload); setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload, imageUrl: newImageUrl || q.imageUrl } : q))); cancelEdit(); } catch (err: any) { alert(err.message || 'Lỗi khi cập nhật câu hỏi'); } finally { setIsUploading(false); } };
  const renderCorrectAnswer = (q: Question) => { if (!q.type || q.type === 'multiple_choice') { return <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{q.correctAnswer || '—'}</span>; } if (q.type === 'true_false') { return ( <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 min-w-[120px]"> {q.trueFalseOptions?.map((opt: any) => ( <div key={opt.id} className="flex items-center justify-between gap-2 border-b last:border-0 border-slate-200 dark:border-slate-600 pb-1 last:pb-0 mb-1 last:mb-0"> <span className="font-bold uppercase w-4 text-slate-500">{opt.id}:</span> <span className={`font-bold ${opt.isCorrect ? 'text-green-600' : 'text-red-500'}`}> {opt.isCorrect ? 'Đúng' : 'Sai'} </span> </div> ))} </div> ); } if (q.type === 'short_answer') { return ( <span className="font-bold text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded border border-green-200 dark:border-green-800 inline-block"> {q.shortAnswerCorrect || '(Trống)'} </span> ); } return <span>—</span>; };


  return (
    <div className="container mx-auto py-8 relative">
      
      {/* HEADER & TOOLBAR */}
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
                    <Button 
                        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2" 
                        onClick={() => setShowCreateModal(true)} 
                    >
                        <FilePlus className="w-4 h-4" /> Đóng gói đề thi
                    </Button>
                </>
            ) : (
                <>
                    {/* --- NEW: TOOLBAR CHỌN NHANH --- */}
                    {examConfig && (
                        <div className="flex gap-2 items-center mr-3 bg-white dark:bg-slate-800 p-1.5 rounded-lg border shadow-sm">
                            <span className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1">
                                <Wand2 className="w-3 h-3"/> Auto:
                            </span>
                            <button 
                                onClick={() => handleQuickSelect('multiple_choice', examConfig.structure?.multiple_choice || 0)} 
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-medium"
                                title="Chọn ngẫu nhiên đủ số câu trắc nghiệm"
                            >
                                +{examConfig.structure?.multiple_choice} P.I
                            </button>
                            <button 
                                onClick={() => handleQuickSelect('true_false', examConfig.structure?.true_false || 0)} 
                                className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100 font-medium"
                                title="Chọn ngẫu nhiên đủ số câu đúng sai"
                            >
                                +{examConfig.structure?.true_false} P.II
                            </button>
                            <button 
                                onClick={() => handleQuickSelect('short_answer', examConfig.structure?.short_answer || 0)} 
                                className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 font-medium"
                                title="Chọn ngẫu nhiên đủ số câu tự luận"
                            >
                                +{examConfig.structure?.short_answer} P.III
                            </button>
                        </div>
                    )}
                    {/* ------------------------------- */}

                    <span className="flex items-center px-3 font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">
                        Đã chọn: {selectedIds.size}
                    </span>
                    <Button 
                        className="bg-green-600 hover:bg-green-700" 
                        onClick={() => setShowCreateModal(true)} 
                    >
                        Tạo đề
                    </Button>
                    <Button variant="danger" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                        Hủy
                    </Button>
                </>
            )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : (
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
                            
                            {/* CỘT CHECKBOX */}
                            <td className="p-4 text-center align-top pt-5">
                                {isSelectionMode && (
                                    <button onClick={() => toggleSelection(qId)}>
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <Square className="w-5 h-5 text-slate-300"/>}
                                    </button>
                                )}
                            </td>
                    
                            {/* CỘT NỘI DUNG (Giữ nguyên code cũ) */}
                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                <div className="space-y-4">
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

                                    <textarea
                                        value={editForm.questionText}
                                        onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                                        rows={3}
                                        placeholder="Nội dung câu hỏi..."
                                    />

                                    {/* Edit Options */}
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
                                </div>
                                ) : (
                                <div>
                                    <div className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
                                        Câu {index + 1} 
                                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal uppercase">
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
                                </div>
                                )}
                            </td>

                            {/* CỘT 2: ĐÁP ÁN ĐÚNG */}
                            <td className="p-4 align-top">
                                {editingId === qId ? (
                                    (!q.type || q.type === 'multiple_choice') ? (
                                        <select value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} className="p-2 border rounded w-full">
                                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                        </select>
                                    ) : <div className="text-xs text-slate-500 italic">Vào chi tiết để sửa</div>
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
                    // Giao diện chọn chế độ
                    <div className="space-y-3">
                        <p className="text-slate-600 mb-4">Chọn phương thức tạo đề:</p>
                        <button 
                            className="w-full p-4 border-2 border-indigo-100 hover:border-indigo-500 rounded-lg flex items-center gap-3 transition-all bg-indigo-50/50"
                            onClick={() => {
                                const title = prompt("Nhập tên đề thi ngẫu nhiên:");
                                if(title) handleCreateExamProcess('random', title, examConfig?.duration || 45);
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
                    // Giao diện nhập thông tin đề thủ công (CÓ VALIDATION)
                    <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm font-medium text-center">
                            Đang đóng gói <b>{selectedIds.size}</b> câu hỏi đã chọn.
                        </div>

                        {/* --- THÔNG BÁO CẤU TRÚC ĐỀ (MỚI) --- */}
                        {examConfig && (
                            <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                                <p className="font-bold mb-1">Cấu trúc chuẩn:</p>
                                <p>• Trắc nghiệm: {examConfig.structure?.multiple_choice} câu</p>
                                <p>• Đúng/Sai: {examConfig.structure?.true_false} câu</p>
                                <p>• Tự luận: {examConfig.structure?.short_answer} câu</p>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên đề thi</label>
                            <input id="exam-title" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500" placeholder="VD: Kiểm tra 15 phút..." autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Thời gian làm bài (phút)</label>
                            <input id="exam-duration" type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500" defaultValue={examConfig?.duration || 45} />
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