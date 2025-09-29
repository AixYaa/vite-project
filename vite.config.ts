import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { viteMockServe } from "vite-plugin-mock";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    viteMockServe({
      mockPath: "./src/mock", // 设置模拟.ts 文件的存储文件夹
      enable: false, // 关闭 mock，接入真实后端
    }),

  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 8899,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/uploads':{
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  }
})
