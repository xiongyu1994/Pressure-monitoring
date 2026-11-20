<template>
  <!-- 弹窗组件，通过 v-model:show 控制显示/隐藏 -->
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="任务列表"
    style="width: 90vw; max-width: 1400px; height: 85vh;"
    :bordered="false"
    :segmented="{ content: true }"
    :closable="true"
    draggable
  >
    <!-- 顶部操作栏：按钮 + 统计信息 -->
    <template #header-extra>
      <div class="header-stats">
        当前需要校验的安全阀数目 <span class="highlight">{{ total }}</span> 个
      </div>
    </template>

    <n-button type="primary" @click="startTuning">开始整定</n-button>

    <div class="modal-content">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <n-space align="center">
          <span>委托单位:</span>
          <n-input v-model:value="filters.custName" placeholder="输入单位名称" clearable style="width: 200px;" @keyup.enter="handleSearch" @clear="handleSearch" />
          <span>设备代码:</span>
          <n-input v-model:value="filters.idNo" placeholder="输入设备代码" clearable style="width: 150px;" @keyup.enter="handleSearch" @clear="handleSearch" />
          <span>校验编号:</span>
          <n-input v-model:value="filters.orderCode" placeholder="输入校验编号" clearable style="width: 180px;" @keyup.enter="handleSearch" @clear="handleSearch" />
          <n-button type="primary" :loading="loading" @click="handleSearch">查询</n-button>
          <n-button @click="handleReset">清空</n-button>
        </n-space>
      </div>

      <!-- 数据表格 -->
      <n-data-table
        class="task-table"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        remote
        :pagination="pagination"
        :bordered="true"
        :single-line="false"
        striped
        size="small"
        flex-height
        :row-props="rowProps"
        :row-key="(row) => row.id"
      />

      <!-- 选中行安全阀基本信息（同校验台软件：列表下方展示当前选中阀的信息） -->
      <div class="valve-info" v-if="activeRow">
        <div class="valve-info-title">安全阀基本信息</div>
        <div class="valve-info-grid">
          <div class="info-cell" v-for="item in infoItems" :key="item.label">
            <span class="info-label">{{ item.label }}：</span>
            <span class="info-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { NModal, NSpace, NInput, NButton, NDataTable, useMessage } from 'naive-ui'
import { fetchTaskList, claimTask } from '@/api/task'

// 控制弹窗显示
const showModal = ref(false)
const loading = ref(false)
const message = useMessage()

const emit = defineEmits(['sendTask'])

// 搜索条件（对应后端 /c/task/list 的 custName / idNo / orderCode）
const filters = reactive({ custName: '', idNo: '', orderCode: '' })
const tableData = ref([])
const total = ref(0)

// 远程分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageSizes: [20, 50, 100],
  showSizePicker: true,
  prefix: ({ itemCount }) => `共 ${itemCount} 条`,
  onChange: (page) => {
    pagination.page = page
    loadData()
  },
  onUpdatePageSize: (size) => {
    pagination.pageSize = size
    pagination.page = 1
    loadData()
  }
})

// 表格列定义（字段名与后端 /c/task/list 返回一致）
const columns = [
  { title: '委托单位', key: 'custName', width: 260, ellipsis: { tooltip: true } },
  { title: '安全阀型号', key: 'vavleModel', width: 110 },
  { title: '校验编号', key: 'orderCode', width: 120 },
  { title: '要求整定压力', key: 'setPress', width: 120 },
  { title: '密封压力', key: 'tightnessPress', width: 100 },
  { title: '公称通径(mm)', key: 'diameterNominal', width: 120 },
  { title: '流道直径', key: 'seatSize', width: 100, render: (row) => row.seatSize || '/' },
  { title: '工作压力', key: 'workingPress', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (row) => (row.status === 'inspection' ? '检验中' : row.status === 'wait' ? '待检验' : row.status || '')
  },
  { title: '校验员', key: 'inspector', width: 90, render: (row) => row.inspector || '-' }
]

// 加载任务列表
const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchTaskList({
      custName: filters.custName.trim(),
      idNo: filters.idNo.trim(),
      orderCode: filters.orderCode.trim(),
      page: pagination.page,
      limit: pagination.pageSize
    })
    tableData.value = data.list || []
    total.value = data.total || 0
    pagination.itemCount = data.total || 0
    // 默认选中第一条数据
    if (tableData.value.length && !tableData.value.some((r) => r.id === activeRowId.value)) {
      activeRowId.value = tableData.value[0].id
    }
  } catch (err) {
    message.error(err.message || '加载任务列表失败')
    tableData.value = []
    total.value = 0
    pagination.itemCount = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  filters.custName = ''
  filters.idNo = ''
  filters.orderCode = ''
  pagination.page = 1
  loadData()
}

// 点击行的高亮逻辑（模拟照片中的蓝色选中行）
const activeRowId = ref(null)
const rowProps = (row) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      activeRowId.value = row.id
    },
    // 动态给选中的行添加蓝色背景类名
    class: activeRowId.value === row.id ? 'active-row' : ''
  }
}

// 当前选中行（列表下方「安全阀基本信息」面板数据源）
const activeRow = computed(() => tableData.value.find((item) => item.id === activeRowId.value) || null)

// 空值统一显示 /
const infoText = (val) => {
  if (val === null || val === undefined || val === '') return '/'
  return String(val)
}

// 基本信息面板字段（布局与校验台软件一致：4 列 × 3 行）
const infoItems = computed(() => {
  const r = activeRow.value
  if (!r) return []
  const range = (r.pressClassRangeMin !== null && r.pressClassRangeMin !== undefined && r.pressClassRangeMin !== '')
    || (r.pressClassRangeMax !== null && r.pressClassRangeMax !== undefined && r.pressClassRangeMax !== '')
    ? `${infoText(r.pressClassRangeMin)} ~ ${infoText(r.pressClassRangeMax)}`
    : '/'
  return [
    { label: '安全阀类型', value: infoText(r.vavleType) },
    { label: '安全阀型号', value: infoText(r.vavleModel) },
    { label: '公称通径(mm)', value: infoText(r.diameterNominal) },
    { label: '流道口径(mm)', value: infoText(r.seatSize) },
    { label: '公称压力(MPa)', value: infoText(r.pressNominal) },
    { label: '要求整定压力(MPa)', value: infoText(r.setPress) },
    { label: '压力级别范围(MPa)', value: range },
    { label: '校验编号', value: infoText(r.orderCode) },
    { label: '制造许可证编号', value: infoText(r.licenseNo) },
    { label: '出厂编号', value: infoText(r.manuNo) },
    { label: '制造单位', value: infoText(r.manufacturer) },
    { label: '使用单位', value: infoText(r.custName) }
  ]
})

// 开始整定：先领取任务（wait → 检验中，inspector 记为操作员姓名），成功后再进入整定流程
const startTuning = async () => {
  if (!activeRowId.value) {
    message.warning('请先在列表中选择一条任务')
    return
  }
  const row = tableData.value.find((item) => item.id === activeRowId.value)
  if (!row) {
    message.warning('所选任务不在当前列表中，请重新查询')
    return
  }
  try {
    // 领取接口幂等：待检验→检验中；已是检验中且是本人则直接成功；他人领取会报错中断
    const res = await claimTask(row.id)
    // 同步本地行状态，让列表立即显示「检验中 + 校验员」
    row.status = res?.status || 'inspection'
    if (res && res.inspector) row.inspector = res.inspector
  } catch (err) {
    // 领取失败（如已被他人领取）则不进入整定，并刷新列表拿最新状态
    message.error(err.message || '领取任务失败')
    loadData()
    return
  }
  emit('sendTask', { taskId: row.id, task: row })
  showModal.value = false
}

// 暴露给父组件调用的方法
const open = () => {
  showModal.value = true
  activeRowId.value = null
  loadData()
}
defineExpose({ open, activeRowId })
</script>

<style scoped>
.header-stats {
  font-size: 14px;
  color: #666;
}
.highlight {
  color: #1890ff;
  font-weight: bold;
  font-size: 18px;
  margin: 0 4px;
}
.search-bar {
  padding: 10px 0 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

/* 内容区纵向布局：搜索栏 / 表格（弹性占满）/ 基本信息面板 */
.modal-content {
  display: flex;
  flex-direction: column;
  height: calc(85vh - 130px);
  min-height: 0;
}
.task-table {
  flex: 1;
  min-height: 0;
}

/* 选中行安全阀基本信息面板 */
.valve-info {
  flex-shrink: 0;
  margin-top: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px 10px;
  background: #fff;
}
.valve-info-title {
  font-size: 13px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}
.valve-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.info-cell {
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  padding: 5px 8px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info-label {
  color: #666;
}
.info-value {
  color: #111;
  font-weight: 500;
}

/* 💡 覆盖 Naive UI 表格选中行的样式，模拟照片里的亮蓝色背景 */
:deep(.active-row td) {
  background-color: #2b5aa5 !important; /* 深蓝色背景 */
  color: #ffffff !important; /* 白色文字 */
}
:deep(.active-row td .n-data-table-td) {
  color: #ffffff !important;
}
</style>
