import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Subject, Question } from '../types';
import { CheckSquare, Square, Search, Filter } from 'lucide-react'; // Thêm icon Filter
import Button from './Button';

interface Props {
  targetSubjectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const GlobalQuestionBankModal: React.FC<Props> = ({ targetSubjectId, onClose, onSuccess }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // 1. Load danh sách các môn học (Trừ môn hiện tại ra)
  useEffect(() => {
    api.getSubjects().then(res => {
        const otherSubjects = res.filter((s: any) => s.id !== targetSubjectId && s._id !== targetSubjectId);
        setSubjects(otherSubjects);
        if (otherSubjects.length > 0) setSelectedSubjectFilter(otherSubjects[0].id || otherSubjects[0]._id);
    });
  }, [targetSubjectId]);

  // 2. Load câu hỏi khi chọn môn (CÓ LỌC)
  useEffect(() => {
    if (!selectedSubjectFilter) return;
    setLoading(true);
    setQuestions([]); // Clear cũ
    
    api.getQuestions(selectedSubjectFilter)
       .then(res => {
           // 👇 LOGIC LỌC QUAN TRỌNG 👇
           // Chỉ lấy câu trắc nghiệm (multiple_choice) hoặc câu cũ (không có type)
           // Bỏ qua câu True/False và Short Answer
           const onlyMultipleChoice = res.filter(q => !q.type || q.type === 'multiple_choice');
           
           setQuestions(onlyMultipleChoice);
       })
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  }, [selectedSubjectFilter]);

  // Logic chọn/bỏ chọn
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === questions.length) {
          setSelectedIds(new Set());
      } else {
          const allIds = questions.map(q => q._id || q.id);
          setSelectedIds(new Set(allIds));
      }
  }

  // Logic Import (Clone)
  const handleImport = async () => {
    if (selectedIds.size === 0) return alert('Chưa chọn câu hỏi nào');
    if (!confirm(`Sao chép ${selectedIds.size} câu hỏi sang môn hiện tại?`)) return;
    
    setImporting(true);
    try {
        await api.cloneQuestions(targetSubjectId, Array.from(selectedIds));
        alert('Đã sao chép thành công!');
        onSuccess(); // Callback để reload trang cha
        onClose();
    } catch (e: any) {
        alert(e.message);
    } finally {
        setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-indigo-600 text-white rounded-t-xl">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Filter className="w-5 h-5" /> Kho câu hỏi tổng hợp
                </h3>
                <p className="text-xs text-indigo-200 mt-1">Chỉ hiển thị câu hỏi Trắc nghiệm (4 lựa chọn)</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar: Danh sách môn */}
            <div className="w-1/4 border-r dark:border-slate-700 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn môn nguồn</div>
                {subjects.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => {
                            setSelectedSubjectFilter(s.id || s._id);
                            setSelectedIds(new Set()); // Reset selection khi đổi môn
                        }}
                        className={`w-full text-left p-3 border-b dark:border-slate-700 transition-colors ${
                            (selectedSubjectFilter === s.id || selectedSubjectFilter === s._id)
                            ? 'bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        {s.name}
                        <span className="block text-[10px] font-normal text-slate-400">{s.questionCount || 0} câu</span>
                    </button>
                ))}
            </div>

            {/* Content: Danh sách câu hỏi */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                {/* Toolbar con */}
                <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                        Danh sách câu hỏi <b>Trắc nghiệm</b> từ môn đã chọn:
                    </div>
                    <button 
                        onClick={toggleSelectAll}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                        {selectedIds.size === questions.length && questions.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-500">Đang tải dữ liệu...</div>
                    ) : questions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p>Không tìm thấy câu hỏi trắc nghiệm nào.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {questions.map(q => {
                                const qId = q.id || q._id;
                                const isSelected = selectedIds.has(qId);
                                return (
                                    <div 
                                        key={qId} 
                                        className={`flex gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                                            isSelected 
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' 
                                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-sm'
                                        }`} 
                                        onClick={() => toggleSelect(qId)}
                                    >
                                        <div className="pt-1">
                                            {isSelected ? <CheckSquare className="text-indigo-600 w-5 h-5"/> : <Square className="text-slate-300 w-5 h-5"/>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-1">{q.questionText}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-400 font-bold">
                                                    {q.type || 'MC'}
                                                </span>
                                                {/* Hiển thị đáp án để dễ chọn */}
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                                                    Đáp án: {q.correctAnswer}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-b-xl">
            <div className="text-sm">
                <span className="font-bold text-indigo-600">{selectedIds.size}</span> câu hỏi được chọn
            </div>
            <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose}>Hủy bỏ</Button>
                <Button onClick={handleImport} disabled={importing || selectedIds.size === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {importing ? 'Đang sao chép...' : 'Lấy các câu hỏi này'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalQuestionBankModal;