import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const NewQuestionPage: React.FC = () => {
  const { token } = useAuthStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({ subjectId: '', questionText: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', explanation: '' });
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const subs = await api.getSubjects();
        setSubjects(subs);
        // prefill subjectId either from navigation state (when coming from subject page) or default to first
        const loc = (useLocation && undefined) as unknown; // noop to keep import
        // read from history state via window.history to avoid hooks in async context
        const stateSubjectId = (window.history.state && (window.history.state as any).usr && (window.history.state as any).usr.state && (window.history.state as any).usr.state.subjectId) || null;
        if (stateSubjectId) {
          setForm(f => ({ ...f, subjectId: stateSubjectId }));
        } else if (subs.length) {
          setForm(f => ({ ...f, subjectId: subs[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Bạn cần đăng nhập bằng tài khoản admin');
    setLoading(true);
    try {
      let payload: any = { ...form };
      if (mode === 'image') {
        if (!imageFile) return alert('Vui lòng chọn ảnh câu hỏi');
        setUploading(true);
        try {
          const res = await api.uploadFile(imageFile);
          payload.imageUrl = res.url;
        } catch (err: any) {
          alert(err.message || 'Lỗi khi tải ảnh lên');
          setUploading(false);
          setLoading(false);
          return;
        } finally {
          setUploading(false);
        }
        // ensure questionText is empty when using image, or keep if present
        payload.questionText = payload.questionText || '';
      }
      await api.createQuestion(payload as any);
      alert('Tạo câu hỏi thành công');
      // reset form
      setForm({ subjectId: subjects[0]?.id || '', questionText: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', explanation: '' });
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = (file: File) => {
    // basic validation: image type and size limit 8MB
    if (!file.type.startsWith('image/')) return alert('Vui lòng chọn file ảnh');
    if (file.size > 8 * 1024 * 1024) return alert('Kích thước ảnh không được vượt quá 8MB');
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tạo câu hỏi mới</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <label>
            <span className="text-sm text-orange-500 mb-1 block font-medium">Môn học</span>
            <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="mode" checked={mode === 'text'} onChange={() => setMode('text')} className="text-orange-500 focus:ring-orange-500" />
                <span className="text-orange-500 font-medium">Nhập bằng chữ</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="mode" checked={mode === 'image'} onChange={() => setMode('image')} className="text-orange-500 focus:ring-orange-500" />
                <span className="text-orange-500 font-medium">Tải ảnh câu hỏi</span>
              </label>
            </div>

            {mode === 'text' ? (
              <label className="block">
                <span className="text-sm text-orange-500 mb-1 block font-medium">Nội dung câu hỏi</span>
                <textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} className="w-full min-h-[140px] bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-3 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </label>
            ) : (
              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Tải ảnh câu hỏi (kéo thả hoặc bấm để chọn)</span>
                <div
                  ref={dropRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer?.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                  className="w-full min-h-[140px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded p-4 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  onClick={() => document.getElementById('question-image-input')?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="max-h-56 object-contain" />
                  ) : (
                    <div className="text-center text-slate-500">
                      Kéo thả ảnh vào đây hoặc bấm để chọn
                    </div>
                  )}
                  <input id="question-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }} />
                </div>
                {imageFile && (
                  <div className="mt-2 text-sm text-slate-600">Tệp: {imageFile.name} — {(imageFile.size / 1024).toFixed(1)} KB</div>
                )}
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-orange-500 mb-1 block font-medium">Đáp án A</span>
              <input value={form.options.A} onChange={(e) => setForm({ ...form, options: { ...form.options, A: e.target.value } })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </label>
            <label>
              <span className="text-sm text-orange-500 mb-1 block font-medium">Đáp án B</span>
              <input value={form.options.B} onChange={(e) => setForm({ ...form, options: { ...form.options, B: e.target.value } })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </label>
            <label>
              <span className="text-sm text-orange-500 mb-1 block font-medium">Đáp án C</span>
              <input value={form.options.C} onChange={(e) => setForm({ ...form, options: { ...form.options, C: e.target.value } })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </label>
            <label>
              <span className="text-sm text-orange-500 mb-1 block font-medium">Đáp án D</span>
              <input value={form.options.D} onChange={(e) => setForm({ ...form, options: { ...form.options, D: e.target.value } })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </label>
          </div>

          <label>
            <span className="text-sm text-orange-500 mb-1 block font-medium">Đáp án đúng</span>
            <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>

          <label>
            <span className="text-sm text-orange-500 mb-1 block font-medium">Giải thích</span>
            <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-2 border-orange-500 rounded p-3 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => window.history.back()}>Hủy</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo câu hỏi'}</Button>
          </div>
        </form>
      </Card>
      <p className="mt-4 text-sm text-slate-500">Gợi ý: để hỗ trợ công thức toán hoặc ký hiệu, có thể dán LaTeX vào ô nội dung và giải thích.</p>
    </div>
  );
};

export default NewQuestionPage;
