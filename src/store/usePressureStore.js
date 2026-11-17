// src/store/usePressureStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePressureStore = defineStore('pressure', () => {
  // ================= 状态定义 =================
  
  // 设备相关
  const currentAddress = ref(2)
  
  // 实时压力数据
  const pressure = ref(null)
  const isAlarm = ref(false)
  const alarmMsg = ref('')
  const currentTime = ref(new Date().toLocaleString())
  
  // 界面控制
  const isPaused = ref(false)
  const isCalibrating = ref(false)
  const isExporting = ref(false)
  
  // 历史数据图表相关
  const MAX_POINTS = 100
  const pressureData = ref([]) // 使用 ref 使其具备响应式
  
  // WebSocket 实例 (不放在响应式里，避免被代理，一般放在 Store 外面或普通变量)
  let wsInstance = null

  // ================= 方法定义 =================

  // 切换设备地址
  const switchAddress = (addr) => {
    if (currentAddress.value === addr) return
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      alert('WebSocket 未连接，无法切换！')
      return
    }
    currentAddress.value = addr
    wsInstance.send(JSON.stringify({ action: 'switchAddress', address: addr }))
    pressureData.value = [] // 清空图表数据
  }

  // 发送校准指令
  const calibrate = () => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return
    isCalibrating.value = true
    wsInstance.send(JSON.stringify({ action: 'zeroCalibrate' }))
    setTimeout(() => { isCalibrating.value = false }, 5000)
  }

  // 处理接收到的数据 (由外部组件调用)
  const updatePressureData = (data) => {
    let rawPressure = Number(data.pressure)
    if (rawPressure < 0) rawPressure = 0

    pressure.value = rawPressure
    isAlarm.value = data.warn
    alarmMsg.value = data.status
    currentTime.value = new Date().toLocaleString()

    if (pressureData.value.length >= MAX_POINTS) {
      pressureData.value.length = 0 // 满 100 重新开始
    }
    pressureData.value.push(rawPressure)
  }

  // 设置 WebSocket 实例引用（在组件中连接 WS 后传入）
  const setWsInstance = (ws) => {
    wsInstance = ws
  }

  return {
    currentAddress, pressure, isAlarm, alarmMsg, currentTime,
    isPaused, isCalibrating, isExporting, pressureData, MAX_POINTS,
    switchAddress, calibrate, updatePressureData, setWsInstance
  }
})