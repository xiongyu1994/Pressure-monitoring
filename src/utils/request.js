// src/utils/request.js
import axios from 'axios'
import { createDiscreteApi } from 'naive-ui' // 如果你用了 Naive UI，可以用它来弹全局提示

// 如果你想用原生 alert 或者自己封装的弹窗，可以把上面这行删掉

// ================= 1. 创建实例 =================
const service = axios.create({
  // 基础路径，如果你的后端或者接口有固定前缀，可以在这里配置
  // 比如以后你改成了 HTTP 接口：baseURL: 'http://localhost:3000/api'
  baseURL: '/', 
  timeout: 5000, 
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// ================= 2. 请求拦截器 =================
service.interceptors.request.use(
  (config) => {
    // 每次发送请求前，可以在这里做些什么
    // 比如：如果有 Token，可以在这里统一加上 Token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`
    // }
    
    console.log(`[API Request] ${config.method.toUpperCase()} - ${config.url}`, config.data || config.params)
    return config
  },
  (error) => {
    console.error('请求发送失败:', error)
    return Promise.reject(error)
  }
)

// ================= 3. 响应拦截器 =================
service.interceptors.response.use(
  (response) => {
    // 这里可以对后端返回的数据进行解构和统一处理
    const res = response.data
    
    console.log(`[API Response] ${response.config.url}`, res)

    // ⚠️ 假设你的后端返回格式是：{ code: 200, data: {...}, message: 'success' }
    // 如果 code 不是 200，统一当做错误处理（具体看你的后端接口规范）
    // 如果你目前的 Node.js 后端只是随便返回数据，这一步可以暂时注释掉
    /*
    if (res.code !== 200) {
      // 比如：弹出一个全局错误提示
      window.$message?.error(res.message || '请求失败')
      // 如果是 401（未登录/Token过期），可以跳转登录页
      // if (res.code === 401) { ... }
      return Promise.reject(new Error(res.message || 'Error'))
    }
    */
   
    // 如果一切正常，直接返回数据部分，这样在组件里就不用一直写 res.data 了
    return res
  },
  (error) => {
    // 处理 HTTP 状态码错误、网络超时等
    let message = '网络请求异常'
    
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 400: message = '请求参数错误'; break
        case 401: message = '未授权，请重新登录'; break
        case 403: message = '拒绝访问'; break
        case 404: message = '请求的资源不存在'; break
        case 500: message = '服务器内部错误'; break
        default: message = `请求失败 (${status})`
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时，请稍后重试'
    }

    console.error('API 错误:', message, error)
    
    // ⚠️ 使用 Naive UI 的全局消息提醒（如果不用可以改成 alert）
    window.$message?.error(message)

    return Promise.reject(error)
  }
)

// ================= 4. 全局挂载（可选） =================
// 如果不用 Naive UI，可以用原生 alert，或者你自己封装的组件
if (typeof window !== 'undefined') {
  window.$message = createDiscreteApi(['message']).message
}

export default service