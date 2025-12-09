// src/utils/imageHelper.ts

export const getFullImageUrl = (imagePath?: string) => {
  if (!imagePath) return undefined;
  
  // Nếu ảnh đã là link online (ví dụ firebase, cloudinary) thì giữ nguyên
  if (imagePath.startsWith('http')) return imagePath;

  // Lấy API URL từ biến môi trường hoặc dùng link Ngrok cố định của bạn
  const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://undisputedly-nonsocialistic-sheba.ngrok-free.dev/api';
  
  // 1. Lấy Domain gốc (Cắt bỏ đuôi /api hoặc /api/)
  // Ví dụ: https://...ngrok-free.dev/api -> https://...ngrok-free.dev
  const rootUrl = apiUrl.replace(/\/api\/?$/, '');
  
  // 2. Chuẩn hóa đường dẫn ảnh (Bỏ dấu / ở đầu nếu có để tránh bị trùng thành //uploads)
  // Ví dụ: /uploads/abc.jpg -> uploads/abc.jpg
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // 3. Ghép lại: domain + / + path
  // Kết quả: https://...ngrok-free.dev/uploads/abc.jpg
  return `${rootUrl}/${cleanPath}`;
};