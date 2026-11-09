<template>
  <div class="monitor-container">
    <!-- 顶部操作栏 -->
    <div class="header">
      <h2>温湿度实时监控 (ECharts 版)</h2>
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
          <div>温度 ℃ <span v-if="isPaused && !isExporting">(已暂停)</span></div>
          <div class="val">{{ displayTemp }}</div>
        </div>
        <div class="card" :class="{ alarm: isAlarm }">
          <div>湿度 %RH <span v-if="isPaused && !isExporting">(已暂停)</span></div>
          <div class="val">{{ displayHum }}</div>
        </div>
        <div class="card" :class="{ alarm: isAlarm }">
          <div>状态</div>
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

      <!-- 👇 新增：报告底部信息与二维码区域 (跟随报告一起被截图) -->
      <div class="report-footer">
        <div class="qr-box">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="二维码" class="qr-img" />
          <p>扫码查看设备详情</p>
        </div>
        <div class="footer-text">
          <p>系统名称：温湿度智能监控平台</p>
          <p>设备编号：DEV-001 </p>
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
import QRCode from 'qrcode' // 👈 引入二维码库

// ================= 状态定义 =================
// ... (保持你之前的配置不变)
const wsUrl = 'ws://localhost:8080' 
const MAX_POINTS = 60 

const chartRef = ref(null) 
const exportAreaRef = ref(null) 
let chartInstance = null 
let wsInstance = null
let reconnectTimer = null

const temp = ref(null)
const hum = ref(null)
const isAlarm = ref(false)
const alarmMsg = ref('')
const currentTime = ref(new Date().toLocaleString())
const isExporting = ref(false) 
const isPaused = ref(false) 
const qrCodeUrl = ref('') // 👈 存储生成的二维码 Base64 数据

const displayTemp = computed(() => temp.value !== null ? temp.value.toFixed(1) : '--')
const displayHum = computed(() => hum.value !== null ? hum.value.toFixed(1) : '--')

const timeData = []
const tempData = []
const humData = []

// ================= 生成二维码逻辑 =================
const generateQRCode = async () => {
  try {
    // 这里可以放你想让用户扫码后访问的链接，或者设备信息。
    // 这里用当前时间戳做个示例
    // const qrContent = `设备:DEV-001, 时间:${new Date().getTime()}`
    const qrContent = `https://www.baidu.com`
    // 生成 Base64 格式的图片
    qrCodeUrl.value = await QRCode.toDataURL(qrContent, {
      width: 120, // 图片宽度
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
// ... (保持原样)
const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度', '湿度'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: timeData },
    yAxis: [
      { type: 'value', name: '温度(℃)', min: 0, max: 50 },
      { type: 'value', name: '湿度(%)', min: 0, max: 100 }
    ],
    animation: false, 
    series: [
      { name: '温度', type: 'line', smooth: true, yAxisIndex: 0, itemStyle: { color: '#f5222d' }, areaStyle: { color: 'rgba(245, 34, 45, 0.1)' }, data: tempData },
      { name: '湿度', type: 'line', smooth: true, yAxisIndex: 1, itemStyle: { color: '#1890ff' }, areaStyle: { color: 'rgba(24, 144, 255, 0.1)' }, data: humData }
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

    // 截图范围现在是 exportAreaRef，包含了仪表盘和底部二维码区域
    const canvas = await html2canvas(exportAreaRef.value, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#f5f5f5' 
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    
    // 按比例计算高度
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    // 添加图片到 PDF 中 (注意边距)
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight)
    pdf.save(`温湿度监控报告_${new Date().getTime()}.pdf`)
    
  } catch (error) {
    console.error('导出 PDF 失败:', error)
  } finally {
    isExporting.value = false 
  }
}

// ================= 声音报警 =================
// ... (保持原样)
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
    gain.gain.value = 0.15
    osc.start()
    osc.stop(audioCtx.currentTime + 0.3)
  } catch (e) { console.warn(e) }
}

// ================= WebSocket 逻辑 =================
// ... (保持原样)
const connectWs = () => {
  wsInstance = new WebSocket(wsUrl)
  wsInstance.onmessage = (ev) => {
    try {
      if (isPaused.value) return; 
      const d = JSON.parse(ev.data)
      temp.value = d.temp
      hum.value = d.hum
      isAlarm.value = d.isAlarm
      alarmMsg.value = d.alarmMsg
      currentTime.value = new Date().toLocaleString()
      
      if (d.isAlarm) playBeep()

      timeData.push(d.time)
      tempData.push(d.temp)
      humData.push(d.hum)
      
      if (timeData.length > MAX_POINTS) {
        timeData.shift(); tempData.shift(); humData.shift()
      }
      
      if (chartInstance) {
        chartInstance.setOption({
          xAxis: { data: timeData },
          series: [{ data: tempData }, { data: humData }]
        })
      }
    } catch (error) { console.error(error) }
  }

  wsInstance.onclose = () => {
    temp.value = null; hum.value = null; isAlarm.value = true; alarmMsg.value = '连接断开'
    reconnectTimer = setTimeout(connectWs, 2000)
  }
}

onMounted(() => {
  initChart()
  connectWs()
  generateQRCode() // 👈 页面加载时生成一次二维码
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (wsInstance) { wsInstance.close(); wsInstance = null }
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
})
</script>

<style scoped>
/* 原有样式保持不变 */
.monitor-container { padding: 20px; font-family: system-ui; background: #f5f5f5; min-height: 100vh;box-sizing: border-box; }
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
.panel { display: flex; gap: 20px; margin-bottom: 20px; color:gray;}
.card { padding: 16px; border: 1px solid #eee; background: #fff; border-radius: 8px; min-width: 140px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card.alarm { background: #ff4d4f; color: #fff; border-color: #ff4d4f; }
.val { font-size: 28px; font-weight: bold; margin-top: 8px; }
.time-val { font-size: 16px; margin-top: 14px; }
.chart-box { width: 100%; height: 400px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box; }

/* 👇 新增：报告底部样式 */
.report-footer {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.qr-box {
  text-align: center;
  color: #666;
  font-size: 14px;
}
.qr-img {
  width: 120px;
  height: 120px;
  display: block;
  margin-bottom: 8px;
}
.footer-text {
  text-align: right;
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}
</style>