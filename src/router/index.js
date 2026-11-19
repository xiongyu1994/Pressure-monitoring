// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/useAuthStore'

const routes = [
  {
    path: '/',
    redirect: '/home' // 默认打开哪个页面
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../page/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../page/Home.vue')
  },
  //测试
  {
    path: '/inspectionList',
    name: 'InspectionList',
    component: () => import('../page/InspectionList.vue')
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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局登录守卫：除 /login 外，所有页面都要求已登录
router.beforeEach((to) => {
  const auth = useAuthStore()
  const loggedIn = auth.checkSession()

  // 已登录时不再停留在登录页
  if (to.meta.public) {
    return loggedIn ? { path: '/home' } : true
  }

  if (!loggedIn) {
    return {
      path: '/login',
      query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : {}
    }
  }
  return true
})

export default router
