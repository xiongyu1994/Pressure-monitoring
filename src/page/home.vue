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
    <TaskListModal ref="taskModalRef" @sendTask="getTask"/>
    <!-- 预览组件 -->
    <PreviewModal ref="previewModalRef" />
    <!-- 填写评论 -->
    <CommentFormModal ref="commentModalRef" />
    <!-- 重新校验弹窗 -->
    <RestartModal ref="restartModalRef" />
    <div class="foot">
      <n-space align="center" v-if = "activeKey === 'setPressure'">
        <n-button type="primary" @click="reverify">重新校验</n-button>
        <p>整定压力</p>
      </n-space>
    </div>
    
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
import { usePressureStore } from '@/store/usePressureStore'
const store = usePressureStore()
const activeKey = ref('')
const taskModalRef = ref()
const previewModalRef = ref()
const commentModalRef = ref()
const restartModalRef = ref()
const taskId = ref('')
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
const getTask = (data) => {
  taskId.value = data.taskId


  //获取当前任务 相关数据  1.整体传入  2.接口查询
  

}
// 重新校验
const reverify = () => {
  restartModalRef.value?.open()
}
const handleOpenTaskModal = (item) => {
    activeKey.value = item.name
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

.foot {
  padding-left: 20px;
  p {
    color: #ff7875;
  }
}
</style>