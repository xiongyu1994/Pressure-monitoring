// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/pressure-industrial' // 默认打开哪个页面
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
  {
    path: '/temperature',
    name: 'Temperature',
    component: () => import('../components/TemperatureMonitor.vue')
  },
  {
    path: '/echarts-demo',
    name: 'EchartDemo',
    component: () => import('../components/EhartMonitor.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router