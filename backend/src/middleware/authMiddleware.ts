import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ message: 'Không hợp lệ' });
      req.user = user;
      return next();
    }
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Không có quyền (admin required)' });
};
