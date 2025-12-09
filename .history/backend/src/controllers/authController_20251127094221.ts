import { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// FIX: Use explicit Request and Response types from express to fix type errors.
export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ name: username });

        if (user && (await user.matchPassword(password))) {
            // 1. Chuyển mongoose document sang object thuần javascript
            const userData = user.toObject();
            
            // 2. Xóa mật khẩu để không lộ ra ngoài
            delete (userData as any).password; 

            // 3. Trả về toàn bộ data user (bao gồm email, class, school...) + token
            res.json({
                ...userData, 
                token: generateToken(String(user._id)),
            });
        } else {
            res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// FIX: Use explicit Request and Response types from express to fix type errors.
export const registerUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const userExists = await User.findOne({ name: username });

        if (userExists) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        const user = await User.create({
            name: username,
            password: password,
            // role is defaulted to 'student' in the model
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                role: user.role,
                token: generateToken(String(user._id)),
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};