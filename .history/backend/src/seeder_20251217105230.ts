import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import readline from 'readline';

// Import Models
import { User } from './models/User';
import { Subject } from './models/Subject';
import { Question } from './models/Question';

// Import Data
import { users } from './data/users';
import { subjects } from './data/subjects';
import { questions } from './data/questions';

dotenv.config();

// --- HÀM HỎI ĐÁP TERMINAL ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

// --- HÀM XÁC THỰC ADMIN ---
const authenticateAdmin = async (): Promise<boolean> => {
  console.log('\n🔒 HỆ THỐNG YÊU CẦU XÁC THỰC QUYỀN ADMIN');
  console.log('-------------------------------------------');
  
  try {
    const username = await askQuestion('👤 Nhập tên Admin (username): ');
    const password = await askQuestion('🔑 Nhập mật khẩu: ');

    // Tìm user trong DB
    const user = await User.findOne({ name: username });

    if (!user) {
      console.error('\n❌ Lỗi: Tài khoản không tồn tại!');
      return false;
    }

    // Kiểm tra mật khẩu (Sử dụng method matchPassword trong User Model)
    // Lưu ý: User Model của bạn phải có method matchPassword
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.error('\n❌ Lỗi: Sai mật khẩu!');
      return false;
    }

    // Kiểm tra quyền Admin
    if (user.role !== 'admin') {
      console.error('\n❌ Lỗi: Tài khoản này không có quyền Admin (role: ' + user.role + ')');
      return false;
    }

    console.log('\n✅ Xác thực thành công! Xin chào ' + user.name);
    return true;

  } catch (error) {
    console.error('Lỗi xác thực:', error);
    return false;
  }
};

// --- HÀM CẬP NHẬT DỮ LIỆU (KHÔNG MẤT DỮ LIỆU CŨ) ---
const importData = async () => {
  try {
    // Gọi hàm xác thực trước khi chạy
    const isAuthenticated = await authenticateAdmin();
    if (!isAuthenticated) {
        console.log('⛔ Hủy bỏ quá trình cập nhật.');
        process.exit(1);
    }

    console.log('\n🔄 Đang bắt đầu cập nhật dữ liệu...');

    // 1. CẬP NHẬT USERS (Bỏ qua nếu đã có)
    for (const user of users) {
      const userExists = await User.findOne({ email: user.email });
      if (!userExists) {
        await User.create(user);
        console.log(`   + User mới: ${user.name}`);
      }
    }

    // 2. CẬP NHẬT SUBJECTS (Upsert)
    for (const subject of subjects) {
      await Subject.updateOne(
        { slug: subject.slug },
        { $set: subject },
        { upsert: true }
      );
    }
    console.log('   ✓ Đã đồng bộ Subjects.');

    // 3. CẬP NHẬT CÂU HỎI
    const allSubjects = await Subject.find({});
    const subjectSlugToIdMap = new Map(
      allSubjects.map(subject => [subject.slug, subject._id])
    );

    let questionsAdded = 0;
    for (const qData of questions) {
      const { subjectSlug, ...rest } = qData as any;
      const subjectId = subjectSlugToIdMap.get(subjectSlug);

      if (subjectId) {
        // Kiểm tra trùng lặp dựa trên nội dung câu hỏi
        const exists = await Question.findOne({ subjectId, questionText: rest.questionText });
        if (!exists) {
            // Chỉ thêm nếu câu hỏi có trường type (để đảm bảo chuẩn mới)
            // Nếu data cũ không có type, bạn có thể set default tại đây
            const payload = { 
                ...rest, 
                subjectId,
                type: rest.type || 'multiple_choice' // Default cho câu hỏi cũ
            };
            await Question.create(payload);
            questionsAdded++;
        }
      }
    }
    console.log(`   + Đã thêm ${questionsAdded} câu hỏi mới.`);

    console.log('\n✅ CẬP NHẬT HOÀN TẤT!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

// --- HÀM XÓA DỮ LIỆU (DÙNG CHO DEV - CẦN CỜ -d) ---
const destroyData = async () => {
  try {
    const isAuthenticated = await authenticateAdmin();
    if (!isAuthenticated) process.exit(1);

    // Hỏi xác nhận lần 2 cho chắc
    const confirm = await askQuestion('\n⚠️  CẢNH BÁO: Bạn đang xóa sạch Database! Gõ "YES" để xác nhận: ');
    if (confirm !== 'YES') {
        console.log('Hủy bỏ thao tác xóa.');
        process.exit();
    }

    await Subject.deleteMany();
    await Question.deleteMany();
    // await User.deleteMany(); // Có thể giữ lại User để đỡ phải tạo lại Admin
    // await Attempt.deleteMany();

    console.log('🔥 Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

// Main Execution
(async () => {
    // Kết nối DB trước khi làm bất cứ điều gì
    await connectDB();

    if (process.argv[2] === '-d') {
        destroyData();
    } else {
        importData();
    }
})();