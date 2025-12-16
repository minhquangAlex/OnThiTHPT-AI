import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Trash2, Eye, CheckSquare, Square, Clock } from 'lucide-react'; // Thêm icon

const SubjectExamsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO CHỌN NHIỀU ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getExamsBySubject(subjectId!);
        setExams(res.fixedExams);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  // --- LOGIC CHỌN ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === exams.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(exams.map(e => e._id)));
    }
  };

  // --- LOGIC XÓA LẺ (CŨ) ---
  const handleDelete = async (examId: string) => {
    if(!confirm('Xóa đề thi này? (Câu hỏi trong đề vẫn được giữ lại)')) return;
    try {
        await api.deleteExam(examId);
        setExams(prev => prev.filter(e => e._id !== examId));
    } catch(e) { alert('Lỗi xóa đề'); }
  };

  // --- LOGIC XÓA HÀNG LOẠT (MỚI) ---
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return alert("Vui lòng chọn ít nhất 1 đề thi!");
    
    if (!confirm(`CẢNH BÁO: Bạn có chắc muốn xóa ${selectedIds.size} đề thi đã chọn?`)) {
        return;
    }

    try {
        // Dùng Promise.all để xóa nhiều đề cùng lúc (Tận dụng API xóa lẻ có sẵn)
        await Promise.all(Array.from(selectedIds).map(id => api.deleteExam(id)));
        
        // Cập nhật giao diện
        setExams(prev => prev.filter(e => !selectedIds.has(e._id)));
        
        // Reset
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        alert('Đã xóa thành công!');
    } catch (err: any) {
        alert('Có lỗi xảy ra khi xóa một số đề thi.');
        // Load lại để đồng bộ dữ liệu nếu có lỗi
        window.location.reload();
    }
  };

  return (
    <div className="container mx-auto py-8">
      
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold">Quản lý Đề thi</h1>
            <p className="text-sm text-slate-500">Tổng số: {exams.length} đề</p>
        </div>
        
        <div className="flex gap-2">
            {!isSelectionMode ? (
                <>
                    <Button variant="secondary" onClick={() => navigate('/admin')}>Quay lại</Button>
                    {/* Nút bật chế độ chọn */}
                    <Button 
                        variant="secondary"
                        className="border-slate-300" 
                        onClick={() => setIsSelectionMode(true)}
                        disabled={exams.length === 0}
                    >
                        <CheckSquare className="w-4 h-4 mr-1"/> Chọn nhiều
                    </Button>
                </>
            ) : (
                <>
                    <Button 
                        variant="secondary" 
                        onClick={toggleSelectAll}
                    >
                        {selectedIds.size === exams.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Button>
                    
                    <span className="flex items-center px-3 font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">
                        Đã chọn: {selectedIds.size}
                    </span>

                    <Button 
                        variant="danger" 
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.size})
                    </Button>

                    <Button variant="secondary" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                        Hủy
                    </Button>
                </>
            )}
        </div>
      </div>
      
      {/* DANH SÁCH ĐỀ THI */}
      <div className="grid gap-4">
        {loading ? <div className="text-center p-8">Đang tải...</div> : exams.map(exam => {
            const isSelected = selectedIds.has(exam._id);
            return (
                <Card 
                    key={exam._id} 
                    className={`p-4 flex items-center transition-all ${
                        isSelectionMode 
                            ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' 
                            : ''
                    } ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                    onClick={() => {
                        if (isSelectionMode) toggleSelection(exam._id);
                    }}
                >
                    {/* Checkbox (Chỉ hiện khi mode chọn) */}
                    {isSelectionMode && (
                        <div className="mr-4">
                            {isSelected ? (
                                <CheckSquare className="w-6 h-6 text-indigo-600" />
                            ) : (
                                <Square className="w-6 h-6 text-slate-300" />
                            )}
                        </div>
                    )}

                    {/* Nội dung Card */}
                    <div className="flex-1 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{exam.title}</h3>
                            <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {exam.duration} phút</span>
                                <span>• Tạo ngày: {new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                        
                        {/* Các nút hành động (Ẩn khi đang chọn nhiều để tránh bấm nhầm) */}
                        {!isSelectionMode && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/exams/${subjectId}/view/${exam._id}`); }}>
                                    <Eye className="w-4 h-4 mr-1"/> Xem
                                </Button>
                                <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(exam._id); }}>
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            );
        })}
        
        {!loading && exams.length === 0 && (
            <p className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg border border-dashed">
                Chưa có đề thi nào. Hãy vào "Ngân hàng câu hỏi" để tạo đề mới.
            </p>
        )}
      </div>
    </div>
  );
};
export default SubjectExamsPage;