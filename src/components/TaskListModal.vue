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
        当前需要校验的安全阀数目 <span class="highlight">{{ tableData.length }}</span> 个
      </div>
    </template>

    <div class="modal-content">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <n-space align="center">
          <span>委托单位:</span>
          <n-input v-model:value="searchKeyword" placeholder="输入单位名称" clearable style="width: 200px;" />
          <span>设备代码:</span>
          <n-input placeholder="输入设备代码" clearable style="width: 150px;" />
          <span>校验编号:</span>
          <n-input placeholder="输入校验编号" clearable style="width: 180px;" />
          <n-button type="primary" @click="handleSearch">查询</n-button>
          <n-button>清空</n-button>
        </n-space>
      </div>

      <!-- 数据表格 -->
      <n-data-table
        ref="tableRef"
        :columns="columns"
        :data="filteredData"
        :pagination="false"
        :bordered="true"
        :single-line="false"
        striped
        size="small"
        flex-height
        style="height: calc(85vh - 200px);"
        :row-props="rowProps"
      />
    </div>
  </n-modal>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { NModal, NSpace, NInput, NButton, NDataTable, useMessage } from 'naive-ui'

// 控制弹窗显示
const showModal = ref(false)
// 搜索关键词
const searchKeyword = ref('')
// 表格引用（用于获取选中行等）
const tableRef = ref(null)
const message = useMessage()

// 定义行数据的类型（如果使用 TS）
// interface TaskRow { ... }

// 1. 模拟数据（对应你照片里的表格）
const tableData = ref([
  { id: 1, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113298', reqPressure: '0.02', sealPressure: '0', caliber: '80', workPressure: '0.01' },
  { id: 2, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113297', reqPressure: '0.02', sealPressure: '0', caliber: '80', workPressure: '0.01' },
  { id: 3, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113295', reqPressure: '0.05', sealPressure: '0.02', caliber: '10', workPressure: '0.03' },
  { id: 4, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113294', reqPressure: '0.05', sealPressure: '0.02', caliber: '10', workPressure: '0.03' },
  { id: 5, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113293', reqPressure: '0.80', sealPressure: '0.72', caliber: '15', workPressure: '0.70' },
  { id: 6, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113292', reqPressure: '0.70', sealPressure: '0.63', caliber: '15', workPressure: '0.70' },
  { id: 7, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113291', reqPressure: '0.85', sealPressure: '0.77', caliber: '20', workPressure: '0.70' },
  { id: 8, unit: '松滋市凯迪阳光生物能源开发有限公司', type: '弹簧式', code: '2026113290', reqPressure: '0.85', sealPressure: '0.77', caliber: '20', workPressure: '0.70' },
  { id: 9, unit: '公安县兴成燃气有限公司', type: '弹簧式', code: '2026113120', reqPressure: '27.50', sealPressure: '24.75', caliber: '15', workPressure: '24.00' },
  { id: 10, unit: '公安县兴成燃气有限公司', type: '弹簧式', code: '2026113119', reqPressure: '3.90', sealPressure: '3.51', caliber: '25', workPressure: '3.50' },
])

// 2. 表格列定义 (对应照片里的表头)
const columns = [
  { title: '委托单位', key: 'unit', width: 280, ellipsis: { tooltip: true } },
  { title: '安全阀型号', key: 'type', width: 100 },
  { title: '校验编号', key: 'code', width: 120 },
  { title: '要求整定压力', key: 'reqPressure', width: 120 },
  { title: '密封压力', key: 'sealPressure', width: 100 },
  { title: '公称通径(mm)', key: 'caliber', width: 120 },
  { title: '流道直径', key: 'flowDiameter', width: 100, render: () => '/' },
  { title: '工作压力', key: 'workPressure', width: 100 },
]

// 3. 搜索过滤逻辑
const filteredData = computed(() => {
  if (!searchKeyword.value) return tableData.value
  const keyword = searchKeyword.value.toLowerCase()
  return tableData.value.filter(item => 
    item.unit.toLowerCase().includes(keyword) || 
    item.code.includes(keyword)
  )
})

// 4. 点击行的高亮逻辑（模拟照片中的蓝色选中行）
const activeRowId = ref(null)
const rowProps = (row) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      activeRowId.value = row.id
      message.info(`选中了编号：${row.code} 的设备`)
    },
    // 动态给选中的行添加蓝色背景类名
    class: activeRowId.value === row.id ? 'active-row' : ''
  }
}

const handleSearch = () => {
    
}

// 暴露给父组件调用的方法
const open = () => {
  showModal.value = true
}
defineExpose({ open })
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