// src/api/auth.js
// 登录校验层 + C 端接口统一请求入口，两种模式自动切换：
//
//  远程模式：在项目根目录 .env.local 配置 VITE_API_BASE 后启用，例如
//      VITE_API_BASE=http://localhost/inspection-api
//  走「C 端（校验设备操作员）」接口，与后台管理系统 admin-system 共用同一套 PHP 后端。
//  协议（见 admin-system/api/controllers/capi.php 与 api/index.php）：
//      POST /c/login  { account, password, deviceSn? }
//      POST /c/logout （需 token）
//      响应 { code: 0, message: 'ok', data: { token, expiresIn, name, account, deviceSn } }
//      鉴权头 Authorization: Bearer <token>，另带 Token 头兼容 phpstudy CGI 模式
//
//  本地模式（默认）：未配置 VITE_API_BASE 时用下面的本地账号，方便离线调试。
//  后端就绪后只要补上 .env.local，登录页 / 路由守卫 / store 都无需改动。

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

export const isRemoteAuth = Boolean(API_BASE)
export const authApiBase = API_BASE

const LOCAL_ACCOUNTS = [
  { username: 'admin', password: 'admin123', displayName: '系统管理员' },
  { username: 'operator', password: '123456', displayName: '操作员' }
]

const LOCAL_SESSION_SECONDS = 8 * 60 * 60

// 统一请求：自动带鉴权头；伪静态失效（404 且非 JSON）时按后端约定退回 index.php?s= 重试
async function request(method, path, { params = {}, payload = null, token = '' } = {}) {
  if (!API_BASE) throw new Error('未配置后端接口地址（VITE_API_BASE）')

  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = 'Bearer ' + token
    headers.Token = token
  }

  const route = path.replace(/^\//, '')
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  const send = (url) =>
    fetch(url, {
      method,
      headers,
      body: payload === null ? undefined : JSON.stringify(payload)
    })

  let res = await send(`${API_BASE}/${route}${query ? `?${query}` : ''}`)
  if (res.status === 404 && !(res.headers.get('content-type') || '').includes('application/json')) {
    res = await send(`${API_BASE}/index.php?s=${route}${query ? `&${query}` : ''}`)
  }

  const json = await res.json().catch(() => ({ code: -1, message: '响应解析失败' }))
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

// 供各业务模块调用的 C 端接口方法（token 由调用方从 auth store 传入）
export function apiGet(path, params = {}, token = '') {
  return request('GET', path, { params, token })
}

export function apiPost(path, payload = {}, token = '') {
  return request('POST', path, { payload, token })
}

export async function loginApi({ username, password }) {
  // 远程模式：C 端登录（c_user 账号体系，与 B 端权限隔离）
  if (isRemoteAuth) {
    const data = await apiPost('/c/login', {
      account: String(username).trim(),
      password: String(password)
    })
    return {
      username: data.account,
      displayName: data.name || data.account,
      token: data.token,
      expiresIn: data.expiresIn,
      deviceSn: data.deviceSn
    }
  }

  // 本地模式：模拟一次请求，让按钮加载态可见
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const account = LOCAL_ACCOUNTS.find(
        (item) => item.username === username.trim() && item.password === password
      )
      if (!account) {
        reject(new Error('用户名或密码错误'))
        return
      }
      resolve({
        username: account.username,
        displayName: account.displayName,
        token: '',
        expiresIn: LOCAL_SESSION_SECONDS,
        deviceSn: ''
      })
    }, 400)
  })
}

export async function logoutApi(token) {
  if (!isRemoteAuth || !token) return
  try {
    await apiPost('/c/logout', {}, token)
  } catch {
    // 后端不可达或 token 已过期时，不阻塞本地登出
  }
}
