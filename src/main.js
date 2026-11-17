import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router' 
const pinia = createPinia()
const app = createApp(App)
app.use(router) // 👈 使用路由
app.use(pinia) // 👈 挂载 Pinia
app.mount('#app')
