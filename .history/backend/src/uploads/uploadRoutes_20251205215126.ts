import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 1. Cấu hình nơi lưu trữ và tên file
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Đảm bảo đường dẫn trỏ ra ngoài thư mục src, vào folder uploads gốc
    const uploadPath = path.join(__dirname, '../../uploads'); 
    
    // Kiểm tra xem folder có tồn tại không, nếu không thì tạo (để tránh lỗi 500)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    // Đặt tên file: tên-gốc-thời-gian.đuôi
    // Ví dụ: toan-hoc-123456789.jpg
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 2. Bộ lọc chỉ cho phép file ảnh
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (Images only)!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 8 * 1024 * 1024 }, // Giới hạn 8MB
});

// 3. Định nghĩa Route Upload
// Frontend gửi file với key là 'file' (fd.append('file', file))
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Không có file nào được tải lên' });
      return;
    }

    // Trả về đường dẫn để Frontend hiển thị
    // Ví dụ: /uploads/file-123456.jpg
    res.send({
      message: 'Image uploaded successfully',
      url: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;