<template>
  <n-modal 
    v-model:show="showModal" 
    preset="card" 
    title="校验记录预览" 
    style="width: 95vw; max-width: 1400px; height: 90vh;"
    :bordered="false"
    :closable="true"
    class="preview-modal"
  >
    <div class="preview-container">
      <!-- 1. 顶部查询条件 -->
      <div class="query-section">
        <div class="section-title">查询历史记录</div>
        <n-form inline label-placement="left" :show-feedback="false" class="query-form">
          <n-form-item label="校验编码：">
            <n-input placeholder="请输入校验编码" style="width: 200px;" clearable />
          </n-form-item>
          <n-form-item label="校验日期：" style="margin-left: 40px;">
            <n-date-picker type="daterange" v-model:value="dateRange"  clearable style="width: 320px;" />
          </n-form-item>
        </n-form>
      </div>

      <n-divider style="margin: 16px 0;" />

      <!-- 2. 基础信息区 (使用 Naive UI 的 Descriptions) -->
      <div class="info-section">
        <div class="section-title">设备信息</div>
        <div class="info-wrapper">
          <n-descriptions 
            label-placement="left" 
            bordered 
            :column="3" 
            size="small"
            class="custom-descriptions"
          >
            <n-descriptions-item label="使用单位">{{ fmtV(task?.custName) }}</n-descriptions-item>
            <n-descriptions-item label="设备类型">{{ fmtV(task?.equipType) }}</n-descriptions-item>
            <n-descriptions-item label="安全阀类型">{{ fmtV(task?.vavleType) }}</n-descriptions-item>

            <n-descriptions-item label="工作压力">{{ fmtV(task?.workingPress) }}</n-descriptions-item>
            <n-descriptions-item label="要求整定压力">{{ fmtV(task?.setPress) }}</n-descriptions-item>
            <n-descriptions-item label="制造单位">{{ fmtV(task?.manufacturer) }}</n-descriptions-item>

            <n-descriptions-item label="安全阀型号">{{ fmtV(task?.vavleModel) }}</n-descriptions-item>
            <n-descriptions-item label="工作介质">{{ fmtV(task?.workingMedia) }}</n-descriptions-item>
            <n-descriptions-item label="压力级别范围">{{ pressClassRange }}</n-descriptions-item>

            <n-descriptions-item label="校验日期">{{ todayText }}</n-descriptions-item>
            <n-descriptions-item label="校验编号">{{ fmtV(task?.orderCode) }}</n-descriptions-item>
            <n-descriptions-item label="执行标准">{{ standardText }}</n-descriptions-item>
          </n-descriptions>
        </div>
      </div>

      <n-divider style="margin: 16px 0;" />

      <!-- 3. 压力曲线图区：当前校验编号抓取的 3 段定压记录曲线 -->
      <div class="chart-section">
        <div class="section-title">定压记录</div>
        <div v-if="displayCurves.length" class="charts-grid">
          <div v-for="(c, i) in displayCurves" :key="i" class="chart-card">
            <div class="chart-header">
              <span>{{ REC_LABELS[i] }}</span>
              <span class="chart-val">{{ fmtPeak(c.peak) }} <small>MPa</small></span>
            </div>
            <div :ref="(el) => setChartRef(el, i)" class="chart-box"></div>
          </div>
        </div>
        <div v-else class="charts-empty">暂无定压记录曲线，请先在整定压力模式下抓取曲线记录</div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NDatePicker, NDivider, NDescriptions, NDescriptionsItem
} from 'naive-ui'
import * as echarts from 'echarts'

// ================= 外部数据 =================
// task：当前校验编号的任务行（Home 传入，/c/task/list 数据）
// curves：该单号抓取的定压记录曲线（PressureMonitorNew 曲线抓取产出，1~3 条）
const props = defineProps({
  task: { type: Object, default: null },
  curves: { type: Array, default: () => [] }
})

const showModal = ref(false)
const dateRange = ref(null)

// 空值显示 --
const fmtV = (val) => (val === null || val === undefined || val === '' ? '--' : val)
const fmtPeak = (p) => (p === null || p === undefined || !Number.isFinite(Number(p)) ? '--' : Number(p).toFixed(2))

// 压力级别范围：压力级别下限 ~ 上限
const pressClassRange = computed(() => {
  const lo = props.task?.pressClassRangeMin
  const hi = props.task?.pressClassRangeMax
  if (lo === undefined && hi === undefined) return '--'
  return `${fmtV(lo)} - ${fmtV(hi)}`
})

// 校验日期：当天
const todayText = computed(() => {
  const n = new Date()
  return `${n.getFullYear()}年${n.getMonth() + 1}月${n.getDate()}日`
})

// 执行标准：填写评论里选中的标准（localStorage 持久化，CommentFormModal 写入）
const standardText = computed(() => {
  try {
    const arr = JSON.parse(window.localStorage.getItem('pm-standard-selected') || 'null')
    if (Array.isArray(arr) && arr.length) return arr.join('；')
  } catch (e) { /* 存储异常时显示默认 */ }
  return '--'
})

// ================= 定压记录曲线 =================
const REC_LABELS = ['第一次', '第二次', '第三次']
// 最多展示前 3 段曲线
const displayCurves = computed(() => (props.curves || []).slice(0, 3))

// 动态收集图表容器 DOM
const chartEls = []
const setChartRef = (el, i) => { chartEls[i] = el }
let chartInstances = []

// 👇 获取当天时间范围
const getTodayRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
  return [start, end]
}

// 曲线图表配置：绿色平滑曲线 + 浅色面积填充，Y 轴上限按峰值放大
const getChartOption = (curve) => {
  const peak = Number(curve?.peak)
  const yMax = Number.isFinite(peak) && peak > 0
    ? Math.max(Math.ceil(peak * 1.3 * 10) / 10, 0.2)
    : 1.0
  return {
    grid: { top: 10, right: 10, bottom: 20, left: 40 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 101 }, (_, i) => i),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#666', fontSize: 10, interval: 9 } // 每 10 个刻度显示一次
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      axisLine: { show: true, lineStyle: { color: '#333' } },
      axisLabel: { color: '#666', fontSize: 10, formatter: (v) => v.toFixed(2) },
      splitLine: { lineStyle: { color: '#eee' } }
    },
    series: [
      {
        data: curve?.points || [],
        type: 'line',
        smooth: true,
        symbol: 'none',
        connectNulls: false,
        lineStyle: { color: '#52c41a', width: 1.5 },
        areaStyle: { color: 'rgba(82, 196, 26, 0.05)' } // 增加一点微弱的面积填充
      }
    ]
  }
}

const initCharts = () => {
  // 释放旧实例，按当前曲线数量重建
  chartInstances.forEach((c) => c && c.dispose())
  chartInstances = []
  displayCurves.value.forEach((curve, i) => {
    const el = chartEls[i]
    if (el) {
      const inst = echarts.init(el)
      inst.setOption(getChartOption(curve))
      chartInstances.push(inst)
    }
  })
}

const open = () => {
  showModal.value = true
  dateRange.value = getTodayRange()
  nextTick(() => {
    initCharts()
  })
}

defineExpose({ open })
</script>

<style scoped lang="scss">
// 1. 定义主题变量
$primary-color: #1890ff;
$text-main: #333333;
$text-label: #666666;
$bg-panel: #fafafa;
$border-color: #e8e8e8;

.preview-container {
  padding: 10px;
  color: $text-main;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", sans-serif;

  // 统一标题样式
  .section-title {
    font-size: 15px;
    font-weight: bold;
    color: $primary-color;
    margin-bottom: 12px;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background-color: $primary-color;
      margin-right: 8px;
      border-radius: 2px;
    }
  }

  // 查询表单微调
  .query-form {
    padding-left: 12px;
    :deep(.n-form-item-label) {
      color: $text-label;
      font-weight: normal;
    }
  }

  // 设备信息区
  .info-wrapper {
    padding-left: 12px;
    
    // 深度覆盖 Naive UI 表格的默认颜色，贴合工业风格
    :deep(.custom-descriptions) {
      .n-descriptions-table-border {
        border-color: $border-color;
      }
      .n-descriptions-table-header {
        background-color: $bg-panel;
        color: $text-label;
        font-weight: normal;
        width: 120px; // 固定标签宽度
        text-align: right;
      }
      .n-descriptions-table-content {
        color: $text-main;
        font-weight: 500;
      }
    }
  }

  // 图表展示区
  .chart-section {
    padding-left: 12px;

    .charts-empty {
      padding: 30px 0;
      text-align: center;
      color: #999;
      font-size: 13px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;

      .chart-card {
        background: #ffffff;
        border: 1px solid $border-color;
        border-radius: 6px;
        padding: 12px 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        transition: box-shadow 0.3s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: bold;
          color: $text-main;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px dashed $border-color;

          .chart-val {
            color: $primary-color;
            font-size: 18px;
            font-family: Consolas, Monaco, monospace;
            small {
              font-size: 12px;
              color: $text-label;
              font-weight: normal;
            }
          }
        }

        .chart-box {
          width: 100%;
          height: 200px;
        }
      }
    }
  }
}
</style>