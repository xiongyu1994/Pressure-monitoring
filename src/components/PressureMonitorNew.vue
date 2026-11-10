<template>
  <div class="monitor-container">
    <!-- 顶部操作栏 -->
    <div class="header">
      <h2>压力实时监控系统</h2>
      <div class="address-switcher" data-html2canvas-ignore="true">
        <span>当前设备：</span>
        <button 
          v-for="addr in [1, 2, 3]" 
          :key="addr"
          class="addr-btn"
          :class="{ active: currentAddress === addr }"
          @click="switchAddress(addr)"
        >
          地址 {{ addr }}
        </button>
      </div>
      
    </div>
    <div class="actions">
        <!-- ⚠️ 新增：零点校准按钮 -->
        <button 
          class="action-btn calibrate-btn" 
          @click="handleCalibrate"
          :disabled="isCalibrating"
          data-html2canvas-ignore="true"
        >
          {{ isCalibrating ? '⏳ 校准中...' : '🎯 零点校准' }}
        </button>

         <!-- <n-button 
          type="primary" 
          :loading="isCalibrating"
          @click="handleCalibrate"
          data-html2canvas-ignore="true"
        >
          {{ isCalibrating ? '校准中...' : '🎯 零点校准' }}
        </n-button> -->

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



// 当前选中的传感器地址，默认 2
const currentAddress = ref(2)

// ================= 状态定义 =================
const wsUrl = 'ws://localhost:8080' 
const MAX_POINTS = 60 
const PRESSURE_MAX = 55 

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

// ⚠️ 新增：校准状态
const isCalibrating = ref(false)

// 格式化压力显示
const displayPressure = computed(() => pressure.value !== null ? pressure.value.toFixed(3) : '--')

const timeData = []
const pressureData = []



// 切换地址的方法
const switchAddress = (addr) => {
  if (currentAddress.value === addr) return // 如果点的还是当前地址，不处理
  
  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
    alert('WebSocket 未连接，无法切换！')
    return
  }

  // 更新当前地址
  currentAddress.value = addr
  
  // 发送指令给后端
  wsInstance.send(JSON.stringify({ action: 'switchAddress', address: addr }))
  
  // 清空当前图表数据，避免不同量程的数据混在一起
  timeData.length = 0
  pressureData.length = 0
  if (chartInstance) {
    chartInstance.setOption({ xAxis: { data: [] }, series: [{ data: [] }] })
  }
}

// ================= ⚠️ 新增：零点校准处理逻辑 =================
const handleCalibrate = () => {
  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
    alert('WebSocket 未连接，无法发送指令！')
    return
  }

  // 二次确认，防止误触
  // const confirmMsg = '确认执行零点校准吗？\n\n⚠️ 请务必确保当前传感器未受压（空载/通大气状态），否则校准后数据将严重偏差！'
  // if (!confirm(confirmMsg)) return

  // 更新按钮状态
  isCalibrating.value = true

  // 发送指令给 Node.js 后端
  wsInstance.send(JSON.stringify({ action: 'zeroCalibrate' }))
  
  // 设定一个超时机制，防止前端按钮一直卡住（后端返回成功/失败会提前解除）
  setTimeout(() => {
    if (isCalibrating.value) {
      isCalibrating.value = false
    }
  }, 5000)
}

// ================= 生成二维码逻辑 =================
const generateQRCode = async () => {
  try {
    const qrContent = `https://www.baidu.com`
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
    backgroundColor: '#000000',
    tooltip: { 
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#00FF00', type: 'dashed', opacity: 0.5 }
      },
    },
    legend: { show: false },
    grid: { left: '60px', right: '30px', bottom: '30px', top: '30px' },
    xAxis: {
      type: 'category',
      data: timeData,
      axisLine: { onZero: false, lineStyle: { color: '#00FF00', width: 1 } },
      axisTick: { inside: true, lineStyle: { color: '#00FF00' } },
      axisLabel: { color: '#00FF00', fontSize: 12 },
      splitLine: { show: false } 
    },
    yAxis: {
      type: 'value',
      name: '压力(MPa)',
      nameLocation: 'middle',
      nameGap: 45, 
      nameTextStyle: { color: '#00FF00', fontSize: 14 },
      axisLine: { show: true, lineStyle: { color: '#00FF00', width: 1 } },
      axisTick: { inside: true, lineStyle: { color: '#00FF00' } },
      axisLabel: { color: '#00FF00', formatter: (value) => value.toFixed(1) },
      splitLine: { show: true, lineStyle: { color: '#00FF00', type: 'solid', opacity: 0.3 } }
    },
    // yAxis: {
    //   type: 'value',
    //   name: '压力(MPa)',
    //   nameLocation: 'middle',
    //   nameGap: 45, 
    //   nameTextStyle: { color: '#00FF00', fontSize: 14 },
    //   // 👇 新增这两行，强制 Y 轴从 0 开始，且最大不超过 55
    //   min: 0, 
    //   max: PRESSURE_MAX, 
    //   axisLine: { show: true, lineStyle: { color: '#00FF00', width: 1 } },
    //   axisTick: { inside: true, lineStyle: { color: '#00FF00' } },
    //   axisLabel: { color: '#00FF00', formatter: (value) => value.toFixed(3) },
    //   splitLine: { show: true, lineStyle: { color: '#00FF00', type: 'solid', opacity: 0.3 } }
    // },
    animation: false, 
    series: [
      { 
        name: '压力', type: 'line', smooth: true, symbol: 'none', 
        lineStyle: { color: '#FF0000', width: 2 },
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
      scale: 2, useCORS: true, backgroundColor: '#f5f5f5' 
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
    gain.gain.value = 0.3
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

      // ⚠️ 新增：处理后端发来的系统提示信息（包括校准状态）
      if (d.type === 'msg') {
        console.log('系统消息:', d.message)
        // 如果包含“完成”或“失败”，解除校准按钮的锁定状态
        if (d.message.includes('完成') || d.message.includes('失败')) {
          isCalibrating.value = false
          alert(d.message) // 给用户弹窗提示结果
        }
        return; // 系统消息不参与图表和压力数据的处理，直接返回
      }
      
      // 接收 Node.js 传来的压力数据
      pressure.value = Number(d.pressure)
      isAlarm.value = d.warn
      alarmMsg.value = d.status
      currentTime.value = new Date().toLocaleString()
      
      if (d.warn) playBeep()

      timeData.push(timeData.length)
      pressureData.push(Number(d.pressure))
      
      if (timeData.length > MAX_POINTS) {
        timeData.shift()
        pressureData.shift()
      }
      const newXAxis = timeData.map((_, index) => index);
      if (chartInstance) {
        chartInstance.setOption({
          xAxis: { data: newXAxis  },
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

<style scoped lang="scss">
.monitor-container { padding: 20px; font-family: system-ui; background: #f5f5f5; min-height: 100vh; box-sizing: border-box;}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 {color:#000}
.actions { display: flex; gap: 10px; }
.action-btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.3s; color: white; }

/* ⚠️ 新增：校准按钮的样式 */
.calibrate-btn { background-color: #722ed1; }
.calibrate-btn:hover { background-color: #9254de; }
.calibrate-btn:disabled { background-color: #d3adf7; cursor: not-allowed; }

.pause-btn { background-color: #faad14; }
.pause-btn:hover { background-color: #ffc53d; }
.pause-btn.is-paused { background-color: #52c41a; }
.pause-btn.is-paused:hover { background-color: #73d13d; }
.export-btn { background-color: #1890ff; }
.export-btn:hover { background-color: #40a9ff; }
.export-btn:disabled { background-color: #ccc; cursor: not-allowed; }
.export-area { background: #f5f5f5; padding: 10px; }

/* 卡片样式 */
.panel { display: flex; gap: 20px; margin-bottom: 20px;color:gray; }
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

/* 报警时的卡片闪烁动画 */
@keyframes flash {
  from { background-color: #ff4d4f; }
  to { background-color: #ff7875; }
}

.address-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 20px;
  color: #333;
  font-weight: bold;
}
.addr-btn {
  padding: 6px 16px;
  border: 1px solid #1890ff;
  background: #fff;
  color: #1890ff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}
.addr-btn:hover {
  background: #e6f7ff;
}
.addr-btn.active {
  background: #1890ff;
  color: #fff;
}
</style>