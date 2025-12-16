// frontend/src/pages/NewQuestionPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import BatchUpload from '../components/BatchUpload';
// Import QuestionType từ file types vừa sửa
import { QuestionType } from '../types';

const NewQuestionPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Form State
  const [subjectId, setSubjectId] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  
  // State riêng cho từng loại câu hỏi
  const [mcOptions, setMcOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [mcCorrect, setMcCorrect] = useState('A');

  const [tfOptions, setTfOptions] = useState([
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ]);

  const [shortAnswer, setShortAnswer] = useState('');

  // Image Upload State
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'form' | 'batch'>('form');

  useEffect(() => {
    (async () => {
      try {
        const subs = await api.getSubjects();
        setSubjects(subs);
        const stateSubjectId = (window.history.state?.usr?.state?.subjectId) || subs[0]?.id || '';
        setSubjectId(stateSubjectId);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) return alert('Vui lòng chọn file ảnh');
    if (file.size > 8 * 1024 * 1024) return alert('Kích thước ảnh tối đa 8MB');
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Bạn cần đăng nhập admin');
    
    setLoading(true);
    try {
      let imageUrl = '';
      
      // 1. Upload ảnh nếu có
      if (mode === 'image' && imageFile) {
        setUploading(true);
        try {
          const res = await api.uploadFile(imageFile);
          imageUrl = res.url;
        } catch (err: any) {
          alert('Lỗi upload ảnh: ' + err.message);
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // 2. Chuẩn bị payload dữ liệu
      const payload: any = {
        subjectId,
        type: qType,
        questionText: mode === 'text' ? questionText : '',
        imageUrl,
        explanation
      };

      // 3. Gán dữ liệu theo loại câu hỏi
      if (qType === 'multiple_choice') {
        payload.options = mcOptions;
        payload.correctAnswer = mcCorrect;
      } 
      else if (qType === 'true_false') {
        payload.trueFalseOptions = tfOptions;
      } 
      else if (qType === 'short_answer') {
        payload.shortAnswerCorrect = shortAnswer;
      }

      await api.createQuestion(payload);
      alert('Tạo câu hỏi thành công!');
      
      // Reset form
      setQuestionText('');
      setExplanation('');
      setShortAnswer('');
      setMcOptions({ A: '', B: '', C: '', D: '' });
      setTfOptions([
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false },
        { id: 'c', text: '', isCorrect: false },
        { id: 'd', text: '', isCorrect: false },
      ]);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setMode('text');

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi tạo câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Tạo câu hỏi mới</h1>
      <Card className="p-6">
        <div className="mb-4">
          <button
            className={`mr-4 ${uploadMode === 'form' ? 'font-bold' : ''}`}
            onClick={() => setUploadMode('form')}
          >
            Nhập câu hỏi thủ công
          </button>
          <button
            className={`${uploadMode === 'batch' ? 'font-bold' : ''}`}
            onClick={() => setUploadMode('batch')}
          >
            Tải file JSON/CSV
          </button>
        </div>

        {uploadMode === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
                <select 
                  value={subjectId} 
                  onChange={(e) => setSubjectId(e.target.value)} 
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại câu hỏi (Mới 2025)</label>
                <select 
                  value={qType} 
                  onChange={(e) => setQType(e.target.value as QuestionType)} 
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 font-medium text-indigo-600"
                >
                  <option value="multiple_choice">Phần I: Trắc nghiệm (4 chọn 1)</option>
                  <option value="true_false">Phần II: Đúng / Sai</option>
                  <option value="short_answer">Phần III: Trả lời ngắn</option>
                </select>
              </div>
            </div>

            {/* Khu vực nhập Nội dung câu hỏi */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Nội dung câu hỏi:</span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" checked={mode === 'text'} onChange={() => setMode('text')} className="text-indigo-600" />
                    <span className="ml-2 text-sm">Nhập văn bản</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" checked={mode === 'image'} onChange={() => setMode('image')} className="text-indigo-600" />
                    <span className="ml-2 text-sm">Tải ảnh</span>
                  </label>
                </div>
              </div>

              {mode === 'text' ? (
                <textarea 
                  value={questionText} 
                  onChange={(e) => setQuestionText(e.target.value)} 
                  placeholder="Nhập đề bài..."
                  className="w-full min-h-[100px] p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
                />
              ) : (
                <div 
                  className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => document.getElementById('q-img-upload')?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                  ) : (
                    <span className="text-slate-500 text-sm">Bấm để chọn ảnh</span>
                  )}
                  <input id="q-img-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
                </div>
              )}
            </div>

            {/* --- KHU VỰC NHẬP ĐÁP ÁN --- */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-white border-b pb-2">Cấu hình đáp án</h3>

              {/* TRẮC NGHIỆM */}
              {qType === 'multiple_choice' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div key={opt} className="flex gap-2">
                        <span className="flex items-center justify-center w-8 h-10 bg-slate-200 dark:bg-slate-700 font-bold rounded">{opt}</span>
                        <input 
                          value={(mcOptions as any)[opt]} 
                          onChange={(e) => setMcOptions({...mcOptions, [opt]: e.target.value})}
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
                          placeholder={`Đáp án ${opt}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="mr-3 font-medium">Đáp án đúng:</label>
                    <select 
                      value={mcCorrect} 
                      onChange={(e) => setMcCorrect(e.target.value)}
                      className="p-2 border rounded bg-white dark:bg-slate-800 font-bold text-green-600"
                    >
                      {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* ĐÚNG / SAI */}
              {qType === 'true_false' && (
                <div className="space-y-3">
                  {tfOptions.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                      <span className="font-bold text-indigo-600 uppercase w-6">{item.id})</span>
                      <input 
                        type="text" 
                        value={item.text}
                        onChange={(e) => {
                          const newArr = [...tfOptions];
                          newArr[idx].text = e.target.value;
                          setTfOptions(newArr);
                        }}
                        placeholder={`Nội dung ý ${item.id}...`}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
                      />
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded border">
                        <label className={`cursor-pointer px-3 py-1 rounded ${item.isCorrect ? 'bg-green-500 text-white' : 'text-slate-500'}`}>
                          <input 
                            type="radio" 
                            name={`tf-${idx}`} 
                            className="hidden" 
                            checked={item.isCorrect === true}
                            onChange={() => {
                              const newArr = [...tfOptions];
                              newArr[idx].isCorrect = true;
                              setTfOptions(newArr);
                            }}
                          /> Đúng
                        </label>
                        <label className={`cursor-pointer px-3 py-1 rounded ${!item.isCorrect ? 'bg-red-500 text-white' : 'text-slate-500'}`}>
                          <input 
                            type="radio" 
                            name={`tf-${idx}`} 
                            className="hidden" 
                            checked={item.isCorrect === false}
                            onChange={() => {
                              const newArr = [...tfOptions];
                              newArr[idx].isCorrect = false;
                              setTfOptions(newArr);
                            }}
                          /> Sai
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TRẢ LỜI NGẮN */}
              {qType === 'short_answer' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Đáp án chính xác (Số):</label>
                  <input 
                    type="text" 
                    value={shortAnswer}
                    onChange={(e) => setShortAnswer(e.target.value)}
                    placeholder="Ví dụ: 2025 hoặc -1.5"
                    className="w-full p-3 border-2 border-green-500 rounded-lg focus:outline-none text-lg font-bold text-green-700 bg-green-50 dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500 mt-1">* Hệ thống sẽ so sánh chính xác chuỗi ký tự này với bài làm của học sinh.</p>
                </div>
              )}
            </div>

            {/* Giải thích */}
            <div>
              <label className="block text-sm font-medium mb-1">Giải thích chi tiết</label>
              <textarea 
                value={explanation} 
                onChange={(e) => setExplanation(e.target.value)} 
                className="w-full h-24 p-3 border rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Hủy bỏ</Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading || uploading ? 'Đang xử lý...' : 'Tạo câu hỏi'}
              </Button>
            </div>

          </form>
        ) : (
          <BatchUpload />
        )}
      </Card>
    </div>
  );
};

export default NewQuestionPage;