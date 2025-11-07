# OnThiTHPT AI - Nền tảng Ôn thi THPT Full-Stack Tích hợp AI

## 📝 Tổng Quan Dự Án

**OnThiTHPT AI** là một ứng dụng web full-stack được xây dựng với React (frontend) và Node.js/Express (backend), mô phỏng một nền tảng ôn thi Tốt nghiệp Trung học Phổ thông thông minh, được trang bị Trí tuệ nhân tạo (AI) từ Google Gemini. Mục tiêu của dự án là cung cấp một môi trường học tập hiện đại, tương tác và hoàn chỉnh cho học sinh.

Khác với phiên bản demo ban đầu, dự án này đã được nâng cấp với một **backend thực sự**, sử dụng cơ sở dữ liệu MongoDB để quản lý người dùng, môn học, và câu hỏi một cách bền vững.

## ✨ Tính năng nổi bật

- 🔐 **Xác thực người dùng an toàn:** Đăng nhập và quản lý phiên làm việc thông qua JSON Web Tokens (JWT).
- 📚 **Quản lý dữ liệu động:** Ngân hàng câu hỏi và môn học được quản lý trong cơ sở dữ liệu MongoDB.
- 🧠 **Tạo đề thi bằng AI:** Sử dụng Google Gemini để tạo nhanh một bộ đề trắc nghiệm ngẫu nhiên.
- 🤖 **Gia sư AI 24/7:** Chatbot trợ lý giải thích chi tiết đáp án và kiến thức liên quan.
- 📊 **Thống kê trực quan:** Xem lại kết quả bài làm chi tiết với biểu đồ và giải thích cặn kẽ.
- ⏱️ **Thi thử tính giờ:** Trải nghiệm làm bài thi dưới áp lực thời gian thực.
- 👨‍💻 **Giao diện quản trị:** Trang quản trị mẫu để xem tổng quan và là nền tảng để phát triển các tính năng quản lý nội dung.

## 🚀 Công nghệ sử dụng

### Frontend

- **Framework:** React (v19)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router (`HashRouter`)
- **Quản lý trạng thái:** Zustand
- **Biểu đồ:** Recharts

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Ngôn ngữ:** TypeScript
- **Cơ sở dữ liệu:** MongoDB với Mongoose ODM
- **Xác thực:** JSON Web Tokens (JWT) & bcryptjs
- **Biến môi trường:** `dotenv`

### Dịch vụ ngoài

- **AI:** Google Gemini API (`@google/genai`)

## 📂 Cấu trúc Chi tiết và Giải thích File

Dự án được chia thành hai phần chính: `frontend` (mã nguồn trong thư mục `/src`) và `backend` (mã nguồn trong thư mục `/backend`).

---

### **Backend (`/backend`)**

Đây là nơi xử lý logic nghiệp vụ, giao tiếp với cơ sở dữ liệu và cung cấp API cho frontend. Nó hoạt động như "bộ não" của ứng dụng.

- `package.json`: Định nghĩa thông tin dự án, các gói phụ thuộc (dependencies) và các câu lệnh (scripts) như `dev` (để chạy server), `data:import` (để nạp dữ liệu mẫu).
- `.env.example`: File mẫu cho các biến môi trường. Bạn cần tạo một file `.env` dựa trên file này để cung cấp các thông tin nhạy cảm như chuỗi kết nối database, mã bí mật JWT.
- `tsconfig.json`: Cấu hình cho trình biên dịch TypeScript, chỉ định cách mã TS được chuyển đổi thành mã JS mà Node.js có thể chạy.
- **/src/server.ts**: **Trái tim của backend**. File này khởi tạo server Express, áp dụng các middleware (như CORS, express.json), kết nối tới database, liên kết các routes, và bắt đầu lắng nghe yêu cầu từ client.
- **/src/config/db.ts**: Chứa logic kết nối ứng dụng với cơ sở dữ liệu MongoDB bằng chuỗi kết nối từ file `.env`.
- **/src/models/**: Định nghĩa cấu trúc (Schema) của dữ liệu sẽ được lưu trong MongoDB.
  - `User.ts`: Định nghĩa schema cho người dùng, bao gồm cả middleware để tự động mã hóa mật khẩu trước khi lưu.
  - `Subject.ts`: Định nghĩa schema cho các môn học.
  - `Question.ts`: Định nghĩa schema cho các câu hỏi trong ngân hàng đề.
- **/src/controllers/**: Chứa toàn bộ logic xử lý cho mỗi yêu cầu. Khi một route được gọi, nó sẽ chuyển tiếp yêu cầu đến một hàm trong controller.
  - `authController.ts`: Xử lý logic đăng ký, đăng nhập, xác thực mật khẩu và tạo JWT token.
  - `subjectController.ts`: Xử lý logic để lấy danh sách môn học từ database.
  - `questionController.ts`: Xử lý logic để lấy câu hỏi theo từng môn học.
- **/src/routes/**: Định nghĩa các API endpoints (đường dẫn URL). Chúng ánh xạ một URL và một phương thức HTTP (GET, POST) tới một hàm xử lý cụ thể trong controller.
- **/src/data/**: Chứa các file dữ liệu mẫu (users, subjects, questions) để khởi tạo database.
- **/src/seeder.ts**: Một script tiện ích, không phải là một phần của ứng dụng chính. Nó được dùng để tự động nạp (hoặc xóa) dữ liệu mẫu vào database, giúp việc cài đặt môi trường phát triển lần đầu trở nên cực kỳ nhanh chóng.

---

### **Frontend (Thư mục gốc & `/src`)**

Đây là phần giao diện mà người dùng tương tác trực tiếp trên trình duyệt. Nó chịu trách nhiệm hiển thị dữ liệu và gửi yêu cầu của người dùng đến backend.

- `index.html`: File HTML gốc duy nhất của ứng dụng. Nó chứa thẻ `<div id="root"></div>` nơi toàn bộ ứng dụng React sẽ được "gắn" vào.
- **/src/index.tsx**: **Điểm khởi đầu của frontend**. File này tìm đến `div#root` và render component `App` vào đó, khởi chạy ứng dụng React.
- **/src/App.tsx**: Component gốc của ứng dụng. Nó thiết lập `HashRouter` để quản lý việc điều hướng trang và định nghĩa tất cả các routes chính (ví dụ: `/login`, `/dashboard`). Các component toàn cục như `Header` và `AITutor` cũng được đặt ở đây.
- **/src/pages/**: Mỗi file trong thư mục này đại diện cho một trang hoàn chỉnh của ứng dụng.
  - `LoginPage.tsx`: Chứa form đăng nhập, xử lý việc gọi API login đến backend và cập nhật trạng thái người dùng.
  - `DashboardPage.tsx`: Trang chính sau khi đăng nhập, hiển thị danh sách môn học.
  - `QuizPage.tsx`: Giao diện làm bài kiểm tra, quản lý câu hỏi, câu trả lời và đồng hồ đếm ngược.
- **/src/components/**: Chứa các thành phần giao diện nhỏ, có thể tái sử dụng trên nhiều trang.
  - `Header.tsx`: Thanh điều hướng trên cùng.
  - `Button.tsx`, `Card.tsx`, `Spinner.tsx`: Các khối xây dựng UI cơ bản.
  - `AITutor.tsx`: Chat-widget nổi, giao tiếp với Gemini API để cung cấp giải thích.
- **/src/services/**: Lớp giao tiếp với các dịch vụ bên ngoài (API).
  - `api.ts`: **Cầu nối quan trọng nhất với backend**. Nó tập trung tất cả các hàm `fetch` để gọi đến API của server Node.js. Việc này giúp mã nguồn ở các component gọn gàng hơn.
  - `geminiService.ts`: Tương tự `api.ts`, nhưng dành riêng cho việc giao tiếp với API của Google Gemini.
- **/src/store/**: Quản lý trạng thái toàn cục của ứng dụng bằng Zustand.
  - `useAuthStore.ts`: Lưu trữ thông tin người dùng và token JWT. Nó sử dụng middleware `persist` để lưu trạng thái vào `localStorage`, giúp người dùng không bị đăng xuất sau khi tải lại trang.
  - `useQuizStore.ts`: Quản lý trạng thái của phiên làm bài quiz hiện tại (danh sách câu hỏi, câu trả lời, kết quả...). Trạng thái này là tạm thời và sẽ được reset mỗi khi bắt đầu một bài quiz mới.
- **/src/hooks/**: Chứa các React hook tùy chỉnh để tái sử dụng logic.
  - `useTimer.ts`: Logic cho đồng hồ đếm ngược trong trang `QuizPage`.
- **/src/types.ts**: Nơi tập trung định nghĩa các kiểu dữ liệu TypeScript (`User`, `Question`...). Giúp đảm bảo tính nhất quán và giảm lỗi trong toàn bộ dự án.

## 🛠️ Cài đặt và Chạy dự án

### **Yêu cầu**

1. **Node.js và npm:** Cần thiết để chạy cả backend và frontend.
2. **MongoDB:** Bạn nên sử dụng một tài khoản miễn phí trên **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** (dịch vụ cloud) để tiện lợi nhất.
3. **Google AI Studio API Key:**
   * Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) để tạo API key.

### **Bước 1: Cài đặt Backend**

1. **Mở một terminal** và di chuyển vào thư mục `backend`:

   ```bash
   cd backend
   ```
2. **Cài đặt các gói phụ thuộc:**

   ```bash
   npm install
   ```
3. **Thiết lập MongoDB Atlas:**

   * Đăng ký tài khoản MongoDB Atlas, tạo một project và một cluster (chọn gói M0 miễn phí).
   * Trong mục **Database Access**, tạo một user và mật khẩu cho database.
   * Trong mục **Network Access**, thêm địa chỉ IP `0.0.0.0/0` để cho phép truy cập từ mọi nơi (hoặc thêm IP hiện tại của bạn).
   * Về lại trang **Database**, nhấn "Connect", chọn "Drivers", và sao chép chuỗi kết nối (Connection String).
4. **Tạo file biến môi trường:**

   * Trong thư mục `backend`, sao chép file `.env.example` thành file `.env`.
   * Mở file `.env` và cập nhật các giá trị:
     - `MONGO_URI`: Dán chuỗi kết nối bạn vừa sao chép từ MongoDB Atlas. **Nhớ thay `<password>` bằng mật khẩu database bạn đã tạo.**
     - `JWT_SECRET`: Thay bằng một chuỗi bí mật ngẫu nhiên của riêng bạn (ví dụ: `mysupersecretkey123`).
5. **Nạp dữ liệu mẫu vào Database (Bước quan trọng):**

   * Để ứng dụng có dữ liệu ban đầu (tài khoản, môn học, câu hỏi), hãy chạy lệnh sau trong terminal (vẫn ở thư mục `backend`):

   ```bash
   npm run data:import
   ```

   * Lệnh này sẽ xóa dữ liệu cũ và thêm vào dữ liệu mẫu. Bạn sẽ có sẵn 2 tài khoản:
     - Admin: `admin` / `adminpassword`
     - Student: `student` / `studentpassword`
6. **Chạy server backend:**

   ```bash
   npm run dev
   ```

   Server sẽ khởi động và chạy tại `http://localhost:5001`.

### **Bước 2: Chạy Frontend**

1. **Mở một terminal mới** (giữ cho terminal backend vẫn chạy) và đứng ở thư mục **gốc** của dự án.
2. **Thiết lập API Key cho Gemini:**
   * Ứng dụng được thiết kế để đọc API key từ biến môi trường `process.env.API_KEY`. Khi chạy trên các nền tảng như AI Studio, biến này sẽ được cung cấp tự động.
3. **Chạy server tĩnh cho frontend:**
   * Cài đặt `serve` nếu bạn chưa có:
     ```bash
     npm install 
     ```
   * Chạy server:
     ```bash
     npm run dev
     ```
4. **Truy cập ứng dụng:**
   * Mở trình duyệt và truy cập vào địa chỉ được `serve` cung cấp (thường là `http://localhost:3000`).
   * Frontend sẽ tự động kết nối đến backend đang chạy ở `http://localhost:5001`. Đăng nhập với một trong các tài khoản mẫu ở trên để bắt đầu!
     (Những lỗi cần chỉnh: Trang Xem chi tiết sẽ hiển thị là: Không có kết quả hiển thị nếu restart, bảng thông kê câu hỏi sẽ bị xóa khi reset fe và be)
