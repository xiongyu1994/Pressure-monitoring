<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="压力表编号"
    style="width: 1000px; max-width: 92vw;"
    :bordered="false"
    :segmented="{ content: true }"
    :closable="true"
  >
    <div class="gauge-toolbar">
      <n-space>
        <n-button type="primary" size="small" @click="addRow">添加</n-button>
        <n-button size="small" color="#d03050" :disabled="activeId === null" @click="removeRow">删除</n-button>
      </n-space>
    </div>

    <div class="gauge-table-wrap">
      <table class="gauge-table">
        <thead>
          <tr>
            <th style="width: 50px;">序号</th>
            <th>表编号</th>
            <th>有效期</th>
            <th>表编号</th>
            <th>有效期</th>
            <th>标准器</th>
            <th>有效期</th>
            <th style="width: 90px;">量程 (MPa)</th>
            <th style="width: 80px;">精度等级</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in gauges"
            :key="row.id"
            :class="{ active: activeId === row.id }"
            @click="activeId = row.id"
          >
            <td class="cell-center">{{ index + 1 }}</td>
            <td><input v-model="row.num" class="cell-input" placeholder="表编号" /></td>
            <td><input v-model="row.life" class="cell-input" placeholder="YYYY-MM-DD" /></td>
            <td><input v-model="row.num2" class="cell-input" placeholder="表编号" /></td>
            <td><input v-model="row.life2" class="cell-input" placeholder="YYYY-MM-DD" /></td>
            <td><input v-model="row.standard" class="cell-input" placeholder="标准器" /></td>
            <td><input v-model="row.stdLife" class="cell-input" placeholder="YYYY-MM-DD" /></td>
            <td><input v-model="row.range" class="cell-input cell-center" placeholder="量程" /></td>
            <td><input v-model="row.accuracy" class="cell-input cell-center" placeholder="精度" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="gauge-foot">
      <n-space justify="end" :size="12">
        <n-button type="primary" @click="confirm">确定</n-button>
        <n-button @click="showModal = false">取消</n-button>
      </n-space>
    </div>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import { NModal, NSpace, NButton, useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/store/useSettingsStore'

const showModal = ref(false)
const activeId = ref(null)
const message = useMessage()

const settingsStore = useSettingsStore()
const { gauges } = storeToRefs(settingsStore)

const open = () => {
  settingsStore.load() // 打开时恢复上次保存的内容
  activeId.value = null
  showModal.value = true
}

// 添加：追加一行空行（带默认精度）
const addRow = () => {
  const nextId = gauges.value.reduce((max, g) => Math.max(max, g.id), 0) + 1
  gauges.value.push({
    id: nextId, num: '', life: '', num2: '', life2: '',
    standard: '', stdLife: '', range: '', accuracy: '0.4'
  })
  activeId.value = nextId
}

// 删除：删除当前选中行
const removeRow = () => {
  if (activeId.value === null) return
  gauges.value = gauges.value.filter((g) => g.id !== activeId.value)
  activeId.value = null
}

const confirm = () => {
  // 简单校验：填了表编号的行必须有量程
  for (const g of gauges.value) {
    if ((g.num || g.num2) && !g.range) {
      message.warning('第 ' + g.id + ' 行已填表编号，请同时填写量程')
      return
    }
  }
  settingsStore.save()
  message.success('压力表信息已保存')
  showModal.value = false
}

defineExpose({ open })
</script>

<style scoped>
.gauge-toolbar {
  margin-bottom: 10px;
}

.gauge-table-wrap {
  max-height: 55vh;
  overflow: auto;
  border: 1px solid #c3cede;
  border-radius: 4px;
}

.gauge-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.gauge-table th {
  position: sticky;
  top: 0;
  background: #2b5aa5;
  color: #fff;
  font-weight: 600;
  padding: 8px 4px;
  border: 1px solid #1d4180;
  white-space: nowrap;
}

.gauge-table td {
  border: 1px solid #d5dde8;
  padding: 3px 4px;
}

.gauge-table tr.active td {
  background: #e6eefb;
}

.cell-center { text-align: center; }
td.cell-center { color: #666; }

.cell-input {
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  padding: 5px 4px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 3px;
}

.cell-input:focus {
  outline: none;
  border-color: #2b5aa5;
  background: #fff;
}

.gauge-foot {
  margin-top: 14px;
}
</style>
