// src/store/useAuthStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logoutApi } from '@/api/auth'

const STORAGE_KEY = 'pressure-monitor-auth'
const DEFAULT_SESSION_MS = 8 * 60 * 60 * 1000 // 本地模式默认 8 小时

function readStored() {
  if (typeof window === 'undefined') return null
  try {
    // 会话级优先，其次是"记住我"的长期存储
    const raw =
      window.sessionStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data.username || !data.expiresAt || data.expiresAt <= Date.now()) return null
    return data
  } catch {
    return null
  }
}

// Electron 以 file:// 加载页面时，部分环境下存储 API 可能不可用。
// 写入失败时退化为纯内存会话，不让登录流程中断。
function writeStored(storage, payload) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* 忽略存储异常 */
  }
}

function clearStored() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 忽略存储异常 */
  }
}

export const useAuthStore = defineStore('auth', () => {
  const cached = readStored()
  const username = ref(cached?.username || '')
  const displayName = ref(cached?.displayName || '')
  const token = ref(cached?.token || '')
  const deviceSn = ref(cached?.deviceSn || '')
  const expiresAt = ref(cached?.expiresAt || 0)

  const isLoggedIn = computed(
    () => Boolean(username.value) && expiresAt.value > Date.now()
  )

  // 每次路由跳转都会调用，顺带清掉过期会话
  const checkSession = () => {
    if (expiresAt.value && expiresAt.value <= Date.now()) logout()
    return isLoggedIn.value
  }

  const login = ({
    username: name,
    displayName: label,
    token: tk = '',
    deviceSn: sn = '',
    expiresIn,
    remember = false
  }) => {
    // 远程模式沿用后端下发的 expiresIn（C 端 7 天），本地模式用默认 8 小时
    const ttl = Number(expiresIn) > 0 ? Number(expiresIn) * 1000 : DEFAULT_SESSION_MS
    const payload = {
      username: name,
      displayName: label,
      token: tk,
      deviceSn: sn,
      expiresAt: Date.now() + ttl
    }
    username.value = payload.username
    displayName.value = payload.displayName
    token.value = payload.token
    deviceSn.value = payload.deviceSn
    expiresAt.value = payload.expiresAt

    // 先清干净，避免两种存储里残留旧会话
    clearStored()
    const storage = remember ? window.localStorage : window.sessionStorage
    writeStored(storage, payload)
  }

  const logout = () => {
    logoutApi(token.value) // 通知后端销毁 token，失败不阻塞本地登出
    username.value = ''
    displayName.value = ''
    token.value = ''
    deviceSn.value = ''
    expiresAt.value = 0
    clearStored()
  }

  return {
    username, displayName, token, deviceSn, expiresAt,
    isLoggedIn, checkSession, login, logout
  }
})
