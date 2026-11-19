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
        style="height: calc(85vh - 220px);"
        :row-props="rowProps"
        :row-key="(row) => row.id"
      />
    </div>
  </n-modal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { NModal, NSpace, NInput, NButton, NDataTable, useMessage } from 'naive-ui'
import { fetchTaskList } from '@/api/task'

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

// 开始整定
const startTuning = () => {
  if (!activeRowId.value) {
    message.warning('请先在列表中选择一条任务')
    return
  }
  const row = tableData.value.find((item) => item.id === activeRowId.value)
  emit('sendTask', { taskId: activeRowId.value, task: row })
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

/* 💡 覆盖 Naive UI 表格选中行的样式，模拟照片里的亮蓝色背景 */
:deep(.active-row td) {
  background-color: #2b5aa5 !important; /* 深蓝色背景 */
  color: #ffffff !important; /* 白色文字 */
}
:deep(.active-row td .n-data-table-td) {
  color: #ffffff !important;
}
</style>
