import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper
import { getFullImageUrl } from '../utils/imageHelper';

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });

  useEffect(() => {
    const load = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const qs = await api.getQuestions(subjectId);
        setQuestions(qs);
      } catch (err) {
        console.error(err);
        alert('Không thể tải câu hỏi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa câu hỏi');
    }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    setEditForm({ questionText: q.questionText || '', options: q.options || {}, correctAnswer: q.correctAnswer || 'A', explanation: q.explanation || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const payload = { questionText: editForm.questionText, options: editForm.options, correctAnswer: editForm.correctAnswer, explanation: editForm.explanation };
      await api.updateQuestion(id, payload);
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload } : q)));
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật câu hỏi');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Quản lý câu hỏi: {subjectNameFromState || subjectId}</h1>
      <div className="mb-4">
        <Button onClick={() => navigate('/admin')}>Quay lại</Button>
        <Button className="ml-2" onClick={() => navigate('/admin/questions/new', { state: { subjectId } })}>Thêm câu hỏi cho môn này</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Nội dung</th>
                <th className="p-2">Đáp án đúng</th>
                <th className="p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';
// Import hàm helper
import { getFullImageUrl } from '../utils/imageHelper';

const SubjectQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectNameFromState = (location.state as any)?.subjectName;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });

  useEffect(() => {
    const load = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        const qs = await api.getQuestions(subjectId);
        setQuestions(qs);
      } catch (err) {
        console.error(err);
        alert('Không thể tải câu hỏi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id && q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa câu hỏi');
    }
  };

  const startEdit = (q: any) => {
    setEditingId(q._id || q.id);
    setEditForm({ questionText: q.questionText || '', options: q.options || {}, correctAnswer: q.correctAnswer || 'A', explanation: q.explanation || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ questionText: '', options: {}, correctAnswer: 'A', explanation: '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const payload = { questionText: editForm.questionText, options: editForm.options, correctAnswer: editForm.correctAnswer, explanation: editForm.explanation };
      await api.updateQuestion(id, payload);
      setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...payload } : q)));
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật câu hỏi');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Quản lý câu hỏi: {subjectNameFromState || subjectId}</h1>
      <div className="mb-4">
        <Button onClick={() => navigate('/admin')}>Quay lại</Button>
        <Button className="ml-2" onClick={() => navigate('/admin/questions/new', { state: { subjectId } })}>Thêm câu hỏi cho môn này</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Nội dung</th>
                <th className="p-2">Đáp án đúng</th>
                <th className="p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, index) => (
                <tr key={q._id || q.id} className="border-b">
                  <td className="p-2 align-top">
                    {editingId === (q._id || q.id) ? (
                      <div>
                        {/* Form chỉnh sửa (Giữ nguyên code cũ của bạn) */}
                        <textarea
                          value={editForm.questionText}
                          onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                          className="w-full p-2 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                           {/* ... Inputs options A, B, C, D ... */}
                           {['A', 'B', 'C', 'D'].map((opt) => (
                              <label key={opt} className="text-sm">
                                <div className="text-xs text-slate-500 mb-1">{opt}</div>
                                <input 
                                  value={editForm.options?.[opt] || ''} 
                                  onChange={(e) => setEditForm({ ...editForm, options: { ...editForm.options, [opt]: e.target.value } })} 
                                  className="w-full p-2 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                              </label>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* --- SỬA ĐỔI Ở ĐÂY: Hiển thị ảnh đúng cách --- */}
                        
                        <div className="font-semibold mb-1">Câu {index + 1}:</div>
                        
                        {q.imageUrl && (
                          <div className="mb-2">
                            <img 
                              src={getFullImageUrl(q.imageUrl)} // Sử dụng hàm helper
                              alt="question" 
                              className="max-h-40 max-w-full object-contain rounded border border-slate-300 bg-white"
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                          </div>
                        )}

                        {q.questionText ? (
                          <div className="whitespace-pre-wrap">{q.questionText}</div>
                        ) : !q.imageUrl && (
                          <div className="text-slate-400 italic">No content</div>
                        )}
                        {/* ------------------------------------------- */}

                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {q.options && (
                            <ul className="list-none p-0 m-0">
                              {['A', 'B', 'C', 'D'].map(key => (
                                <li key={key} className={`py-1 ${q.correctAnswer === key ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                  <span className="inline-block w-5 font-bold">{key}.</span> {q.options[key]}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    {editingId === (q._id || q.id) ? (
                      <select value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} className="p-1 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    ) : (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{q.correctAnswer || '—'}</span>
                    )}
                  </td>
                  <td className="p-2 space-x-2 w-32">
                    {editingId === (q._id || q.id) ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(q._id || q.id)}>Lưu</Button>
                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Hủy</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(q._id || q.id)}>Xóa</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default SubjectQuestionsPage; => (
                <tr key={q._id || q.id} className="border-b">
                  <td className="p-2 align-top">
                    {editingId === (q._id || q.id) ? (
                      <div>
                        {/* Form chỉnh sửa (Giữ nguyên code cũ của bạn) */}
                        <textarea
                          value={editForm.questionText}
                          onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                          className="w-full p-2 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                           {/* ... Inputs options A, B, C, D ... */}
                           {['A', 'B', 'C', 'D'].map((opt) => (
                              <label key={opt} className="text-sm">
                                <div className="text-xs text-slate-500 mb-1">{opt}</div>
                                <input 
                                  value={editForm.options?.[opt] || ''} 
                                  onChange={(e) => setEditForm({ ...editForm, options: { ...editForm.options, [opt]: e.target.value } })} 
                                  className="w-full p-2 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                              </label>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* --- SỬA ĐỔI Ở ĐÂY: Hiển thị ảnh đúng cách --- */}
                        
                        <div className="font-semibold mb-1">Câu {index + 1}:</div>
                        
                        {q.imageUrl && (
                          <div className="mb-2">
                            <img 
                              src={getFullImageUrl(q.imageUrl)} // Sử dụng hàm helper
                              alt="question" 
                              className="max-h-40 max-w-full object-contain rounded border border-slate-300 bg-white"
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                          </div>
                        )}

                        {q.questionText ? (
                          <div className="whitespace-pre-wrap">{q.questionText}</div>
                        ) : !q.imageUrl && (
                          <div className="text-slate-400 italic">No content</div>
                        )}
                        {/* ------------------------------------------- */}

                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {q.options && (
                            <ul className="list-none p-0 m-0">
                              {['A', 'B', 'C', 'D'].map(key => (
                                <li key={key} className={`py-1 ${q.correctAnswer === key ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                  <span className="inline-block w-5 font-bold">{key}.</span> {q.options[key]}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    {editingId === (q._id || q.id) ? (
                      <select value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })} className="p-1 border-2 rounded bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    ) : (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{q.correctAnswer || '—'}</span>
                    )}
                  </td>
                  <td className="p-2 space-x-2 w-32">
                    {editingId === (q._id || q.id) ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(q._id || q.id)}>Lưu</Button>
                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Hủy</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => startEdit(q)}>Sửa</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(q._id || q.id)}>Xóa</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default SubjectQuestionsPage;