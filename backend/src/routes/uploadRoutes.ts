import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer storage to backend/uploads
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req: any, file: any, cb: any) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

// POST /api/upload - single file upload
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  const r: any = req as any;
  if (!r.file) return res.status(400).json({ message: 'No file uploaded' });
  // Return the public URL to access the file
  const fileUrl = `/uploads/${r.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;
