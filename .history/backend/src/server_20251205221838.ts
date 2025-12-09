import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan'; // 1. Import morgan để log request
import connectDB from './config/db';

// Import Routes
import attemptRoutes from './routes/attemptRoutes';
import authRoutes from './routes/authRoutes';
import questionRoutes from './routes/questionRoutes';
import statsRoutes from './routes/statsRoutes';
import subjectRoutes from './routes/subject_routes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// --- MIDDLEWARES ---

// 1. Logger: Hiện log request ra terminal (VD: GET /api/subjects 200 12ms)
// Giúp bạn biết frontend đang gọi vào đâu, có thành công không
app.use(morgan('dev'));

// 2. CORS: Cấu hình mở rộng
app.use(cors({
    origin: "*", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// 3. Body Parser: Tăng giới hạn lên 50MB để tránh lỗi khi gửi dữ liệu lớn (ảnh base64 hoặc bài thi dài)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- STATIC FILES (QUAN TRỌNG) ---
// File server.ts nằm ở: backend/src/server.ts
// Folder uploads nằm ở: backend/uploads
// => Đường dẫn đúng là: ../uploads (lùi ra 1 cấp từ src)
// Code cũ ../../uploads là lùi ra khỏi folder backend luôn (sai)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- ROUTES ---
app.get('/', (req: Request, res: Response) => {
  res.send('OnThiTHPT AI API is running...');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/upload', uploadRoutes);

// --- ERROR HANDLING (Xử lý lỗi tập trung) ---

// 1. Handle 404 (Nếu gọi sai đường dẫn API)
app.use((req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// 2. Global Error Handler (Bắt tất cả lỗi 500, lỗi code...)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 Server Error:', err.message); // In lỗi đỏ ra terminal
    
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Chỉ hiện stack trace khi dev
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));