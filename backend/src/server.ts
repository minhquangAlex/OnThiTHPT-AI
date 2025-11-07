import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import connectDB from './config/db';
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

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the request body

// Simple root route
// FIX: Add explicit types for req and res to ensure correct type inference.
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
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
// Upload route
app.use('/api/upload', uploadRoutes);


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));