<template>
  <div class="monitor-container">
    <!-- 顶部操作栏 -->
    <!-- <div class="header">
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
      
    </div> -->
    <!-- <div class="actions">
        <button 
          class="action-btn calibrate-btn" 
          @click="handleCalibrate"
          :disabled="isCalibrating"
          data-html2canvas-ignore="true"
        >
          {{ isCalibrating ? '⏳ 校准中...' : '🎯 零点校准' }}
        </button>
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
      </div> -->
    

    <!-- 降压密封模式：顶部操作条 -->
    <div v-if="mode === 'seal'" class="seal-top">
      <div class="seal-live">
        <span class="live-label">实时压力MPa</span>
        <span class="live-val">{{ displayPressure }}</span>
      </div>
      <div class="seal-target">密封试验压力：{{ fmt(task?.tightnessPress) }}</div>
      <n-button type="primary" class="seal-start-btn" @click="toggleSeal">{{ sealRunning ? '停止' : '开始' }}</n-button>
      <div class="seal-rate">降压速率：{{ rateText }} MPa/s</div>
      <div class="seal-inspector">
        <span class="inspector-label">校验员</span>
        <span class="inspector-name">{{ auth.displayName || auth.username || '--' }}</span>
      </div>
    </div>

    <div class="export-area" ref="exportAreaRef">
      <!-- 当前压力标题：降压密封模式下隐藏（顶部已有橙色实时压力块） -->
      <n-space v-if="mode !== 'seal'" align="center">
       <h3 style="color:#000">当前压力 (MPa) <span v-if="isPaused && !isExporting">(已暂停)</span></h3>
       <p style="color:#2b5aa5;font-size:24px;font-weight: bold;">{{ displayPressure }}</p>
       <span v-if="curveProgressText" class="curve-progress">{{ curveProgressText }}</span>
       <span v-if="mode === 'setPressure'" class="rise-rate">升压速率：{{ riseRateText }} MPa/s</span>
      </n-space>
      <!-- <div>当前压力 (MPa) <span v-if="isPaused && !isExporting">(已暂停)</span></div>
      <div class="val">{{ displayPressure }}</div> -->
     
      <!-- <div class="panel">
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
      </div> -->

      <!-- 图表容器 + 右侧安全阀信息面板 -->
      <div class="chart-row">
        <div ref="chartRef" class="chart-box"></div>

        <!-- 已开始整定（有任务）即显示信息面板；降压密封模式有独立的上下操作条，不显示面板 -->
        <aside v-if="task && mode !== 'seal'" class="info-panel">
          <div class="panel-title">安全阀信息</div>
          <div class="info-rows">
            <div class="info-row"><span class="label">校验编号</span><span class="value">{{ task.orderCode || '--' }}</span></div>
            <div class="info-row"><span class="label">公称通径 (mm)</span><span class="value">{{ fmt(task.diameterNominal) }}</span></div>
            <div class="info-row"><span class="label">要求整定压力 (MPa)</span><span class="value">{{ fmt(task.setPress) }}</span></div>
            <div class="info-row"><span class="label">密封压力 (MPa)</span><span class="value">{{ fmt(task.tightnessPress) }}</span></div>
          </div>

          <div class="panel-section">整定压力合格范围 (MPa)</div>
          <div class="range-value">{{ qualifiedRange }}</div>

          <div class="panel-section">推荐压力表量程 (MPa)</div>
          <div class="gauge-rows">
            <div class="info-row"><span class="label">推荐量程</span><span class="value">{{ gaugeRange }}</span></div>
            <div class="info-row"><span class="label">安装通道</span><span class="value">第 {{ effectiveChannelNo }} 通道</span></div>
          </div>

          <div class="panel-section">适用校验座及夹紧力</div>
          <div
            v-for="seat in seatOptions"
            :key="seat.name"
            class="seat-row"
            :class="{ active: seat.applicable }"
          >
            <span class="seat-name">{{ seat.name }}</span>
            <span class="seat-force">夹紧力要求：{{ seat.force }} MPa</span>
          </div>
        </aside>
      </div>

      <!-- 报告底部信息与二维码区域 -->
      <!-- <div class="report-footer">
        <div class="qr-box">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="二维码" class="qr-img" />
          <p>扫码查看设备详情</p>
        </div>
        <div class="footer-text">
          <p>系统名称：压力智能监控平台</p>
          <p>设备编号：PRESSURE-DEV-001</p>
          <p>生成时间：{{ currentTime }}</p>
        </div>
      </div> -->
    </div>

    <!-- 降压密封模式：底部统计条 -->
    <div v-if="mode === 'seal'" class="seal-bottom">
      <div class="sb-item">
        <div class="sb-label">开始压力<span class="sb-unit">MPa</span></div>
        <div class="sb-val">{{ sealStartText }}</div>
      </div>
      <div class="sb-item">
        <div class="sb-label">密封时间</div>
        <div class="sb-val">{{ sealTimeText }}</div>
      </div>
      <div class="sb-item">
        <div class="sb-label sb-drop">压降<span class="sb-unit">MPa</span></div>
        <div class="sb-val">{{ sealDropText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'



// 当前选中的传感器地址，默认 2
const currentAddress = ref(2)

// ================= 状态定义 =================
const wsUrl = 'ws://localhost:8080' 
const MAX_POINTS = 100
const PRESSURE_MAX = 55
// Y 轴自适应：压力接近 0 时 Y 轴固定 -0.2 ~ 1，曲线落在刚离开底轴的位置（约 1/6 高度）
const NEAR_ZERO_THRESHOLD = 1
const Y_MIN_NEGATIVE = -0.2
const NEAR_ZERO_AXIS_MAX = 1 

const chartRef = ref(null)
const exportAreaRef = ref(null)
let chartInstance = null
let wsInstance = null
let reconnectTimer = null
let resizeObserver = null

// ================= 安全阀信息面板（选中任务后显示） =================
const props = defineProps({
  // TaskListModal「开始整定」传出的整条任务行（/c/task/list 数据）
  task: { type: Object, default: null },
  // 页面模式：'' 常规整定 | 'seal' 降压密封
  mode: { type: String, default: '' }
})

import { useAuthStore } from '@/store/useAuthStore'
const auth = useAuthStore()

// 数值展示：空值显示 --
const fmt = (val) => (val === null || val === undefined || val === '' ? '--' : val)

// 整定压力合格范围：整定压力 ±3%（GB/T 12243 惯例，与校验台软件一致，可按需调整）
const qualifiedRange = computed(() => {
  const p = Number(props.task?.setPress)
  if (!Number.isFinite(p) || p <= 0) return '--'
  return `${(p * 0.97).toFixed(3)} ~ ${(p * 1.03).toFixed(3)}`
})

// 合格范围数值边界
const qualifiedLow = computed(() => {
  const p = Number(props.task?.setPress)
  return Number.isFinite(p) && p > 0 ? p * 0.97 : null
})
const qualifiedHigh = computed(() => {
  const p = Number(props.task?.setPress)
  return Number.isFinite(p) && p > 0 ? p * 1.03 : null
})

// ================= 整定压力判定 =================
const emit = defineEmits(['peak-change', 'curves-change'])

// 整定压力 = 曲线一段时间内压力的最大值（当前任务累计峰值，任务切换或重新校验时清零）
const peakPressure = ref(null)

// 判定结果：峰值超出合格范围上限 → fail（不合格）；落在范围内 → pass（合格）；未达下限或无数据 → none（待判定）
const verdict = computed(() => {
  const peak = peakPressure.value
  const low = qualifiedLow.value
  const high = qualifiedHigh.value
  if (peak === null || low === null) return 'none'
  if (peak > high) return 'fail'
  if (peak >= low) return 'pass'
  return 'none'
})

// 峰值/判定结果上报给 Home（底部按钮条染色显示）
watchEffect(() => {
  emit('peak-change', { peak: peakPressure.value, verdict: verdict.value })
})

// ================= 曲线记录抓取 =================
// 抓取逻辑：压力升到峰值并明确回落 → 判定为一次峰值，达到峰值抓取一次，每个校验单号总共抓取 3 次。
// 曲线窗口（按操作设置弹窗的「记录」区间）：
//   峰值前：从「开始」阈值（% 按本次实测峰值折算，MPa 为直接值）上穿到峰值
//   峰值后：再记录「结束」设定时长（% → 起录→峰值时间 × value%；MPa → 压力回落到该值即止）
//   生成曲线数据时拉伸重采样铺满 0~100，峰值居中，全程无断点
import { useSettingsStore, RANGE_CHANNELS, resolveEffectiveChannel } from '@/store/useSettingsStore'
const settingsStore = useSettingsStore()

const CURVE_COUNT = 3   // 每个校验单号总共抓取 3 次曲线记录
const REC_CENTER = 50   // 峰值在 0~100 显示缓冲区中的居中位置
const PEAK_EPS = 0.01   // 判定“明确回落”的最小压差，过滤峰值平台期的抖动

const capturePhase = ref('idle') // idle 等待峰值 | capturing 峰值后记录中 | done 已抓满
const curves = ref([])           // 当前校验单号已抓取的曲线记录（1~3 条）
// 注意：抓取完全在后台进行，图表始终显示实时扫描曲线，不做任何切换/清屏，
// 抓到的记录只存入 curves 供「预览」弹窗展示，实时曲线走势不受抓取影响。

let sampleLog = []          // 采样日志 {t, p}：滚动保留，峰值触发后回溯抓取窗口
let waveMax = -Infinity     // 当前上升段的峰值
let waveMaxTime = 0         // 峰值出现时刻
let lastPeakValue = null    // 上一次已抓取的峰值（重新武装：需先回落到其开始阈值以下）
let needRearm = false       // 抓取完成后等待压力回落再武装下一次峰值检测
let awaitRise = true        // 等待压力上升：避免把回落段误判为峰值
let prevSampleP = null      // 上一采样值（判断升降）
let pendingStartTime = 0    // 本次窗口起点（上穿开始阈值的时刻）
let pendingRiseSec = 0      // 起录→峰值时长（秒），用于计算峰值后记录时长
let recSamples = []         // 本次记录的窗口采样
let recPeak = -Infinity
let recPeakIdx = -1         // 峰值在窗口采样中的序号（用于居中）

// 把本次记录的采样拉伸重采样进 0~100 显示缓冲区：曲线铺满整个横轴不断开，峰值对齐中央位置。
// 左段（起录→峰值）映射到 0~50，右段（峰值→结束）映射到 50~100，段内按比例线性插值。
const buildCenteredCurve = () => {
  const out = new Array(BUFFER_LEN).fill(null)
  const n = recSamples.length
  if (!n) return out
  const peakIdx = Math.min(Math.max(recPeakIdx, 0), n - 1)
  for (let slot = 0; slot <= MAX_POINTS; slot++) {
    let idx
    if (slot <= REC_CENTER) {
      idx = peakIdx === 0 ? 0 : (slot / REC_CENTER) * peakIdx
    } else {
      const rightLen = n - 1 - peakIdx
      idx = rightLen <= 0 ? n - 1 : peakIdx + ((slot - REC_CENTER) / (MAX_POINTS - REC_CENTER)) * rightLen
    }
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    const v = lo === hi ? recSamples[lo] : recSamples[lo] + (recSamples[hi] - recSamples[lo]) * (idx - lo)
    out[slot] = Math.round(v * 1000) / 1000
  }
  return out
}

// 完成一次抓取：窗口采样拉伸铺满 0~100（峰值居中），存入该单号的记录列表。
// 不切换图表——实时扫描曲线继续跑，记录数据仅供预览弹窗使用。
const finishRecord = () => {
  // 窗口采样：起点 → 当前（含峰值后段），峰值序号取窗口内最大值位置
  recSamples = sampleLog.filter((s) => s.t >= pendingStartTime).map((s) => s.p)
  if (!recSamples.length) return
  recPeakIdx = recSamples.reduce((mi, p, i) => (p > recSamples[mi] ? i : mi), 0)
  recPeak = recSamples[recPeakIdx]
  const points = buildCenteredCurve()
  curves.value = [...curves.value, {
    no: curves.value.length + 1,              // 第几次曲线记录（1~3）
    orderCode: props.task?.orderCode || '',   // 校验编号
    peak: recPeak,                            // 本次峰值
    points,                                   // 峰值居中、铺满全宽的曲线数据（0~100）
    startTime: pendingStartTime,
    endTime: Date.now()
  }]
  emit('curves-change', { orderCode: props.task?.orderCode, curves: curves.value })
  capturePhase.value = curves.value.length >= CURVE_COUNT ? 'done' : 'idle'
  // 重新武装：记录本次峰值，等压力回落到其「开始」阈值以下后再检测下一次峰值
  lastPeakValue = recPeak
  needRearm = true
  waveMax = -Infinity
  awaitRise = true
  prevSampleP = null
}

// 每个压力采样驱动抓取状态机：达到峰值抓取一次
const processCapture = (rawPressure) => {
  if (!props.task || props.mode !== 'setPressure') return
  if (capturePhase.value === 'done') return
  const now = Date.now()
  sampleLog.push({ t: now, p: rawPressure })
  if (sampleLog.length > 1200) sampleLog.splice(0, sampleLog.length - 1200)

  // 峰值后窗口：按「结束」设定继续记录，到时生成曲线数据
  if (capturePhase.value === 'capturing') {
    const r = settingsStore.record
    let finished = false
    if (r.endUnit === '%') {
      const postSec = (now - waveMaxTime) / 1000
      finished = pendingRiseSec > 0 && postSec >= pendingRiseSec * Number(r.endValue) / 100
    } else {
      // MPa 模式：压力回落到该值即结束
      finished = rawPressure <= Number(r.endValue)
    }
    if (finished) finishRecord()
    prevSampleP = rawPressure
    return
  }

  // 重新武装：上次抓取后，压力需先回落到其「开始」阈值以下，才检测下一次峰值
  if (needRearm) {
    const r = settingsStore.record
    const v = Number(r.startValue)
    const thr = r.startUnit === '%' ? (lastPeakValue ?? 0) * v / 100 : v
    if (Number.isFinite(v) && rawPressure < thr) {
      needRearm = false
      prevSampleP = rawPressure
    }
    return
  }

  // 等待压力上升：从回落段底部重新出现升势后，才开始峰值跟踪（避免把回落段误判为峰值）
  if (awaitRise) {
    if (prevSampleP !== null && rawPressure > prevSampleP) {
      awaitRise = false
      waveMax = rawPressure
      waveMaxTime = now
    }
    prevSampleP = rawPressure
    return
  }

  // 峰值跟踪：上升/持平刷新最大值；明确回落 → 峰值确认，触发一次抓取
  if (rawPressure >= waveMax) {
    waveMax = rawPressure
    waveMaxTime = now
  } else if (rawPressure < waveMax - PEAK_EPS) {
    triggerCapture()
  }
  prevSampleP = rawPressure
}

// 峰值确认 → 开始一次抓取：回溯「开始」阈值上穿时刻作为窗口起点。
// 纯后台记录：不触碰图表缓冲区，实时扫描曲线照常绘制，走势不会被打断。
const triggerCapture = () => {
  const r = settingsStore.record
  const v = Number(r.startValue)
  if (!Number.isFinite(v) || v <= 0) return
  const thr = r.startUnit === '%' ? waveMax * v / 100 : v
  // 从峰值时刻往回找最后一个低于阈值的采样 → 其后即上穿时刻
  let startTime = null
  for (let i = sampleLog.length - 1; i >= 0; i--) {
    const s = sampleLog[i]
    if (s.t > waveMaxTime) continue
    if (s.p < thr) {
      startTime = sampleLog[Math.min(i + 1, sampleLog.length - 1)].t
      break
    }
    if (i === 0) startTime = s.t // 缓冲区内一直高于阈值，取最早一条
  }
  if (startTime === null) return

  pendingStartTime = startTime
  pendingRiseSec = Math.max((waveMaxTime - startTime) / 1000, 0.5)
  capturePhase.value = 'capturing'
}

// 「重新校验」勾选删除后调用：删掉指定次数的曲线记录，剩余记录重新编号，
// 并恢复抓取状态机——自动继续抓取补齐，直到该单号重新满 CURVE_COUNT 条（全删则重新抓 3 次）
const deleteCurves = (nos) => {
  const del = new Set(nos)
  if (!del.size) return
  curves.value = curves.value
    .filter((c) => !del.has(c.no))
    .map((c, i) => ({ ...c, no: i + 1 })) // 重新编号：删除第一次后，原第二/三次变为第一/二次
  emit('curves-change', { orderCode: props.task?.orderCode, curves: curves.value })
  // 恢复抓取：回到等待峰值状态，压力重新出现升势并达到峰值后即补抓下一条
  capturePhase.value = 'idle'
  needRearm = false
  awaitRise = true
  prevSampleP = null
  waveMax = -Infinity
}

// 进度提示文案
const curveProgressText = computed(() => {
  if (!props.task || props.mode !== 'setPressure') return ''
  if (curves.value.length >= CURVE_COUNT) return `曲线记录已完成 ${CURVE_COUNT} 次`
  const next = curves.value.length + 1
  return capturePhase.value === 'capturing'
    ? `曲线记录：第 ${next} 次记录中`
    : `曲线记录：等待第 ${next} 次抓取`
})

// 切换任务：该单号的曲线记录清零重新抓取
watch(() => props.task, () => {
  curves.value = []
  capturePhase.value = 'idle'
  sampleLog = []
  waveMax = -Infinity
  lastPeakValue = null
  needRearm = false
  awaitRise = true
  prevSampleP = null
})
// 切走整定模式：取消进行中的抓取（已抓取完成的曲线保留）
watch(() => props.mode, (m) => {
  if (m !== 'setPressure' && capturePhase.value === 'capturing') {
    capturePhase.value = 'idle'
    waveMax = -Infinity
    if (lastPeakValue !== null) needRearm = true
    awaitRise = true
    prevSampleP = null
  }
})

// 任务切换时清零峰值，重新判定
watch(() => props.task, () => { peakPressure.value = null })

// 供「重新校验」调用：清零峰值重新记录
const resetPeak = () => { peakPressure.value = null }
defineExpose({ resetPeak, deleteCurves })

// ================= 降压密封模式 =================
const sealRunning = ref(false)          // 密封试验进行中
const sealStartPressure = ref(null)     // 开始压力（点开始时的实时压力）
const sealStartAt = ref(0)              // 开始时间戳
const sealElapsed = ref(0)              // 密封时间（秒）
const pressureRate = ref(0)             // 降压速率 MPa/s（滑动平滑）
let ratePrevPressure = null             // 上一采样点压力
let ratePrevTime = 0                    // 上一采样点时间
let sealTimer = null

// 开始/停止密封试验
const toggleSeal = () => {
  if (!sealRunning.value) {
    sealStartPressure.value = pressure.value ?? 0
    sealStartAt.value = Date.now()
    sealElapsed.value = 0
    sealRunning.value = true
    sealTimer = setInterval(() => {
      sealElapsed.value = (Date.now() - sealStartAt.value) / 1000
    }, 500)
  } else {
    stopSeal(false)
  }
}

const stopSeal = (reset = true) => {
  sealRunning.value = false
  if (sealTimer) { clearInterval(sealTimer); sealTimer = null }
  if (reset) {
    sealStartPressure.value = null
    sealElapsed.value = 0
    pressureRate.value = 0
    ratePrevPressure = null
  }
}

// 模式切走或任务切换时复位密封试验
watch(() => props.mode, (m) => { if (m !== 'seal') stopSeal(true) })
watch(() => props.task, () => { stopSeal(true) })

// 开始压力
const sealStartText = computed(() => sealStartPressure.value === null ? '--' : sealStartPressure.value.toFixed(2))
// 密封时间：分'秒
const sealTimeText = computed(() => {
  const total = Math.floor(sealElapsed.value)
  return `${Math.floor(total / 60)}'${total % 60}`
})
// 压降 = 开始压力 - 当前压力
const sealDropText = computed(() => {
  if (sealStartPressure.value === null || pressure.value === null) return '--'
  const drop = sealStartPressure.value - pressure.value
  return (drop >= 0 ? drop : 0).toFixed(2)
})
// 降压速率：带符号两位小数
const rateText = computed(() => {
  const r = pressureRate.value
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)}`
})

// 升压速率（整定压力模式）：复用平滑后的压力变化率，升压时为正值，降压时归零显示
const riseRateText = computed(() => Math.max(pressureRate.value, 0).toFixed(2))

// 生效量程档位序号（1~5）：统一使用 store 的选档规则（手动→所选档位；自动→按压力级别范围选最小覆盖档）
const effectiveChannelNo = computed(() =>
  resolveEffectiveChannel(settingsStore.autoRange, settingsStore.rangeChannel, props.task?.pressClassRangeMax)
)

// Y 轴上限（量程值 MPa）：由生效量程档位决定；档位无效时返回 null，Y 轴上限自适应
const fixedRangeMax = computed(() => {
  const ch = RANGE_CHANNELS.find((c) => c.no === effectiveChannelNo.value)
  return ch ? ch.value : null
})

// 构造 Y 轴双轴配置（仿压力表盘刻度样式）：
//   主轴：范围 5 等分 → 6 个主刻度（0、1/5、2/5…满量程），带标签和网格线
//   副轴：同一范围 25 等分 → 每个主刻度间画 4 个小刻度线，无标签、无网格
const buildYAxisPair = (minVal, maxVal) => {
  const span = maxVal - minVal
  const majorInterval = span / 5
  // 标签小数位按主刻度间隔自适应，保证各刻度值不重复（3.2→1位，0.32→2位…）
  const stepStr = String(majorInterval)
  const dot = stepStr.indexOf('.')
  const decimals = dot === -1 ? 0 : Math.min(stepStr.length - dot - 1, 3)
  const major = {
    type: 'value',
    name: '压力(MPa)',
    nameLocation: 'middle',
    nameGap: 45,
    nameTextStyle: { color: '#00FF00', fontSize: 14 },
    position: 'left',
    min: minVal,
    max: maxVal,
    interval: majorInterval,
    axisLine: { show: true, lineStyle: { color: '#00FF00', width: 1 } },
    axisTick: { show: true, inside: true, length: 6, lineStyle: { color: '#00FF00' } },
    axisLabel: { color: '#00FF00', formatter: (v) => v.toFixed(decimals) },
    splitLine: { show: true, lineStyle: { color: '#00FF00', type: 'solid', opacity: 0.3 } }
  }
  const minor = {
    type: 'value',
    position: 'left', // 与主轴同侧：小刻度画在最左边
    min: minVal,
    max: maxVal,
    interval: span / 25,
    axisLine: { show: false },
    axisTick: { show: true, inside: true, length: 3, lineStyle: { color: '#00FF00' } },
    axisLabel: { show: false },
    splitLine: { show: false }
  }
  return [major, minor]
}

// 推荐压力表量程：取标准量程序列中最小的 ≥ 整定压力×2 的量程
const GAUGE_RANGES = [0.4, 0.6, 1, 1.6, 2.5, 4, 6, 10, 16, 25, 40, 60]
// 推荐压力表量程：与当前生效的量程档位一致（和 Y 轴上限同一条规则）
// 自动量程 → 按任务压力级别范围选档（0.50~0.70 → 0 ~ 1.6）；手动量程 → 所选档位（量程2 → 0 ~ 4）
// 无生效档位时退回“整定压力×2 选最小覆盖档”的规则
const gaugeRange = computed(() => {
  const eff = fixedRangeMax.value
  if (eff !== null) return `0 ~ ${eff}`
  const p = Number(props.task?.setPress)
  if (!Number.isFinite(p) || p <= 0) return '--'
  const need = p * 2
  const found = GAUGE_RANGES.find((r) => r >= need)
  return `0 ~ ${found ?? GAUGE_RANGES[GAUGE_RANGES.length - 1]}`
})

// 校验座分类与夹紧力要求（与校验台软件一致）：按流道直径 seatSize 判定适用座
const SEAT_RULES = [
  { name: '小口径座', force: '1.00', max: 20 },
  { name: '中口径座', force: '0.50', max: 50 },
  { name: '大口径座', force: '4.00', max: Infinity }
]
const seatOptions = computed(() => {
  const s = Number(props.task?.seatSize)
  const idx = Number.isFinite(s)
    ? SEAT_RULES.findIndex((r) => s <= r.max)
    : -1
  return SEAT_RULES.map((r, i) => ({ ...r, applicable: i === idx }))
})

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
const displayPressure = computed(() => pressure.value !== null ? pressure.value.toFixed(2) : '--')

const timeData = []
const pressureData = []
// ================= 示波器扫描式绘图缓冲区 =================
// 横坐标固定 0~100：曲线从 0 画到 100 后，清空旧曲线、从 0 的位置重新开始绘制。
// 未画到的位置为 null（不绘制），因此曲线从左往右生长。
const BUFFER_LEN = MAX_POINTS + 1        // 0~100 共 101 个位置
const chartBuffer = new Array(BUFFER_LEN).fill(null)
let samplePos = 0                        // 下一个写入位置（= 当前横坐标）



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
  chartBuffer.fill(null) // 清空扫描缓冲区，从 0 重新开始绘制
  samplePos = 0
  if (chartInstance) {
    chartInstance.setOption({ xAxis: { data: Array.from({ length: BUFFER_LEN }, (_, i) => i) }, series: [{ data: chartBuffer }] })
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
      // 👇 关键：初始化时直接把 X 轴写死为 0 到 19 的数组
      data: Array.from({ length: MAX_POINTS + 1  }, (_, i) => i),
      boundaryGap: false,
      axisLine: { onZero: false, lineStyle: { color: '#00FF00', width: 1 } },
      axisTick: { 
       show: true,         // 确保显示刻度线
        inside: true,       // 刻度朝内
        alignWithLabel: true, // 让刻度线对准数字
        interval: 0,        // 👈 核心：0 代表强制显示所有（0~100）的刻度线
        lineStyle: { 
          color: '#00FF00',
          //length: 5 // 如果你觉得密集，可以改短一点，默认是 5
        } 

      },
      axisLabel: { 
        color: '#00FF00', 
        fontSize: 12,
        interval: 9, // 每隔一个显示（0, 2, 4... 18）
      },
      splitLine: { show: false },
      // 👇 关键：强制锁定显示范围，不管有没有数据，刻度都在
      min: 0,
      max: MAX_POINTS 
    },
    // Y 轴：主刻度 6 个 + 主刻度间小刻度（压力表盘式），实际范围随量程/数据动态更新
    yAxis: buildYAxisPair(0, 10),
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
        data: chartBuffer
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

      let rawPressure = Number(d.pressure)
      // if (rawPressure < 0) rawPressure = 0 // 防止负压漂移


      pressure.value = rawPressure  //Number(d.pressure)

      // 累计当前任务的整定压力峰值（曲线一段时间内的最大值）
      if (peakPressure.value === null || rawPressure > peakPressure.value) {
        peakPressure.value = rawPressure
      }

      // 降压速率：相邻采样点压差/时间差，滑动平均平滑（密封模式展示）
      {
        const nowT = Date.now()
        if (ratePrevPressure !== null && nowT > ratePrevTime) {
          const inst = (rawPressure - ratePrevPressure) / ((nowT - ratePrevTime) / 1000)
          pressureRate.value = pressureRate.value * 0.7 + inst * 0.3
        }
        ratePrevPressure = rawPressure
        ratePrevTime = nowT
      }

      // 曲线记录抓取状态机（按操作设置记录区间，每个校验单号抓 3 次）
      processCapture(rawPressure)

      isAlarm.value = d.warn
      alarmMsg.value = d.status
      currentTime.value = new Date().toLocaleString()
      
      if (d.warn) playBeep()

      // timeData.push(timeData.length)
      // pressureData.push(Number(d.pressure))
      // if (timeData.length > MAX_POINTS) {
      //   timeData.shift()
      //   pressureData.shift()
      // }

      // 示波器扫描式写入：曲线画到横坐标 100 后回到 0 的位置重新开始（先清空旧曲线）
      // 抓取在后台进行，不干预图表绘制，实时曲线走势始终连续
      chartBuffer[samplePos] = rawPressure
      samplePos++
      if (samplePos >= BUFFER_LEN) {
        chartBuffer.fill(null) // 一轮画满，清空旧曲线
        samplePos = 0          // 从 0 的位置重新开始
      }

      if (chartInstance) {
        // Y 轴范围（三种情况都给定明确的 min/max，保证主刻度 6 个 + 主刻度间小刻度）：
        // 1) 量程生效（手动档位或自动量程按压力级别选档）→ 0 ~ 量程值（如量程2 → 4 MPa）
        // 2) 自动量程且压力一直在 0 左右（窗口内最大值 < 1 MPa）→ 固定 -0.2 ~ 1，曲线落在刚离开底轴的位置
        // 3) 自动量程高压且无任务量程 → 0 ~ 窗口最大值×1.2（向上取一位小数）
        const fixedMax = fixedRangeMax.value
        let yAxisPair
        if (fixedMax !== null) {
          yAxisPair = buildYAxisPair(0, fixedMax)
        } else {
          const windowMax = Math.max(...chartBuffer)
          if (windowMax < NEAR_ZERO_THRESHOLD) {
            yAxisPair = buildYAxisPair(Y_MIN_NEGATIVE, NEAR_ZERO_AXIS_MAX)
          } else {
            const autoMax = Math.ceil(windowMax * 1.2 * 10) / 10
            yAxisPair = buildYAxisPair(0, autoMax)
          }
        }
        chartInstance.setOption({
          xAxis: { data: Array.from({ length: BUFFER_LEN }, (_, i) => i) },
          yAxis: yAxisPair,
          series: [{
            name: '压力', type: 'line', smooth: true, symbol: 'none',
            lineStyle: { color: '#FF0000', width: 2 },
            data: chartBuffer
          }]
        }, { replaceMerge: ['series'] })
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
  // 图表高度改为 flex 自适应后，监听容器尺寸变化自动重绘
  if (typeof ResizeObserver !== 'undefined' && chartRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(chartRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  if (wsInstance) { wsInstance.close(); wsInstance = null }
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
  if (sealTimer) { clearInterval(sealTimer); sealTimer = null }
})
</script>

<style scoped lang="scss">
.monitor-container {
  flex: 1;              /* 由 Home 的 flex 布局撑满剩余高度 */
  min-height: 0;
  display: flex;
  flex-direction: column;
  font-family: system-ui;
  background: #f5f5f5;
  box-sizing: border-box;
  overflow: hidden;
}
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
.export-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  padding: 10px;
  box-sizing: border-box;
}

/* 卡片样式 */
.panel { display: flex; gap: 20px; margin-bottom: 20px;color:gray; }
.card { padding: 16px; border: 1px solid #eee; background: #fff; border-radius: 8px; min-width: 160px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card.alarm { background: #ff4d4f; color: #fff; border-color: #ff4d4f; animation: flash 1s infinite alternate; }
.val { font-size: 32px; font-weight: bold; margin-top: 8px; }
.time-val { font-size: 16px; margin-top: 14px; }

/* 图表容器：占满剩余高度，随窗口自适应 */
/* ================= 降压密封模式 ================= */
/* 顶部操作条 */
.seal-top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #c3cede;
  border-radius: 8px;
  margin-bottom: 6px;
}

.seal-live {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f59a23;
  color: #fff;
  border-radius: 6px;
  padding: 5px 14px;

  .live-label { font-size: 15px; font-weight: 600; }
  .live-val { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
}

.seal-target {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.seal-start-btn {
  width: 90px;
  font-size: 16px;
  font-weight: 600;
}

.seal-rate {
  font-size: 16px;
  color: #333;
}

.seal-inspector {
  margin-left: auto;
  display: flex;
  align-items: center;
  border: 1px solid #c3cede;
  border-radius: 4px;
  overflow: hidden;
  font-size: 14px;

  .inspector-label {
    background: #eef1f6;
    color: #666;
    padding: 5px 12px;
  }
  .inspector-name {
    background: #4a5e76;
    color: #fff;
    padding: 5px 16px;
    min-width: 60px;
    text-align: center;
  }
}

/* 底部统计条 */
.seal-bottom {
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 4px 20px 2px;
  background: #fff;
  border-radius: 8px;
  margin-top: 6px;
}

.sb-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.sb-label {
  font-size: 18px;
  font-weight: 600;
  color: #2b5aa5;
  text-align: center;
  line-height: 1.1;

  .sb-unit { display: block; font-size: 12px; font-weight: 400; }
}

.sb-drop { color: #e0399b; }

.sb-val {
  font-size: 26px;
  font-weight: 700;
  color: #1a3a6b;
  min-width: 70px;
}

/* 曲线记录抓取进度提示 */
.curve-progress {
  color: #2b5aa5;
  font-size: 14px;
  font-weight: 600;
  margin-left: 16px;
}

/* 升压速率（整定压力模式）：紧随曲线记录进度显示 */
.rise-rate {
  color: #d46b08;
  font-size: 14px;
  font-weight: 600;
  margin-left: 16px;
}

/* 图表行：图表占满剩余宽度，右侧信息面板固定宽度 */
.chart-row {
  flex: 1;
  min-height: 200px;
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.chart-box {
  flex: 1;
  min-height: 200px;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-sizing: border-box;
}

/* 右侧安全阀信息面板 */
.info-panel {
  flex-shrink: 0;
  width: 250px;
  align-self: stretch;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #4a5e76;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 10px;
  font-size: 13px;
  color: #333;
}

.panel-title {
  background: #4a5e76;
  color: #fff;
  text-align: center;
  font-weight: 600;
  padding: 6px 0;
  border-radius: 4px;
  margin-bottom: 10px;
}

.info-rows,
.gauge-rows {
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 6px;
  background: #f4f6fa;
  border-radius: 4px;
  margin-bottom: 4px;
  gap: 8px;

  .label { color: #666; flex-shrink: 0; }
  .value { color: #2b5aa5; font-weight: 600; text-align: right; word-break: break-all; }
}

.panel-section {
  background: #4a5e76;
  color: #fff;
  text-align: center;
  font-weight: 600;
  padding: 5px 0;
  border-radius: 4px;
  margin: 10px 0 8px;
}

.range-value {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #2b5aa5;
  background: #f4f6fa;
  border-radius: 4px;
  padding: 8px 0;
}

.seat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid #c3cede;
  border-radius: 4px;
  margin-bottom: 5px;
  background: #fff;

  .seat-name { color: #333; font-weight: 600; }

  &.active {
    background: #2b5aa5;
    border-color: #2b5aa5;
    .seat-name, .seat-force { color: #fff; }
  }
}

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