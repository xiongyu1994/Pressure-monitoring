// src/api/device.js
import request from '@/utils/request' // 引入你刚才封装的 axios 实例
/**
 * 获取设备配置信息 (GET 请求)
 * @param {Object} params - 查询参数对象，例如 { id: 1 }
 * @returns {Promise}
 */
export function getDeviceConfig(params) {
  return request({
    url: '/api/device/config', // 接口地址
    method: 'get',
    params: params             // params 会作为 URL 查询字符串拼接 (如 ?id=1)
  })
}

/**
 * 更新设备信息 (POST 请求)
 * @param {Object} data - 提交的数据体
 * @returns {Promise}
 */
export function updateDevice(data) {
  return request({
    url: '/api/device/update',
    method: 'post',
    data: data                 // data 会作为请求体发送 (JSON 格式)
  })
}

/**
 * 获取历史报警记录 (GET 请求，带路径参数示例)
 * @param {Number} deviceId 
 * @returns {Promise}
 */
export function getAlarmHistory(deviceId) {
  return request({
    url: `/api/device/${deviceId}/alarms`, // 直接把参数拼在路径里
    method: 'get'
  })
}