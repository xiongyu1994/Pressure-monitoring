<template>
  <n-space vertical size="large">
    <!-- 1. 顶部搜索栏 -->
    <n-card size="small">
      <n-form inline :model="searchForm" label-placement="left">
        <n-form-item label="使用单位">
          <n-input v-model:value="searchForm.company_name" placeholder="请输入使用单位" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select 
            v-model:value="searchForm.status" 
            :options="statusOptions" 
            placeholder="全部" 
            clearable 
            style="width: 150px" 
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch" :loading="loading">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 2. 数据表格区 -->
    <n-card size="small">
      <template #header>
        <n-button type="primary">新增</n-button>
      </template>

      <!-- Naive UI 的 DataTable -->
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :row-key="row => row.id"
        :bordered="true"
        :single-line="false"
        scroll-x="1200"
      />

      <!-- 3. 分页组件 -->
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          show-quick-jumper
          @update:page="handleCurrentChange"
          @update:page-size="handleSizeChange"
        >
          <template #suffix>
            共 {{ total }} 条
          </template>
        </n-pagination>
      </div>
    </n-card>
  </n-space>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
// 引入 Naive UI 需要的组件
import { NButton, NSpace, NProgress, NTag } from 'naive-ui'

// --- 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  company_name: '',
  status: ''
})

// 状态下拉框选项
const statusOptions = [
  { label: '等待签名', value: '等待签名' },
  { label: '等待检验', value: '等待检验' },
  { label: '检验中', value: '检验中' },
  { label: '检验完成', value: '检验完成' }
]

// --- 表格列配置 (Naive UI 写法) ---
const columns = [
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'left',
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, { size: 'small', type: 'primary', ghost: true }, { default: () => '编辑' }),
          h(NButton, { size: 'small', ghost: true }, { default: () => '查看' }),
          // 如果是等待签名，才显示签名按钮
          row.status === '等待签名' ? h(NButton, { size: 'small', type: 'success', ghost: true }, { default: () => '签名' }) : null,
          h(NButton, { size: 'small', type: 'error', ghost: true }, { default: () => '删除' }),
          h(NButton, { size: 'small', type: 'success', ghost: true }, { default: () => '打印委托单' })
        ].filter(Boolean) // 过滤掉 null
      })
    }
  },
  { type: 'selection' },
  { 
    title: '委托单状态', 
    key: 'status', 
    width: 120,
    // 给状态加个颜色标签美化一下
    render(row) {
      let type = 'default'
      if (row.status === '等待签名') type = 'warning'
      if (row.status === '等待检验') type = 'info'
      if (row.status === '检验中') type = 'primary'
      if (row.status === '检验完成') type = 'success'
      return h(NTag, { type, size: 'small', bordered: false }, { default: () => row.status })
    }
  },
  { title: '委托单号', key: 'order_no', width: 150 },
  { title: '使用单位', key: 'company_name', minWidth: 200, ellipsis: { tooltip: true } },
  { title: '单位联系人', key: 'contact_person', width: 120 },
  { title: '校验编号', key: 'verify_code', width: 160 },
  {
    title: '报告完成状态',
    key: 'report_progress',
    width: 200,
    render(row) {
      if (!row.report_progress) return null
      const percentage = getProgressPercentage(row.report_progress)
      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h(NProgress, { 
          type: 'line', 
          percentage: percentage, 
          showIndicator: false, 
          height: 10,
          status: percentage === 100 ? 'success' : 'default',
          style: 'flex: 1;'
        }),
        h('span', { style: 'font-size: 13px; color: #666; width: 40px;' }, row.report_progress)
      ])
    }
  }
]

// --- 核心方法 ---

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    // 拼接查询参数
    const params = new URLSearchParams({
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    if (searchForm.company_name) params.append('company_name', searchForm.company_name)
    if (searchForm.status) params.append('status', searchForm.status)

    // 请求你的 PHP 接口
    const response = await fetch(`http://localhost/api/get_orders.php?${params.toString()}`)
    const res = await response.json()

    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    } else {
      console.error('接口报错:', res.msg)
      // 这里可以加上 window.$message.error(res.msg) 如果是全局挂载了的话
    }
  } catch (error) {
    console.error('网络请求失败，请检查小皮面板是否启动:', error)
  } finally {
    loading.value = false
  }
}

// 点击查询
const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

// 点击重置
const handleReset = () => {
  searchForm.company_name = ''
  searchForm.status = ''
  currentPage.value = 1
  fetchList()
}

// 改变页码
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchList()
}

// 改变每页条数
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchList()
}

// 计算进度条百分比
const getProgressPercentage = (str) => {
  if (!str || !str.includes('/')) return 0
  const [current, total] = str.split('/')
  if (parseInt(total) === 0) return 0
  return Math.round((parseInt(current) / parseInt(total)) * 100)
}

// 页面加载时请求数据
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
/* Naive UI 基本不需要写太多额外的样式，如果需要微调可以写在这里 */
</style>