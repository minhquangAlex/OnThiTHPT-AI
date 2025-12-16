import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const BatchUpload: React.FC = () => {
  const { token } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    if (!token) {
      setMessage('Authentication token is missing. Please log in.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/api/questions/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setMessage('File uploaded successfully!');
      } else {
        const errorData = await response.json();
        setMessage(`Upload failed: ${errorData.message}`);
      }
    } catch (error) {
      setMessage(`An error occurred: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Batch Upload Questions</h2>
      <input type="file" accept=".json,.csv" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default BatchUpload;