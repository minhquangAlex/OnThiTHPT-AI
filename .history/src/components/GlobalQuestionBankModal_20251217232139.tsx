import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Subject, Question } from '../types';
import { CheckSquare, Square, Search } from 'lucide-react';
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

  // 1. Load danh sách môn học
  useEffect(() => {
    api.getSubjects().then(res => {
        const otherSubjects = res.filter((s: any) => s.id !== targetSubjectId);
        setSubjects(otherSubjects);
        if (otherSubjects.length > 0) setSelectedSubjectFilter(otherSubjects[0].id);
    });
  }, [targetSubjectId]);

  // 2. Load câu hỏi khi chọn môn
  useEffect(() => {
    if (!selectedSubjectFilter) return;
    setLoading(true);
    api.getQuestions(selectedSubjectFilter)
       .then(setQuestions)
       .finally(() => setLoading(false));
  }, [selectedSubjectFilter]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return alert('Chưa chọn câu hỏi nào');
    if (!confirm(`Sao chép ${selectedIds.size} câu hỏi sang môn ĐGNL?`)) return;
    
    setImporting(true);
    try {
        await api.cloneQuestions(targetSubjectId, Array.from(selectedIds));
        alert('Thành công!');
        onSuccess();
        onClose();
    } catch (e: any) {
        alert(e.message);
    } finally {
        setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold">Kho câu hỏi tổng hợp</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar: Danh sách môn */}
            <div className="w-1/4 border-r dark:border-slate-700 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                {subjects.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => setSelectedSubjectFilter(s.id)}
                        className={`w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${selectedSubjectFilter===s.id ? 'bg-indigo-100 text-indigo-700 font-bold' : ''}`}
                    >
                        {s.name}
                    </button>
                ))}
            </div>

            {/* Content: Danh sách câu hỏi */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? <p>Đang tải...</p> : (
                    <div className="space-y-2">
                        {questions.map(q => (
                            <div key={q.id || q._id} className="flex gap-3 p-3 border rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => toggleSelect(q._id || q.id)}>
                                <div className="pt-1">
                                    {selectedIds.has(q._id || q.id) ? <CheckSquare className="text-indigo-600"/> : <Square className="text-slate-300"/>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                                    <span className="text-xs bg-gray-200 px-1 rounded text-gray-600">{q.type || 'MC'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-b-xl">
            <span className="font-bold text-indigo-600">Đã chọn: {selectedIds.size} câu</span>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>Hủy</Button>
                <Button onClick={handleImport} disabled={importing || selectedIds.size === 0}>
                    {importing ? 'Đang chép...' : 'Lấy câu hỏi này'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalQuestionBankModal;