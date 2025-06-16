import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // 개발 환경에서는 base를 '/'로, 프로덕션에서는 '/youtubeToMusic/'로 설정
    base: mode === 'development' ? '/' : '/youtubeToMusic/',
    css: {
      postcss: './postcss.config.cjs',
    },
    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: false, // HMR 오버레이 비활성화
      },
    },
  }
})
