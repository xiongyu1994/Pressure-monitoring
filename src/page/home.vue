<template>
    <div class="top-toolbar">
    <div class="toolbar-inner">
      <n-space size="large" align="center" class="tab-group">
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

      <div class="user-area">
        <span class="user-label">当前用户</span>
        <span class="user-name">{{ auth.displayName || auth.username }}</span>
        <span class="user-divider"></span>
        <button class="logout-btn" type="button" @click="handleLogout">退出登录</button>
      </div>
    </div>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/useAuthStore'

const router = useRouter()
const auth = useAuthStore()
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

// 退出登录：清除会话并回到登录页
const handleLogout = () => {
  if (!window.confirm('确认退出登录吗？')) return
  auth.logout()
  router.replace('/login')
}
</script>
<style lang="scss" scoped>
.top-toolbar {
  background: #4a5e76; /* 深蓝色背景 */
  padding: 10px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.toolbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.tab-group {
  flex-wrap: wrap;
  row-gap: 4px;
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

.tool-btn span {
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

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: 13px;
}

.user-label {
  color: #8fa6bf;
}

.user-name {
  color: #ffffff;
}

.user-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.25);
}

.logout-btn {
  padding: 5px 12px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 4px;
  background: transparent;
  color: #e7eef6;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.6);
}

.foot {
  padding-left: 20px;
  p {
    color: #ff7875;
  }
}
</style>
