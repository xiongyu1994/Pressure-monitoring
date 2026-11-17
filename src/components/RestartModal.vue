<template>
  <n-modal 
    v-model:show="showModal" 
    preset="card" 
    title="重新开始校验" 
    style="width: 360px;"
    :bordered="false"
    :closable="true"
    class="custom-modal"
    header-style="background-color: #1d5cd6; color: white; padding: 12px 20px;"
  >
    <!-- 主体内容 -->
    <div class="modal-content">
      <n-checkbox-group v-model:value="checkedItems">
        <n-space vertical size="large">
          <n-checkbox value="first" label="删除第一次实验数据" />
          <n-checkbox value="second" label="删除第二次实验数据" />
          <n-checkbox value="third" label="删除第三次实验数据" />
        </n-space>
      </n-checkbox-group>

      <!-- 操作按钮区 -->
      <div class="action-buttons">
        <!-- 全选 / 全不选 -->
        <div class="row">
          <n-button type="warning" class="btn" @click="handleSelectAll">全选</n-button>
          <n-button type="warning" class="btn" @click="handleClearAll">全不选</n-button>
        </div>
        <!-- 确定 / 取消 -->
        <div class="row">
          <n-button type="info" class="btn" @click="handleConfirm">确定</n-button>
          <n-button class="btn cancel-btn" @click="showModal = false">取消</n-button>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import { NModal, NCheckboxGroup, NCheckbox, NSpace, NButton, useMessage } from 'naive-ui'

// 控制弹窗显示
const showModal = ref(false)
const message = useMessage()

// 绑定的选中项（存储的是 n-checkbox 的 value）
const checkedItems = ref([])

// 全选逻辑
const handleSelectAll = () => {
  checkedItems.value = ['first', 'second', 'third']
}

// 全不选逻辑
const handleClearAll = () => {
  checkedItems.value = []
}

// 确定逻辑
const handleConfirm = () => {
  if (checkedItems.value.length === 0) {
    message.warning('请至少选择一项要删除的数据')
    return
  }
  
  console.log('需要删除的数据：', checkedItems.value)
  
  // 💡 这里可以触发向 Node.js 发送清空数据的 WebSocket 指令
  // wsInstance.send(JSON.stringify({ action: 'clearData', targets: checkedItems.value }))
  
  message.success('已重置选中的校验数据')
  showModal.value = false
}

// 暴露给父组件调用
const open = () => {
  // 每次打开时清空选中状态
  checkedItems.value = []
  showModal.value = true
}
defineExpose({ open })
</script>

<style scoped lang="scss">
.custom-modal {
  // 覆盖 Naive UI 的默认头部样式，还原照片里的蓝色标题栏
  :deep(.n-card-header__main) {
    color: white;
    font-weight: bold;
  }
  :deep(.n-card-header__close) {
    color: white;
    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
  // 让弹窗整体圆角小一点，更符合工业软件硬朗的风格
  :deep(.n-card) {
    border-radius: 4px;
  }
}

.modal-content {
  // 照片里弹窗内部有一层淡淡的格子背景，这里用浅灰色替换，保持清爽
  background-color: #f9f9f9;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  // 复选框文字稍微放大加粗一点
  :deep(.n-checkbox__label) {
    font-size: 15px;
    color: #333;
  }
}

.action-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;

  .row {
    display: flex;
    gap: 16px;
    width: 100%;
    justify-content: center;
  }

  .btn {
    width: 100px;
    font-weight: bold;
    font-size: 15px;
  }

  // 还原照片里灰色的取消按钮
  .cancel-btn {
    background-color: #d9d9d9;
    color: #555;
    border-color: #d9d9d9;
    &:hover {
      background-color: #c0c0c0;
      color: #333;
    }
  }
}
</style>