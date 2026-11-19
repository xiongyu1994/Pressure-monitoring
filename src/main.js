import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia) // 先挂载 Pinia，路由守卫里才能安全调用 useAuthStore()
app.use(router) // 👈 使用路由
app.mount('#app')
