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
    const { username, password, email } = req.body;

    try {
        console.log('🔵 [registerUser] Bắt đầu đăng ký với:', { username, email });
        
        const userExists = await User.findOne({ name: username });

        if (userExists) {
            console.log('❌ [registerUser] User đã tồn tại:', username);
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        console.log('📝 [registerUser] Tạo user mới...');
        const user = await User.create({
            name: username,
            password: password,
            email: email,
            // role is defaulted to 'student' in the model
        });

        console.log('✅ [registerUser] User tạo thành công:', { _id: user._id, name: user.name, email: user.email });

        if (user) {
            const userData = user.toObject();
            delete (userData as any).password;
            
            const response = {
                ...userData,
                token: generateToken(String(user._id)),
            };
            
            console.log('📤 [registerUser] Trả về response:', { _id: response._id, name: response.name, email: response.email });
            res.status(201).json(response);
        } else {
            console.log('❌ [registerUser] Không thể tạo user');
            res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
        }
    } catch (error) {
        console.error('❌ [registerUser] Lỗi:', error);
        res.status(500).json({ message: 'Lỗi máy chủ', error: (error as any).message });
    }
};