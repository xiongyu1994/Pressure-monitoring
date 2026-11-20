import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 操作设置 store：操作设置弹窗 + 压力表设定弹窗的数据，localStorage 持久化。
 * 表单字段与后端 /c/task/result 的 pressure_gauge_* 系列字段对应，便于后续上传。
 */
const STORAGE_KEY = 'pm-operation-settings'

// 量程切换档位（与校验台软件一致）
export const RANGE_CHANNELS = [
  { no: 1, label: '量程1', value: 1.6 },
  { no: 2, label: '量程2', value: 4.0 },
  { no: 3, label: '量程3', value: 10.0 },
  { no: 4, label: '量程4', value: 16.0 },
  { no: 5, label: '量程5', value: 60.0 }
]

// 生效量程档位序号（1~5）——统一的选档规则，图表 Y 轴 / 操作设置弹窗 / 信息填写弹窗共用：
//   手动量程（未勾自动量程）→ 用户所选档位
//   自动量程 → 按任务压力级别范围上限选最小能覆盖的档位
//   （0.50~0.70 → 量程1(1.6)；10~15 → 量程4(16)；无范围/超全档取最大档）
export const resolveEffectiveChannel = (autoRange, rangeChannel, pressClassRangeMax) => {
  if (!autoRange) return rangeChannel
  const hi = Number(pressClassRangeMax)
  if (!Number.isFinite(hi) || hi <= 0) return RANGE_CHANNELS[RANGE_CHANNELS.length - 1].no
  const ch = RANGE_CHANNELS.find((c) => c.value >= hi)
  return ch ? ch.no : RANGE_CHANNELS[RANGE_CHANNELS.length - 1].no
}

// 压力表默认预填的标准量程序列 + 精度等级
const DEFAULT_GAUGE_RANGES = [0.04, 0.06, 0.1, 0.16, 0.25, 0.4, 0.6, 1.0, 1.6, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0]
const DEFAULT_GAUGE_ACCURACY = '0.4'

const buildDefaultGauges = () =>
  DEFAULT_GAUGE_RANGES.map((range, i) => ({
    id: i + 1,
    num: '',            // 表编号1
    life: '',           // 有效期1
    num2: '',           // 表编号2
    life2: '',          // 有效期2
    standard: '',       // 标准器
    stdLife: '',        // 标准器有效期
    range,              // 量程(MPa)
    accuracy: DEFAULT_GAUGE_ACCURACY // 精度等级
  }))

export const useSettingsStore = defineStore('settings', () => {
  // 记录区间阈值：整定升压到「开始」值起录；压力曲线出现最大值后，再按「结束」设定继续记录 50% 时间。
  // 开始/结束是两个独立阈值（单位 % 或 MPa），不存在大小关系。
  const record = ref({ startUnit: '%', startValue: 70, endUnit: '%', endValue: 50 })
  // 量程
  const autoRange = ref(true)
  const rangeChannel = ref(2) // 默认量程2(4.0MPa)，自动量程时禁用
  // 监控文件路径
  const monitorPath = ref('D:\\shkf\\监控文件')
  // 自动判断是否合格 / 密封定时时间(s)
  const autoJudge = ref(true)
  const sealTime = ref(10)
  // 压力表列表
  const gauges = ref(buildDefaultGauges())

  // 启动时从 localStorage 恢复
  const load = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.record) record.value = { ...record.value, ...saved.record }
      if (typeof saved.autoRange === 'boolean') autoRange.value = saved.autoRange
      if (Number.isFinite(saved.rangeChannel)) rangeChannel.value = saved.rangeChannel
      if (saved.monitorPath) monitorPath.value = saved.monitorPath
      if (typeof saved.autoJudge === 'boolean') autoJudge.value = saved.autoJudge
      if (Number.isFinite(saved.sealTime)) sealTime.value = saved.sealTime
      if (Array.isArray(saved.gauges) && saved.gauges.length) {
        gauges.value = saved.gauges.map((g, i) => ({ id: g.id ?? i + 1, ...buildDefaultGauges()[0], ...g }))
      }
    } catch (e) { /* 存储损坏时忽略，用默认值 */ }
  }

  // 确定时保存
  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        record: record.value,
        autoRange: autoRange.value,
        rangeChannel: rangeChannel.value,
        monitorPath: monitorPath.value,
        autoJudge: autoJudge.value,
        sealTime: sealTime.value,
        gauges: gauges.value
      }))
    } catch (e) { /* file:// 下存储异常时忽略 */ }
  }

  const resetGauges = () => { gauges.value = buildDefaultGauges() }

  return { record, autoRange, rangeChannel, monitorPath, autoJudge, sealTime, gauges, load, save, resetGauges }
})
