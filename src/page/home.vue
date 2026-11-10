<template>
    <div class="top-toolbar">
    <n-space size="large" align="center">
        <div 
            v-for="item in tabs" 
            :key="item.name"
            class="tool-btn"
            :class="{ active: activeKey === item.name }"
            @click="handleOpenTaskModal(item)"
        >
            <n-icon size="20">
            <component :is="item.icon" />
            </n-icon>
            <span>{{ item.label }}</span>
        </div>
    </n-space>
  </div>
    <!-- 压力组件 -->
    <PressureMonitorNew></PressureMonitorNew>
    <!-- 任务组件 -->
    <TaskListModal ref="taskModalRef" />
    <!-- 预览组件 -->
    <PreviewModal ref="previewModalRef" />
    <!-- 填写评论 -->
    <CommentFormModal ref="commentModalRef" />


</template>

<script setup>
import PressureMonitorNew from '../components/PressureMonitorNew.vue'
import TaskListModal from '../components/TaskListModal.vue'
import PreviewModal from '../components/PreviewModal.vue'
import { 
  ListOutline, 
  TrendingDownOutline, 
  LockClosedOutline, 
  CreateOutline, // 填写评论
  SaveOutline, 
  EyeOutline,    // 预览
  SettingsOutline, // 操作设置
  OptionsOutline   // 校压力
} from '@vicons/ionicons5'
const activeKey = ref('')
const taskModalRef = ref()
const previewModalRef = ref()
const commentModalRef = ref()
const tabs = [
    { name: 'task', label: '任务栏', icon: ListOutline },
    { name: 'setPressure', label: '整定压力', icon: TrendingDownOutline },
    { name: 'seal', label: '降压密封', icon: LockClosedOutline },
    { name: 'comment', label: '填写评论', icon: CreateOutline }, 
    { name: 'save', label: '存盘', icon: SaveOutline },
    { name: 'preview', label: '预览', icon: EyeOutline }, 
    { name: 'settings', label: '操作设置', icon: SettingsOutline },
    { name: 'calibrate', label: '校压力', icon: OptionsOutline },
]
const handleOpenTaskModal = (item) => {
    activeKey.value = item.name
    console.log("activeKey.value...",activeKey.value)
    switch (activeKey.value) {
        case 'task': 
            taskModalRef.value?.open()
            break;
        case 'preview': 
            previewModalRef.value?.open()
            break;
        case 'comment': 
            commentModalRef.value?.open()
            break;
        default:
            break;
    }
    
}
</script>
<style lang="scss" scoped>
.top-toolbar {
  background: #4a5e76; /* 深蓝色背景 */
  padding: 10px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0c4de; /* 浅灰蓝色文字 */
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
  gap: 6px;

}

.tab-item span {
  font-size: 13px;
}

/* 悬浮状态 */
.tool-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

/* 选中（激活）状态：高亮底色 + 亮白文字 */
.tool-btn.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  //border-bottom: 3px solid #1890ff; /* 底部加个蓝条，更有工业软件的感觉 */
}
</style>