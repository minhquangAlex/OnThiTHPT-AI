import { Request, Response } from 'express';
import { User } from '../models/User';

// GET /api/users?search=&page=1&limit=20
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const q = String(search || '').trim();

    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ users, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách người dùng' });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// POST /api/users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, password, role = 'student' } = req.body;
    const exists = await User.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });

    const user = await User.create({ name, password, role });
    res.status(201).json({ _id: user._id, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo người dùng' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const requester = (req as any).user;
    // allow only admin or the owner to update
    if (!requester || (requester.role !== 'admin' && String(requester._id) !== String(user._id))) {
      return res.status(403).json({ message: 'Không có quyền cập nhật người dùng này' });
    }

    const { name, role, email, className, school } = req.body;
    if (name) user.name = name;
    if (email !== undefined) user.email = email;
    if (className !== undefined) user.className = className;
    if (school !== undefined) user.school = school;
    // only admin can change role
    if (role && requester.role === 'admin') user.role = role;

    await user.save();
    // Trả về user đã cập nhật, không trả password
    const updatedUser = user.toObject();
    delete updatedUser.password;
    res.json({ message: 'Cập nhật thành công', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật người dùng' });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    await user.deleteOne();
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
  }
};

// POST /api/users/:id/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const requester = (req as any).user;
    if (!requester || (requester.role !== 'admin' && String(requester._id) !== String(user._id))) {
      return res.status(403).json({ message: 'Không có quyền đặt lại mật khẩu cho người dùng này' });
    }

    user.password = req.body.password;
    await user.save();
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi reset mật khẩu' });
  }
};
