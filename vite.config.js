import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'
import path from 'path' // 需要引入 path 模块

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
     AutoImport({
      imports: ['vue'],
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 将 @ 指向 src 目录
    }
  },
  base: './', 
  
  
})
