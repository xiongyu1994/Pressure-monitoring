<template>
  <div class="monitor-container">
    <!-- 顶部操作栏 -->
    <div class="header">
      <!-- <h2>压力实时监控系统 (安全阀整定 {{ PRESSURE_MAX }}MPa)</h2> -->
       <h2>压力实时监控系统</h2>
      <div class="actions">
        <button 
          class="action-btn pause-btn" 
          :class="{ 'is-paused': isPaused }" 
          @click="togglePause"
          data-html2canvas-ignore="true"
        >
          {{ isPaused ? '▶ 恢复获取数据' : '⏸ 暂停获取数据' }}
        </button>
        
        <button 
          class="action-btn export-btn" 
          @click="exportToPDF" 
          :disabled="isExporting"
          data-html2canvas-ignore="true"
        >
          {{ isExporting ? '生成中...' : '📄 导出 PDF 报告' }}
        </button>
      </div>
    </div>
    
    <!-- 需要被导出的区域 -->
    <div class="export-area" ref="exportAreaRef">
      <!-- 数据卡片区 -->
      <div class="panel">
        <div class="card" :class="{ alarm: isAlarm }">
          <div>当前压力 (MPa) <span v-if="isPaused && !isExporting">(已暂停)</span></div>
          <div class="val">{{ displayPressure }}</div>
        </div>
        <div class="card" :class="{ alarm: isAlarm }">
          <div>设备状态</div>
          <div class="val">
            {{ (isPaused && !isExporting) ? '画面已冻结' : (isAlarm ? alarmMsg : '正常') }}
          </div>
        </div>
        <div class="card">
          <div>报告生成时间</div>
          <div class="val time-val">{{ currentTime }}</div>
        </div>
      </div>

      <!-- 图表容器 -->
      <div ref="chartRef" class="chart-box"></div>

      <!-- 报告底部信息与二维码区域 -->
      <div class="report-footer">
        <div class="qr-box">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="二维码" class="qr-img" />
          <p>扫码查看设备详情</p>
        </div>
        <div class="footer-text">
          <p>系统名称：压力智能监控平台</p>
          <p>设备编号：PRESSURE-DEV-001</p>
          <p>生成时间：{{ currentTime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

// ================= 状态定义 =================
const wsUrl = 'ws://localhost:8080' 
const MAX_POINTS = 60 
const PRESSURE_MAX = 55 // 与后端 Node.js 保持一致的报警阈值

const chartRef = ref(null) 
const exportAreaRef = ref(null) 
let chartInstance = null 
let wsInstance = null
let reconnectTimer = null

// 压力相关数据
const pressure = ref(null)
const isAlarm = ref(false)
const alarmMsg = ref('')
const currentTime = ref(new Date().toLocaleString())
const isExporting = ref(false) 
const isPaused = ref(false) 
const qrCodeUrl = ref('') 

// 格式化压力显示（保留3位小数，如果没数据则显示 --）
const displayPressure = computed(() => pressure.value !== null ? pressure.value.toFixed(3) : '--')

const timeData = []
const pressureData = []

// ================= 生成二维码逻辑 =================
const generateQRCode = async () => {
  try {
    const qrContent = `https://www.baidu.com` // 你可以替换成真实的设备后台链接
    qrCodeUrl.value = await QRCode.toDataURL(qrContent, {
      width: 120,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
  } catch (err) {
    console.error('生成二维码失败:', err)
  }
}

// ================= 切换暂停状态 =================
const togglePause = () => {
  isPaused.value = !isPaused.value
}

// ================= ECharts 初始化 =================
const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['压力(MPa)'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: timeData },
    yAxis: [
      { 
        type: 'value', 
        name: '压力(MPa)', 
        min: 0, 
        //max: 60, // 根据你的安全阀整定 55MPa 设定
        axisLabel: { formatter: '{value}' }
      }
    ],
    animation: false, 
    series: [
      { 
        name: '压力(MPa)', 
        type: 'line', 
        smooth: true, 
        itemStyle: { color: '#2196F3' }, 
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(33, 150, 243, 0.3)' },
            { offset: 1, color: 'rgba(33, 150, 243, 0.05)' }
          ])
        }, 
        data: pressureData 
      }
    ]
  }
  chartInstance.setOption(option)
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

// ================= PDF 导出核心逻辑 =================
const exportToPDF = async () => {
  if (!exportAreaRef.value) return
  isExporting.value = true 

  try {
    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = await html2canvas(exportAreaRef.value, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#f5f5f5' 
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight)
    pdf.save(`压力监控报告_${new Date().getTime()}.pdf`)
    
  } catch (error) {
    console.error('导出 PDF 失败:', error)
  } finally {
    isExporting.value = false 
  }
}

// ================= 声音报警 =================
let audioCtx = null
const playBeep = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = 800
    gain.gain.value = 0.3 // 压力报警声音稍微大一点
    osc.start()
    osc.stop(audioCtx.currentTime + 0.4)
  } catch (e) { console.warn(e) }
}

// ================= WebSocket 逻辑 =================
const connectWs = () => {
  wsInstance = new WebSocket(wsUrl)
  
  wsInstance.onmessage = (ev) => {
    try {
      if (isPaused.value) return; 
      
      const d = JSON.parse(ev.data)
      
      // 接收 Node.js 传来的压力数据
      pressure.value = Number(d.pressure)
      isAlarm.value = d.warn
      alarmMsg.value = d.status // 例如："超压报警"
      currentTime.value = new Date().toLocaleString()
      
      if (d.warn) playBeep()

      // 更新图表数据
      timeData.push(d.time)
      pressureData.push(Number(d.pressure))
      
      if (timeData.length > MAX_POINTS) {
        timeData.shift()
        pressureData.shift()
      }
      
      if (chartInstance) {
        chartInstance.setOption({
          xAxis: { data: timeData },
          series: [{ data: pressureData }]
        })
      }
    } catch (error) { console.error("解析数据失败:", error) }
  }

  wsInstance.onclose = () => {
    pressure.value = null; 
    isAlarm.value = true; 
    alarmMsg.value = 'WebSocket 连接断开'
    reconnectTimer = setTimeout(connectWs, 2000)
  }
}

onMounted(() => {
  initChart()
  connectWs()
  generateQRCode()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (wsInstance) { wsInstance.close(); wsInstance = null }
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
})
</script>

<style scoped>
/* 样式与之前的温湿度页面保持统一，只改了一点报警色调 */
.monitor-container { padding: 20px; font-family: system-ui; background: #f5f5f5; min-height: 100vh; box-sizing: border-box;}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 {color:#000}
.actions { display: flex; gap: 10px; }
.action-btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.3s; color: white; }
.pause-btn { background-color: #faad14; }
.pause-btn:hover { background-color: #ffc53d; }
.pause-btn.is-paused { background-color: #52c41a; }
.pause-btn.is-paused:hover { background-color: #73d13d; }
.export-btn { background-color: #1890ff; }
.export-btn:hover { background-color: #40a9ff; }
.export-btn:disabled { background-color: #ccc; cursor: not-allowed; }
.export-area { background: #f5f5f5; padding: 10px; }

/* 卡片样式 */
.panel { display: flex; gap: 20px; margin-bottom: 20px; color:gray;}
.card { padding: 16px; border: 1px solid #eee; background: #fff; border-radius: 8px; min-width: 160px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card.alarm { background: #ff4d4f; color: #fff; border-color: #ff4d4f; animation: flash 1s infinite alternate; }
.val { font-size: 32px; font-weight: bold; margin-top: 8px; }
.time-val { font-size: 16px; margin-top: 14px; }

/* 图表容器 */
.chart-box { width: 100%; height: 400px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box; }

/* 报告底部样式 */
.report-footer { margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.qr-box { text-align: center; color: #666; font-size: 14px; }
.qr-img { width: 120px; height: 120px; display: block; margin-bottom: 8px; }
.footer-text { text-align: right; color: #666; font-size: 14px; line-height: 1.8; }

/* 报警时的卡片闪烁动画（增强警示效果） */
@keyframes flash {
  from { background-color: #ff4d4f; }
  to { background-color: #ff7875; }
}
</style>