// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home' // 默认打开哪个页面
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../page/home.vue')
  },
  {
    path: '/pressure-industrial',
    name: 'PressureIndustrial',
    component: () => import('../components/PressureMonitorNew.vue')
  },
  {
    path: '/pressure',
    name: 'Pressure',
    component: () => import('../components/PressureMonitor.vue')
  },
  
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router