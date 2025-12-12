import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// 1. Cấu hình Cloudinary (Lấy từ biến môi trường)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cấu hình Storage (Lưu trực tiếp lên mây)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'onthithpt_uploads', // Tên thư mục sẽ tạo trên Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Chỉ cho phép ảnh
      public_id: `img_${Date.now()}-${Math.round(Math.random() * 1e9)}`, // Tên file duy nhất
    };
  },
});

const upload = multer({ storage });

// POST /api/upload - Upload file lên Cloudinary
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    // Ép kiểu any để tránh lỗi TypeScript với req.file của multer-cloud
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    // Cloudinary trả về link ảnh trong thuộc tính .path
    // Ví dụ: https://res.cloudinary.com/dwse6inaq/image/upload/...
    res.json({
      message: 'Upload thành công',
      url: file.path, 
    });
  } catch (error) {
    console.error('Lỗi upload Cloudinary:', error);
    res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
  }
});

export default router;