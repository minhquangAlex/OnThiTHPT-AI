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
  },
  // 👇 THÊM ĐOẠN CẤU HÌNH HMR NÀY VÀO:
  hmr: {
        protocol: 'wss', // Bắt buộc dùng wss (WebSocket Secure) vì localtunnel là https
        clientPort: 443, // Localtunnel chạy qua cổng 443
        host: 'onthithpt-web-admin.loca.lt', // Điền đúng tên miền subdomain bạn đang dùng
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