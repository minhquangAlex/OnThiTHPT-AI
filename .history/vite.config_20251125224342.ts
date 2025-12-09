import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập qua IP mạng LAN
    port: 5173, // Cố định cổng (tùy chọn)
    allowedHosts: true,
    // 👇 THÊM ĐOẠN CẤU HÌNH HMR NÀY VÀO:
    hmr: {
        clientPort: 443, // Chỉ cần dòng này là đủ để Vite hiểu chạy qua HTTPS
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
})