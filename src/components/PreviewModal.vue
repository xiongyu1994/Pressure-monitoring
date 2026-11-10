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
            <n-descriptions-item label="使用单位">武汉齐达康能源装备有限公司</n-descriptions-item>
            <n-descriptions-item label="设备类型">管道</n-descriptions-item>
            <n-descriptions-item label="安全阀类型">弹簧式</n-descriptions-item>
            
            <n-descriptions-item label="工作压力">0.40</n-descriptions-item>
            <n-descriptions-item label="要求整定压力">0.50</n-descriptions-item>
            <n-descriptions-item label="制造单位">合飞阀门有限公司</n-descriptions-item>
            
            <n-descriptions-item label="安全阀型号">A22Y-40C</n-descriptions-item>
            <n-descriptions-item label="工作介质">天然气</n-descriptions-item>
            <n-descriptions-item label="压力级别范围">0.3 - 0.7</n-descriptions-item>
            
            <n-descriptions-item label="校验日期">2026年11月10日</n-descriptions-item>
            <n-descriptions-item label="校验编号">2026113245</n-descriptions-item>
            <n-descriptions-item label="执行标准">TSG 92-2021</n-descriptions-item>
          </n-descriptions>
        </div>
      </div>

      <n-divider style="margin: 16px 0;" />

      <!-- 3. 压力曲线图区 -->
      <div class="chart-section">
        <div class="section-title">定压记录</div>
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <span>第一次</span>
              <span class="chart-val">0.50 <small>MPa</small></span>
            </div>
            <div ref="chart1Ref" class="chart-box"></div>
          </div>
          
          <div class="chart-card">
            <div class="chart-header">
              <span>第二次</span>
              <span class="chart-val">0.51 <small>MPa</small></span>
            </div>
            <div ref="chart2Ref" class="chart-box"></div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span>第三次</span>
              <span class="chart-val">0.50 <small>MPa</small></span>
            </div>
            <div ref="chart3Ref" class="chart-box"></div>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { 
  NModal, NForm, NFormItem, NInput, NDatePicker, NDivider, NDescriptions, NDescriptionsItem 
} from 'naive-ui'
import * as echarts from 'echarts'

const showModal = ref(false)
const chart1Ref = ref(null)
const chart2Ref = ref(null)
const chart3Ref = ref(null)

const dateRange = ref(null)

let chart1 = null
let chart2 = null
let chart3 = null

// 👇 获取当天时间范围
const getTodayRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
  return [start, end]
}

const getChartOption = (titleData) => {
  return {
    grid: { top: 10, right: 10, bottom: 20, left: 40 },
    xAxis: {
      type: 'category',
      data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      axisLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#666', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1.0,
      axisLine: { show: true, lineStyle: { color: '#333' } },
      axisLabel: { color: '#666', fontSize: 10, formatter: (v) => v.toFixed(2) },
      splitLine: { lineStyle: { color: '#eee' } }
    },
    series: [
      {
        data: titleData,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#52c41a', width: 1.5 },
        areaStyle: { color: 'rgba(82, 196, 26, 0.05)' } // 增加一点微弱的面积填充
      }
    ]
  }
}

const initCharts = () => {
  if (chart1Ref.value) {
    chart1 = echarts.init(chart1Ref.value)
    chart1.setOption(getChartOption([0, 0.1, 0.3, 0.45, 0.5, 0.52, 0.5, 0.48, 0.4, 0.2]))
  }
  if (chart2Ref.value) {
    chart2 = echarts.init(chart2Ref.value)
    chart2.setOption(getChartOption([0, 0.05, 0.2, 0.4, 0.48, 0.51, 0.51, 0.49, 0.3, 0.1]))
  }
  if (chart3Ref.value) {
    chart3 = echarts.init(chart3Ref.value)
    chart3.setOption(getChartOption([0, 0.2, 0.35, 0.42, 0.5, 0.5, 0.49, 0.45, 0.2, 0]))
  }
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