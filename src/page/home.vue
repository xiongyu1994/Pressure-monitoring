<template>
  <div class="home-page">
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

    <!-- 压力组件：占满工具栏以下的剩余高度，选中任务后右侧显示安全阀信息 -->
    <PressureMonitorNew
      ref="monitorRef"
      class="pressure-area"
      :task="currentTask"
      :mode="activeKey"
      @peak-change="handlePeakChange"
      @curves-change="handleCurvesChange"
    ></PressureMonitorNew>

    <!-- 任务组件 -->
    <TaskListModal ref="taskModalRef" @sendTask="getTask"/>
    <!-- 预览组件：展示当前校验编号的设备信息与抓取的定压记录曲线 -->
    <PreviewModal ref="previewModalRef" :task="currentTask" :curves="taskCurves" />
    <!-- 填写评论 -->
    <CommentFormModal ref="commentModalRef" />
    <!-- 重新校验弹窗 -->
    <RestartModal ref="restartModalRef" @confirm="handleRestartConfirm" />
    <!-- 操作设置弹窗（内含压力表设定） -->
    <SettingsModal ref="settingsModalRef" />

    <!-- 底部按钮条：开始整定后显示；降压密封模式下由密封统计条替代 -->
    <div class="foot" v-if="currentTask && activeKey !== 'seal'">
      <n-space v-if="currentTask" :size="12" align="center" :wrap="false">
        <n-button type="primary" size="small" @click="reverify">重新校验</n-button>
        <p :class="verdictClass">整定压力：{{ peakText }}</p>
      </n-space>
    </div>
  </div>
</template>

<script setup>
import PressureMonitorNew from '../components/PressureMonitorNew.vue'
import TaskListModal from '../components/TaskListModal.vue'
import PreviewModal from '../components/PreviewModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
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
const settingsModalRef = ref()
const monitorRef = ref()
const taskId = ref('')
const currentTask = ref(null) // 开始整定时选中的任务行
// 曲线峰值与合格判定（PressureMonitorNew 上报）
const peakInfo = ref({ peak: null, verdict: 'none' })
// 当前校验编号抓取的定压记录曲线（1~3 条，预览弹窗展示用）
const taskCurves = ref([])

const handlePeakChange = (info) => {
  peakInfo.value = info
}

const handleCurvesChange = (payload) => {
  taskCurves.value = payload?.curves || []
}

// 整定压力文本：有峰值显示峰值，否则 --
const peakText = computed(() => {
  const p = peakInfo.value.peak
  return p === null ? '--' : `${Number(p).toFixed(3)} MPa`
})

// 判定染色：合格绿 / 不合格红 / 未判定默认
const verdictClass = computed(() => {
  if (peakInfo.value.verdict === 'pass') return 'verdict-pass'
  if (peakInfo.value.verdict === 'fail') return 'verdict-fail'
  return ''
})
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
  currentTask.value = data.task || null
  // 开始整定后，「整定压力」进入选中状态，右侧数据面板随之展示
  activeKey.value = 'setPressure'
  // 获取当前任务相关数据：1. 整体传入（已实现）  2. 接口查询兜底
}

// 整定压力展示：空值显示 --
const formatPress = (val) => {
  if (val === null || val === undefined || val === '') return '--'
  return `${val} MPa`
}

// 重新校验：清零曲线峰值重新判定，并打开确认弹窗
const reverify = () => {
  monitorRef.value?.resetPeak()
  // 打开弹窗时传入已抓取的曲线条数，复选框按条数动态生成
  restartModalRef.value?.open(taskCurves.value.length)
}

// 重新校验弹窗确认：删除勾选的第 N 次曲线记录，PressureMonitorNew 自动恢复抓取补齐（全删则重新抓 3 次）
const handleRestartConfirm = (nos) => {
  monitorRef.value?.deleteCurves(nos)
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
        case 'settings':
            settingsModalRef.value?.open()
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
/* 整页 100vh 纵向布局：工具栏 / 图表（弹性） / 底部按钮条 */
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  background: #f5f5f5;
}

.top-toolbar {
  flex-shrink: 0;
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

/* 压力监控组件：占满工具栏与底部按钮条之间的全部空间 */
.pressure-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.foot {
  flex-shrink: 0;
  min-height: 20px;
  display: flex;
  align-items: center;
  padding: 2px 20px 4px;

  p {
    color: #000; /* 默认黑色，合格变绿、不合格变红 */
    margin: 0;
    font-size: 13px;
  }

  /* 整定压力判定染色 */
  p.verdict-pass { color: #52c41a; }
  p.verdict-fail { color: #f5222d; }
}
</style>
