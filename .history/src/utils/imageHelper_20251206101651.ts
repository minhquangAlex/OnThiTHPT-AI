// src/utils/imageHelper.ts

export const getFullImageUrl = (imagePath?: string) => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith('http')) return imagePath; // Nếu là link online thì giữ nguyên

  // Lấy API URL từ biến môi trường
  const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://undisputedly-nonsocialistic-sheba.ngrok-free.dev/api';
  
  // Cắt bỏ đuôi '/api' để lấy domain gốc (nơi chứa folder uploads)
  const rootUrl = apiUrl.replace(/\/api\/?$/, '');
  
  // Đảm bảo imagePath bắt đầu bằng dấu /
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${rootUrl}${cleanPath}`;
};