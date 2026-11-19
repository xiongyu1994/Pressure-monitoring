<template>
  <n-modal 
    v-model:show="showModal" 
    preset="card" 
    title="校验信息填写" 
    style="width: 1000px;"
    :bordered="false"
    :closable="true"
  >
    <n-form 
      ref="formRef" 
      :model="formData" 
      label-placement="left" 
      label-width="80"
      require-mark-placement="right-hanging"
    >
      <!-- 顶部区域：报告编号 + 检查项 -->
      <n-grid :cols="24" :x-gap="24">
        <n-form-item-gi :span="12" label="报告编号">
          <n-input v-model:value="formData.reportNo" placeholder="请输入报告编号" />
        </n-form-item-gi>
        
        <n-form-item-gi :span="6" label="外观检查" label-width="80">
          <n-select v-model:value="formData.appearance" :options="checkOptions" />
        </n-form-item-gi>
        
        <n-form-item-gi :span="6" label="拆卸检查" label-width="80">
          <n-select v-model:value="formData.disassembly" :options="checkOptions" />
        </n-form-item-gi>
      </n-grid>

      <!-- 执行标准 & 备注 -->
      <n-grid :cols="24" :x-gap="24">
        <n-form-item-gi :span="12" label="执行标准">
          <n-popover trigger="click" v-model:show="stdPopShow" placement="bottom-start" :width="320">
            <template #trigger>
              <n-input :value="standardText" readonly placeholder="请选择执行标准" />
            </template>
            <!-- 执行标准多选面板：复选列表 + 全选 + 确定/取消 -->
            <div class="std-panel">
              <n-checkbox-group v-model:value="stdDraft">
                <div v-for="s in STANDARD_OPTIONS" :key="s" class="std-item">
                  <n-checkbox :value="s" :label="s" />
                </div>
              </n-checkbox-group>
              <div class="std-foot">
                <n-checkbox
                  :checked="allChecked"
                  :indeterminate="someChecked"
                  @update:checked="toggleAll"
                >全选</n-checkbox>
                <n-space :size="8">
                  <n-button size="small" type="primary" @click="applyStd">确定</n-button>
                  <n-button size="small" type="error" @click="cancelStd">取消</n-button>
                </n-space>
              </div>
            </div>
          </n-popover>
        </n-form-item-gi>
        <n-form-item-gi :span="12" label="备注">
          <n-input v-model:value="formData.remark" placeholder="请输入备注" />
        </n-form-item-gi>
      </n-grid>

      <!-- 新增：把自定义标准追加进执行标准下拉选项 -->
      <n-form-item label="新增">
        <div style="display: flex; gap: 8px;">
          <n-input v-model:value="formData.newItem" placeholder="新增执行标准" @keyup.enter="addStandard" />
          <n-button type="primary" style="width: 40px; padding: 0;" @click="addStandard">
            <template #icon><n-icon><AddOutline /></n-icon></template>
          </n-button>
        </div>
      </n-form-item>

      <!-- 校验介质 & 泄漏量 -->
      <n-grid :cols="24" :x-gap="24">
        <n-form-item-gi :span="12" label="校验介质">
          <div style="display: flex; gap: 10px; width: 100%;">
            <n-input-group>
              <n-input-group-label>介质</n-input-group-label>
              <n-input v-model:value="formData.medium" />
            </n-input-group>
            <n-input-group>
              <n-input-group-label>温度</n-input-group-label>
              <n-input v-model:value="formData.temp" />
            </n-input-group>
          </div>
        </n-form-item-gi>
        
        <n-form-item-gi :span="12" label="泄漏量" label-width="70">
          <n-input-group>
            <n-input v-model:value="formData.leakage" style="width: 150px;" />
            <n-input-group-label>气泡 / min</n-input-group-label>
          </n-input-group>
        </n-form-item-gi>
      </n-grid>

      <!-- 结论 -->
      <n-form-item label="结论" label-style="font-weight: bold;">
        <div class="conclusion-wrapper">
          <p class="hint-text">校验结论 (如果使用自动判断，请选择安全阀使用设备)：</p>
          
          <!-- 第一组：设备类型 -->
          <n-radio-group v-model:value="formData.deviceType" style="margin-bottom: 10px;">
            <n-radio value="boiler">蒸汽锅炉用安全阀</n-radio>
            <n-radio value="pressure">压力容器和管道用安全阀</n-radio>
          </n-radio-group>
          
          <!-- 第二组：是否合格 -->
          <n-radio-group v-model:value="formData.isPass">
            <n-radio value="pass">该安全阀经校验合格</n-radio>
            <n-radio value="fail">该安全阀经校验，不合格。不能投入使用。</n-radio>
          </n-radio-group>
        </div>
      </n-form-item>

      <!-- 维护检修情况 -->
      <n-form-item label="维护检修情况说明" label-width="150" label-style="align-items: flex-start; padding-top: 4px;">
        <div style="width: 100%;">
          <n-checkbox-group v-model:value="formData.maintenance">
            <n-space>
              <n-checkbox value="clean">解体、清洗、除锈</n-checkbox>
              <n-checkbox value="degrease">请在投入运行时先脱脂</n-checkbox>
              <n-checkbox value="check">经解体、清洗、检查合格</n-checkbox>
              <n-checkbox value="other">其他</n-checkbox>
            </n-space>
          </n-checkbox-group>
          <n-input 
            type="textarea" 
            v-model:value="formData.maintenanceRemark" 
            placeholder="请输入详细说明..." 
            style="margin-top: 10px;" 
            :rows="2"
          />
        </div>
      </n-form-item>

      <!-- 底部：压力表 & 压力变送器 -->
      <n-grid :cols="24" :x-gap="24">
        <n-form-item-gi :span="12" label="压力表" label-width="80">
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <n-input-group>
              <n-input-group-label style="width: 60px; justify-content: center;">编号</n-input-group-label>
              <n-input />
            </n-input-group>
            <n-input-group>
              <n-input-group-label style="width: 60px; justify-content: center;">有效期</n-input-group-label>
              <n-input />
            </n-input-group>
            <div style="display: flex; gap: 10px; color: #666; font-size: 13px;">
              <span>量程 (MPa): 0.1</span>
              <span>精度等级: 0.4</span>
            </div>
          </div>
        </n-form-item-gi>
        
        <n-form-item-gi :span="12" label="压力变送器" label-width="100">
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <n-input-group>
              <n-input-group-label style="width: 60px; justify-content: center;">编号</n-input-group-label>
              <n-input />
            </n-input-group>
            <n-input-group>
              <n-input-group-label style="width: 60px; justify-content: center;">有效期</n-input-group-label>
              <n-input />
            </n-input-group>
          </div>
        </n-form-item-gi>
      </n-grid>
    </n-form>

    <!-- 底部按钮 -->
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button type="primary" @click="handleSubmit">确定</n-button>
        <n-button @click="showModal = false">取消</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  NModal, NForm, NGrid, NFormItemGi, NInput, NSelect,
  NButton, NIcon, NInputGroup, NInputGroupLabel,
  NRadioGroup, NRadio, NCheckboxGroup, NCheckbox, NSpace, NPopover
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

const showModal = ref(false)
const formRef = ref(null)

// 检查项下拉框数据
const checkOptions = [
  { label: '合格', value: '合格' },
  { label: '不合格', value: '不合格' }
]

// ================= 执行标准多选 =================
// 选项列表持久化到 localStorage，新增的自定义标准刷新后仍在
const STD_OPTIONS_KEY = 'pm-standard-options'
const DEFAULT_STANDARDS = [
  'TSG 92-2026',
  'GB/T12241-2021',
  'GB/T12243-2021',
  'TSGZF001-2006及修改单'
]
const loadStandards = () => {
  try {
    const raw = window.localStorage.getItem(STD_OPTIONS_KEY)
    const arr = raw ? JSON.parse(raw) : null
    if (Array.isArray(arr) && arr.length) return arr
  } catch (e) { /* 存储损坏时回退默认 */ }
  return [...DEFAULT_STANDARDS]
}
const saveStandards = () => {
  try { window.localStorage.setItem(STD_OPTIONS_KEY, JSON.stringify(STANDARD_OPTIONS.value)) } catch (e) { /* file:// 下忽略 */ }
}

// 选项列表：ref 保证「新增」追加后弹层实时更新
const STANDARD_OPTIONS = ref(loadStandards())
const stdPopShow = ref(false)
const STD_SELECTED_KEY = 'pm-standard-selected'

// 已确认的选中项：优先恢复上次确认的选择，首次使用默认前三项
const loadStdSelected = () => {
  try {
    const arr = JSON.parse(window.localStorage.getItem(STD_SELECTED_KEY) || 'null')
    if (Array.isArray(arr) && arr.length) return arr
  } catch (e) { /* 存储异常时用默认值 */ }
  return ['TSG 92-2026', 'GB/T12241-2021', 'GB/T12243-2021']
}
const stdSelected = ref(loadStdSelected())                                   // 已确认的选中项
const saveStdSelected = () => {
  try { window.localStorage.setItem(STD_SELECTED_KEY, JSON.stringify(stdSelected.value)) } catch (e) { /* file:// 下忽略 */ }
}
const stdDraft = ref([...stdSelected.value])                                 // 弹层内的草稿选中项

// 新增自定义标准：追加进执行标准选项并自动勾选，持久保存
const addStandard = () => {
  const text = formData.newItem.trim()
  if (!text) {
    window.$message?.warning('请输入要新增的标准内容')
    return
  }
  if (STANDARD_OPTIONS.value.includes(text)) {
    window.$message?.warning('该标准已存在')
    return
  }
  STANDARD_OPTIONS.value.push(text)
  saveStandards()
  // 若弹层开着，草稿里同步勾选新项；未打开则记为已选中
  if (stdPopShow.value) {
    if (!stdDraft.value.includes(text)) stdDraft.value.push(text)
  } else {
    if (!stdSelected.value.includes(text)) stdSelected.value.push(text)
    formData.standard = standardText.value
  }
  formData.newItem = ''
  window.$message?.success('已添加到执行标准选项')
}

// 输入框展示：选中项用「；」拼接（与校验台软件一致）
const standardText = computed(() => stdSelected.value.join('；'))

// 打开弹层时用已确认项重置草稿
watch(stdPopShow, (v) => { if (v) stdDraft.value = [...stdSelected.value] })

const allChecked = computed(() => stdDraft.value.length === STANDARD_OPTIONS.value.length)
const someChecked = computed(() => stdDraft.value.length > 0 && !allChecked.value)
const toggleAll = (checked) => { stdDraft.value = checked ? [...STANDARD_OPTIONS.value] : [] }

const applyStd = () => {
  stdSelected.value = [...stdDraft.value]
  saveStdSelected() // 持久化，预览弹窗的「执行标准」读取同一份数据
  formData.standard = standardText.value
  stdPopShow.value = false
}
const cancelStd = () => { stdPopShow.value = false }

// 表单数据
const formData = reactive({
  reportNo: '2026113296',
  appearance: '合格',
  disassembly: '合格',
  standard: 'TSG 92-2026；GB/T12241-2021；GB/T12243-2021',
  remark: '无',
  newItem: '',
  medium: '氮气',
  temp: '常温',
  leakage: '0',
  deviceType: 'pressure',
  isPass: 'pass',
  maintenance: [],
  maintenanceRemark: ''
})

// 提交逻辑
const handleSubmit = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      console.log('提交的数据：', formData)
      // 这里可以触发 axios 请求，或者提交给后端
      window.$message?.success('校验信息已保存！')
      showModal.value = false
    } else {
      window.$message?.error('请检查必填项')
    }
  })
}

// 暴露给父组件调用
const open = () => {
  showModal.value = true
}
defineExpose({ open })
</script>

<style scoped lang="scss">
// 使用 Naive UI 时，表单标签默认会偏上。我们可以微调一下让其对齐更好看
:deep(.n-form-item-label) {
  color: #333;
}

// 执行标准多选面板
.std-panel {
  .std-item {
    padding: 4px 0;
  }
  .std-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #e0e0e0;
  }
}

// 结论区域的灰色背景框，让视觉更聚焦
.conclusion-wrapper {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  
  .hint-text {
    margin: 0 0 12px 0;
    color: #666;
    font-size: 13px;
  }
}
</style>