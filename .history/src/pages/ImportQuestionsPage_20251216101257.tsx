import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../services/api';

const ImportQuestionsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleImport = async () => {
    setStatus(null);
    setLoading(true);
    try {
      // 1. Parse JSON để kiểm tra lỗi cú pháp trước
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error('Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại dấu ngoặc, dấu phẩy.');
      }

      if (!Array.isArray(parsedData)) {
        throw new Error('Dữ liệu phải là một mảng danh sách câu hỏi [...]');
      }

      // 2. Gọi API
      const res = await api.importQuestions(subjectId!, parsedData);
      setStatus({ type: 'success', text: res.message });
      setJsonInput(''); // Xóa input sau khi thành công
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Mẫu JSON gợi ý cho người dùng copy
  const sampleJson = `[
  {
    "questionText": "Câu 1: Nội dung câu hỏi...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correctAnswer": "A",
    "explanation": "Giải thích...",
    "groupContext": "Đoạn văn bài đọc (nếu có)..."
  },
  {
    "questionText": "Câu 2: ...",
    ...
  }
]`;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Import Câu hỏi (JSON)</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột trái: Input */}
        <Card className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Dán dữ liệu JSON vào đây:</label>
            <textarea
              className="w-full h-[500px] p-4 border rounded bg-slate-900 text-green-400 font-mono text-sm"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON here..."
            />
          </div>
          
          {status && (
            <div className={`p-3 mb-4 rounded ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status.text}
            </div>
          )}

          <Button onClick={handleImport} disabled={loading || !jsonInput} className="w-full">
            {loading ? 'Đang xử lý...' : 'Tiến hành Import'}
          </Button>
        </Card>

        {/* Cột phải: Hướng dẫn */}
        <Card className="p-6 h-fit">
          <h3 className="font-bold mb-4 text-lg">Hướng dẫn sử dụng AI để tạo đề</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Mở file PDF đề thi ĐGNL.</li>
            <li>Copy nội dung khoảng 10-20 câu hỏi (kèm cả đoạn văn bài đọc).</li>
            <li>Paste vào <b>ChatGPT / Gemini</b> kèm câu lệnh prompt bên dưới.</li>
            <li>Copy kết quả JSON từ AI và dán vào khung bên trái.</li>
            <li>Nhấn <b>Import</b>.</li>
          </ol>

          <div className="mt-6">
            <p className="font-medium mb-2">Câu lệnh Prompt mẫu:</p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs font-mono border overflow-x-auto select-all">
              {`Hãy chuyển đổi nội dung đề thi sau thành định dạng JSON Array để tôi import vào database.
Cấu trúc mỗi object như sau:
${sampleJson}

Lưu ý:
- Nếu có đoạn văn bài đọc, hãy đưa vào trường "groupContext" của tất cả các câu hỏi thuộc bài đọc đó.
- "correctAnswer" chỉ lấy ký tự A, B, C, hoặc D.
- Giữ nguyên định dạng tiếng Việt.

Nội dung đề thi:
[DÁN NỘI DUNG PDF VÀO ĐÂY]`}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImportQuestionsPage;