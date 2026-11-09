<template>
  <div class="monitor-container">
    <h2>温湿度实时监控</h2>
    
    <!-- 数据卡片区 -->
    <div class="panel">
      <div class="card" :class="{ alarm: isAlarm }">
        <div>温度 ℃</div>
        <div class="val">{{ displayTemp }}</div>
      </div>
      <div class="card" :class="{ alarm: isAlarm }">
        <div>湿度 %RH</div>
        <div class="val">{{ displayHum }}</div>
      </div>
      <div class="card" :class="{ alarm: isAlarm }">
        <div>状态</div>
        <div class="val">{{ isAlarm ? alarmMsg : '正常' }}</div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-box">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Chart from 'chart.js/auto'

// ================= 状态定义 =================
const wsUrl = 'ws://localhost:8080' 
const MAX_POINTS = 60

const chartCanvas = ref(null) // 获取 canvas DOM 元素
let chartInstance = null // 保存 Chart 实例
let wsInstance = null // 保存 WebSocket 实例
let reconnectTimer = null // 重连定时器

// 响应式数据
const temp = ref(null)
const hum = ref(null)
const isAlarm = ref(false)
const alarmMsg = ref('')

// 格式化显示数据
const displayTemp = computed(() => temp.value !== null ? temp.value.toFixed(1) : '--')
const displayHum = computed(() => hum.value !== null ? hum.value.toFixed(1) : '--')

// 图表数据数组
const labels = []
const tempData = []
const humData = []

// ================= 图表初始化 =================
const initChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: '温度 ℃', data: tempData, borderColor: '#f5222d', fill: false },
        { label: '湿度 %RH', data: humData, borderColor: '#1890ff', fill: false }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      animation: false // 关闭动画，防止频繁刷新卡顿
    }
  })
}

// ================= 声音报警 =================
let audioCtx = null
const playBeep = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    // 如果浏览器静音了，尝试恢复
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = 800
    gain.gain.value = 0.15
    osc.start()
    osc.stop(audioCtx.currentTime + 0.3)
  } catch (e) {
    console.warn("播放报警音失败:", e)
  }
}

// ================= WebSocket 逻辑 =================
const connectWs = () => {
  wsInstance = new WebSocket(wsUrl)

  wsInstance.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data)
      
      // 1. 更新响应式变量（视图自动更新）
      temp.value = d.temp
      hum.value = d.hum
      isAlarm.value = d.isAlarm
      alarmMsg.value = d.alarmMsg
      
      if (d.isAlarm) playBeep()

      // 2. 更新图表数据
      labels.push(d.time)
      tempData.push(d.temp)
      humData.push(d.hum)
      
      // 保持长度，超出则移除旧数据
      if (labels.length > MAX_POINTS) {
        labels.shift()
        tempData.shift()
        humData.shift()
      }
      
      // 刷新图表
      if (chartInstance) {
        chartInstance.update()
      }
    } catch (error) {
      console.error("数据解析失败:", error)
    }
  }

  wsInstance.onclose = () => {
    console.log("WebSocket 断开，尝试重连...")
    // 断开时清空状态
    temp.value = null
    hum.value = null
    isAlarm.value = true
    alarmMsg.value = '连接断开'
    
    // 2秒后重连
    reconnectTimer = setTimeout(connectWs, 2000)
  }
}

// ================= 生命周期钩子 =================
onMounted(() => {
  initChart()
  connectWs()
})

// 组件销毁前清理资源，防止内存泄漏
onUnmounted(() => {
  if (wsInstance) {
    wsInstance.close()
    wsInstance = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<style scoped>
.monitor-container {
  padding: 20px;
  font-family: system-ui;
  box-sizing: border-box;
}
h2 {
  color:#000;
}
.panel {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  color:gray;
}

.card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  min-width: 140px;
  transition: all 0.3s ease; /* 增加颜色过渡 */
}

.card.alarm {
  background: #ff4d4f;
  color: #fff;
  border-color: #ff4d4f;
}

.val {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}

.chart-box {
  height: 400px;
  position: relative; /* Chart.js 需要相对定位容器 */
}
</style>