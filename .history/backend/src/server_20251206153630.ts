import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan'; // Import morgan để log request
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

// 1. Logger: Hiện log request ra terminal để debug
app.use(morgan('dev'));

// 2. CORS: Cấu hình mở rộng cho phép mọi nguồn (Frontend Cloudflare, Mobile...)
app.use(cors({
    origin: "*", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// 3. Body Parser: Tăng giới hạn lên 50MB để tránh lỗi khi gửi dữ liệu lớn
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- STATIC FILES (QUAN TRỌNG: SỬA ĐỔI) ---
// Sử dụng process.cwd() để lấy thư mục gốc của dự án backend (nơi chứa package.json)
// Sau đó nối với folder 'uploads'. Cách này an toàn nhất.
const uploadsPath = path.join(process.cwd(), 'uploads');

// Log ra đường dẫn để bạn kiểm tra xem nó trỏ đúng chưa (khi chạy npm run dev)
console.log('📂 Static files serving from:', uploadsPath);

app.use('/uploads', express.static(uploadsPath));

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

// --- ERROR HANDLING ---

// 1. Handle 404 (Not Found)
app.use((req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// 2. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 Server Error:', err.message);
    
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));