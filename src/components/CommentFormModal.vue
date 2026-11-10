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
          <n-input v-model:value="formData.standard" placeholder="请输入或选择执行标准" />
        </n-form-item-gi>
        <n-form-item-gi :span="12" label="备注">
          <n-input v-model:value="formData.remark" placeholder="请输入备注" />
        </n-form-item-gi>
      </n-grid>

      <!-- 新增 -->
      <n-form-item label="新增">
        <div style="display: flex; gap: 8px;">
          <n-input v-model:value="formData.newItem" placeholder="新增内容" />
          <n-button type="primary" style="width: 40px; padding: 0;">
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
import { ref, reactive } from 'vue'
import { 
  NModal, NForm, NGrid, NFormItemGi, NInput, NSelect, 
  NButton, NIcon, NInputGroup, NInputGroupLabel, 
  NRadioGroup, NRadio, NCheckboxGroup, NCheckbox, NSpace 
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

const showModal = ref(false)
const formRef = ref(null)

// 检查项下拉框数据
const checkOptions = [
  { label: '合格', value: '合格' },
  { label: '不合格', value: '不合格' }
]

// 表单数据
const formData = reactive({
  reportNo: '2026113296',
  appearance: '合格',
  disassembly: '合格',
  standard: 'TSG 92-2026, GB/T12241-2021; GB/T',
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