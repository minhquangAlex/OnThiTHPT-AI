// frontend/src/pages/NewQuestionPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { QuestionType } from '../types';

const NewQuestionPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // States
  const [subjectId, setSubjectId] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  
  // Data States
  const [mcOptions, setMcOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [mcCorrect, setMcCorrect] = useState('A');
  const [tfOptions, setTfOptions] = useState([
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ]);
  const [shortAnswer, setShortAnswer] = useState('');

  // Image Upload
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const subs = await api.getSubjects();
        setSubjects(subs);
        const stateSubjectId = (window.history.state?.usr?.state?.subjectId) || subs[0]?.id || '';
        setSubjectId(stateSubjectId);
      } catch (err) { console.error(err); }
    })();
  }, []);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) return alert('Chọn file ảnh hợp lệ');
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Yêu cầu đăng nhập Admin');
    setLoading(true);

    try {
      let imageUrl = '';
      if (mode === 'image' && imageFile) {
        setUploading(true);
        const res = await api.uploadFile(imageFile);
        imageUrl = res.url;
        setUploading(false);
      }

      const payload: any = {
        subjectId,
        type: qType,
        questionText: mode === 'text' ? questionText : '',
        imageUrl,
        explanation
      };

      if (qType === 'multiple_choice') {
        payload.options = mcOptions;
        payload.correctAnswer = mcCorrect;
      } else if (qType === 'true_false') {
        payload.trueFalseOptions = tfOptions;
      } else if (qType === 'short_answer') {
        payload.shortAnswerCorrect = shortAnswer;
      }

      await api.createQuestion(payload);
      alert('Tạo câu hỏi thành công!');
      
      // Reset form
      setQuestionText('');
      setImageFile(null);
      setImagePreview(null);
      // Giữ nguyên môn và loại câu hỏi để nhập tiếp
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo câu hỏi');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <h1 className="text-2xl font-bold mb-6">Tạo câu hỏi mới</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Môn học</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full p-2 border rounded">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
              <select value={qType} onChange={(e) => setQType(e.target.value as QuestionType)} className="w-full p-2 border rounded font-bold text-indigo-600">
                <option value="multiple_choice">Phần I: Trắc nghiệm</option>
                <option value="true_false">Phần II: Đúng / Sai</option>
                <option value="short_answer">Phần III: Trả lời ngắn</option>
              </select>
            </div>
          </div>

          {/* Nội dung / Ảnh */}
          <div className="p-4 border rounded bg-slate-50 dark:bg-slate-900">
            <div className="flex gap-4 mb-2">
              <label><input type="radio" checked={mode==='text'} onChange={()=>setMode('text')} /> Text</label>
              <label><input type="radio" checked={mode==='image'} onChange={()=>setMode('image')} /> Ảnh</label>
            </div>
            {mode === 'text' ? (
              <textarea value={questionText} onChange={e=>setQuestionText(e.target.value)} className="w-full p-2 border rounded h-24" placeholder="Đề bài..." />
            ) : (
              <div onClick={()=>document.getElementById('img-in')?.click()} className="border-2 dashed h-24 flex items-center justify-center cursor-pointer">
                {imagePreview ? <img src={imagePreview} className="h-full" /> : <span>Chọn ảnh</span>}
                <input id="img-in" type="file" className="hidden" accept="image/*" onChange={e=>e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
              </div>
            )}
          </div>

          {/* INPUTS THEO LOẠI CÂU HỎI */}
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Đáp án</h3>
            
            {qType === 'multiple_choice' && (
              <div className="space-y-2">
                {['A','B','C','D'].map(opt => (
                  <div key={opt} className="flex gap-2">
                    <span className="w-8 font-bold flex items-center justify-center bg-gray-200">{opt}</span>
                    <input className="flex-1 p-2 border rounded" placeholder={`Đáp án ${opt}`} 
                      value={(mcOptions as any)[opt]} 
                      onChange={e => setMcOptions({...mcOptions, [opt]: e.target.value})} 
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span>Đáp án đúng:</span>
                  <select value={mcCorrect} onChange={e=>setMcCorrect(e.target.value)} className="p-2 border rounded font-bold">
                    {['A','B','C','D'].map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}

            {qType === 'true_false' && tfOptions.map((opt, idx) => (
              <div key={opt.id} className="flex gap-2 items-center">
                <span className="font-bold w-6 uppercase">{opt.id})</span>
                <input className="flex-1 p-2 border rounded" placeholder="Nội dung ý..." value={opt.text} 
                  onChange={e => {
                    const newArr = [...tfOptions];
                    newArr[idx].text = e.target.value;
                    setTfOptions(newArr);
                  }}
                />
                <select className="p-2 border rounded w-24" 
                  value={opt.isCorrect ? 'true' : 'false'}
                  onChange={e => {
                    const newArr = [...tfOptions];
                    newArr[idx].isCorrect = e.target.value === 'true';
                    setTfOptions(newArr);
                  }}
                >
                  <option value="true">Đúng</option>
                  <option value="false">Sai</option>
                </select>
              </div>
            ))}

            {qType === 'short_answer' && (
              <input className="w-full p-3 border-2 border-green-500 rounded text-lg font-bold" 
                placeholder="Đáp án số (VD: 2025)"
                value={shortAnswer} onChange={e=>setShortAnswer(e.target.value)} 
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giải thích</label>
            <textarea value={explanation} onChange={e=>setExplanation(e.target.value)} className="w-full p-2 border rounded h-20" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Đang lưu...' : 'Tạo câu hỏi'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default NewQuestionPage;