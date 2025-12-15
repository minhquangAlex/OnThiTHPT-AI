// src/pages/SubjectExamsPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Trash2, Eye } from 'lucide-react';

const SubjectExamsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Sử dụng lại hàm lấy đề thi (trả về fixedExams)
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

  const handleDelete = async (examId: string) => {
    if(!confirm('Xóa đề thi này? (Câu hỏi trong đề vẫn được giữ lại)')) return;
    try {
        await api.deleteExam(examId); // Cần đảm bảo API này có trong services/api.ts
        setExams(prev => prev.filter(e => e._id !== examId));
    } catch(e) { alert('Lỗi xóa đề'); }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý Đề thi</h1>
      <Button variant="secondary" onClick={() => navigate('/admin')} className="mb-6">Quay lại</Button>
      
      <div className="grid gap-4">
        {exams.map(exam => (
            <Card key={exam._id} className="p-4 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg">{exam.title}</h3>
                    <p className="text-sm text-slate-500">Thời gian: {exam.duration} phút • Tạo ngày: {new Date(exam.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    {/* Admin có thể vào làm thử để xem đề */}
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/exams/${subjectId}/view/${exam._id}`)}>
                        <Eye className="w-4 h-4"/> Xem
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(exam._id)}>
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                </div>
            </Card>
        ))}
        {exams.length === 0 && <p className="text-center text-slate-500">Chưa có đề thi nào.</p>}
      </div>
    </div>
  );
};
export default SubjectExamsPage;