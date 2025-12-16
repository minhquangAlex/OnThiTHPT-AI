import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api'; // Dùng api service chung cho thống nhất

const BatchUpload: React.FC = () => {
  const { token } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Vui lòng chọn file JSON.');
      return;
    }
    setLoading(true);

    try {
      // 1. Đọc nội dung file JSON tại Frontend
      const fileContent = await file.text();
      let jsonData;
      try {
        jsonData = JSON.parse(fileContent);
      } catch (e) {
        throw new Error('File không đúng định dạng JSON');
      }

      // Kiểm tra sơ bộ
      if (!Array.isArray(jsonData)) {
        throw new Error('File JSON phải chứa một mảng danh sách câu hỏi []');
      }

      // 2. Gửi dữ liệu JSON lên Backend (Dùng fetch hoặc api service)
      // Lưu ý: Đảm bảo URL backend đúng (dùng biến môi trường hoặc từ api service)
      // Ở đây tôi dùng fetch trực tiếp để minh họa, nhưng bạn nên dùng api.post nếu có
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api';
      
      const response = await fetch(`${apiUrl}/questions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true' // Nếu dùng ngrok
        },
        body: JSON.stringify({ questions: jsonData }), // Gói trong object { questions: [...] }
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Thành công! Đã thêm ${result.data?.length || 0} câu hỏi.`);
        setFile(null);
      } else {
        setMessage(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-slate-50 dark:bg-slate-900">
      <h3 className="font-bold mb-4">Upload câu hỏi hàng loạt (JSON)</h3>
      <div className="flex gap-2 items-center">
        <input 
          type="file" 
          accept=".json" 
          onChange={handleFileChange} 
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <button 
          onClick={handleUpload} 
          disabled={loading || !file}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-slate-400"
        >
          {loading ? 'Đang xử lý...' : 'Upload'}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-sm font-medium ${message.startsWith('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
      
      <div className="mt-4 text-xs text-slate-500">
        <p>Mẫu JSON:</p>
        <pre className="bg-slate-200 p-2 rounded mt-1 overflow-x-auto">
{`[
  {
    "subjectId": "ID_MON_HOC",
    "questionText": "Nội dung...",
    "type": "multiple_choice",
    "options": {"A": "...", "B": "..."},
    "correctAnswer": "A"
  },
  ...
]`}
        </pre>
      </div>
    </div>
  );
};

export default BatchUpload;