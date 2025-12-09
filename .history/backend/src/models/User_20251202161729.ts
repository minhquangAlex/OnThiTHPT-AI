import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  className: { type: String },
  school: { type: String },
  banned: { type: Boolean, default: false },
}, { timestamps: true });

// Middleware to hash password before saving a new user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  // 'this.password' is guaranteed to be a string here due to the required validator
  this.password = await bcrypt.hash(this.password!, salt);
});

// Method to compare entered password with the hashed password
// 'this' is the mongoose document; provide types for TS
userSchema.methods.matchPassword = async function (this: any, enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password!);
};

export const User = model<IUser>('User', userSchema);
