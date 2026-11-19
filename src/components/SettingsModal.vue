<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="操作设置"
    style="width: 640px; max-width: 92vw;"
    :bordered="false"
    :segmented="{ content: true }"
    :closable="true"
  >
    <div class="settings-body">
      <!-- 记录：开始 / 结束 -->
      <div class="section-label">记录</div>
      <div class="record-row">
        <span class="row-label">开始</span>
        <n-radio-group v-model:value="record.startUnit" size="small">
          <n-radio value="%">%</n-radio>
          <n-radio value="MPa">MPa</n-radio>
        </n-radio-group>
        <n-input-number
          v-model:value="record.startValue"
          size="small"
          :min="0"
          :max="record.startUnit === '%' ? 100 : undefined"
          :step="record.startUnit === '%' ? 1 : 0.1"
          style="width: 130px;"
        />
        <span class="unit">{{ record.startUnit }}</span>
      </div>
      <div class="record-row">
        <span class="row-label">结束</span>
        <n-radio-group v-model:value="record.endUnit" size="small">
          <n-radio value="%">%</n-radio>
          <n-radio value="MPa">MPa</n-radio>
        </n-radio-group>
        <n-input-number
          v-model:value="record.endValue"
          size="small"
          :min="0"
          :max="record.endUnit === '%' ? 100 : undefined"
          :step="record.endUnit === '%' ? 1 : 0.1"
          style="width: 130px;"
        />
        <span class="unit">{{ record.endUnit }}</span>
      </div>

      <!-- 量程：自动量程 + 量程切换 -->
      <div class="section-label">量程</div>
      <div class="range-block">
        <div class="range-line">
          <span class="row-label" style="width: 70px;"></span>
          <n-checkbox v-model:checked="autoRange">自动量程</n-checkbox>
        </div>
        <div class="range-line">
          <span class="row-label" style="width: 70px;">量程切换</span>
          <n-radio-group v-model:value="rangeChannel" :disabled="autoRange" size="small">
            <n-space :size="14" :wrap="false">
              <n-radio v-for="ch in RANGE_CHANNELS" :key="ch.no" :value="ch.no">
                {{ ch.label }}({{ ch.value }}MPa)
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>
      </div>

      <!-- 监控文件路径 -->
      <div class="path-row">
        <span class="row-label">监控文件路径</span>
        <n-input v-model:value="monitorPath" size="small" style="flex: 1;" />
        <n-button size="small" color="#f0a020" @click="pickPath">文件路径</n-button>
      </div>

      <!-- 合格判断 + 密封定时 -->
      <div class="judge-row">
        <n-checkbox v-model:checked="autoJudge">自动判断是否合格</n-checkbox>
        <span class="row-label" style="margin-left: 24px;">密封定时时间(s)</span>
        <n-input-number v-model:value="sealTime" size="small" :min="0" style="width: 110px;" />
      </div>
    </div>

    <!-- 底部按钮：压力表设定 / 确定 / 取消 -->
    <div class="settings-foot">
      <n-button color="#d8a520" @click="openGauge">压力表设定</n-button>
      <n-space :size="12">
        <n-button type="primary" @click="confirm">确定</n-button>
        <n-button @click="showModal = false">取消</n-button>
      </n-space>
    </div>

    <!-- 压力表设定弹窗 -->
    <GaugeModal ref="gaugeModalRef" />
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import { NModal, NRadioGroup, NRadio, NCheckbox, NInput, NInputNumber, NButton, NSpace, useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useSettingsStore, RANGE_CHANNELS } from '@/store/useSettingsStore'
import GaugeModal from './GaugeModal.vue'

const showModal = ref(false)
const message = useMessage()

const settingsStore = useSettingsStore()
// 解构到顶层：顶层 ref 在模板中自动解包，v-model 才能正常双向绑定
const { record, autoRange, rangeChannel, monitorPath, autoJudge, sealTime } = storeToRefs(settingsStore)

const gaugeModalRef = ref()

const open = () => {
  settingsStore.load() // 打开时恢复上次保存的内容
  showModal.value = true
}

// 文件路径：浏览器/Electron 内先提示手动输入
const pickPath = () => {
  message.info('请在输入框中直接填写监控文件路径')
}

const openGauge = () => {
  gaugeModalRef.value?.open()
}

const confirm = () => {
  // 记录区间：整定升压到「开始」值起录，压力曲线出现最大值后再按「结束」设定记录 50% 时间。
  // 开始/结束只是两个独立阈值，不存在大小关系，不做校验。
  settingsStore.save()
  message.success('操作设置已保存')
  showModal.value = false
}

defineExpose({ open })
</script>

<style scoped>
.settings-body {
  padding: 4px 6px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 6px 0 10px;
}

.record-row,
.range-line,
.path-row,
.judge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.row-label {
  color: #555;
  font-size: 13px;
  width: 90px;
  flex-shrink: 0;
}

.range-block {
  padding-left: 6px;
}

.unit {
  color: #555;
  font-size: 13px;
}

.path-row {
  margin-top: 6px;
}

.judge-row {
  margin-top: 16px;
  padding-top: 4px;
}

.settings-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 4px 6px 0;
}
</style>
