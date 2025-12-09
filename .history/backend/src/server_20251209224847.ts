import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan';
import fs from 'fs'; // <--- Import thêm cái này để check file
import connectDB from './config/db';

// ... (Giữ nguyên các import Routes của bạn)
import attemptRoutes from './routes/attemptRoutes';
import authRoutes from './routes/authRoutes';
import questionRoutes from './routes/questionRoutes';
import statsRoutes from './routes/statsRoutes';
import subjectRoutes from './routes/subject_routes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();
connectDB();

const app = express();

app.use(morgan('dev'));
app.use(cors({
     origin: [
        "http://localhost:5173",
        "https://onthithpt-ai-frontend.onrender.com" // 👇 THÊM LINK FRONTEND CỦA BẠN VÀO ĐÂY
    ],
     credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }
    ));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- PHẦN DEBUG QUAN TRỌNG: KIỂM TRA ĐƯỜNG DẪN ẢNH ---

const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('--------------------------------------------------');
console.log('📂 SERVER KHỞI ĐỘNG - ĐƯỜNG DẪN THƯ MỤC UPLOADS:');
console.log('👉', uploadsPath);
console.log('--------------------------------------------------');

// Middleware chặn các request gọi vào /uploads để kiểm tra xem file có tồn tại không
app.use('/uploads', (req, res, next) => {
    // Giải mã URL (đề phòng tên file có dấu cách %20)
    const decodedUrl = decodeURIComponent(req.path);
    // Đường dẫn file thực tế trên máy tính
    const actualFilePath = path.join(uploadsPath, decodedUrl);

    console.log(`\n📸 [DEBUG ẢNH] Request: ${req.path}`);
    console.log(`   🔍 Server đang tìm file tại: ${actualFilePath}`);

    if (fs.existsSync(actualFilePath)) {
        console.log('   ✅ TÌM THẤY FILE TRÊN Ổ CỨNG. Đang gửi về...');
        next(); // File có tồn tại, chuyển cho express.static xử lý
    } else {
        console.log('   ❌ KHÔNG TÌM THẤY FILE TRÊN Ổ CỨNG!');
        console.log('   💡 Gợi ý: Kiểm tra xem trong folder backend/uploads có file này không?');
        // Không tìm thấy thì không next() nữa mà trả lỗi luôn để biết
        res.status(404).send('File not found on server disk'); 
    }
});

// Cấu hình static folder sau khi đã qua lớp kiểm tra ở trên
app.use('/uploads', express.static(uploadsPath));

// -------------------------------------------------------

app.get('/', (req: Request, res: Response) => {
  res.send('OnThiTHPT AI API is running...');
});

// ... (Giữ nguyên các Routes khác của bạn)
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/upload', uploadRoutes);

// ... (Giữ nguyên Error Handlers)
app.use((req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 Server Error:', err.message);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));