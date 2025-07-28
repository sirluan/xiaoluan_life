import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://hbnosrbblngd.sealoshzh.site',
        changeOrigin: true,
        secure: false,
        // 如果后端接口没有 /api 前缀，取消注释下面一行
        // rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
