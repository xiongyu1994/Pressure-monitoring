// src/api/task.js
// C 端任务接口封装（对位 admin-system 后端 /c/task/*）。
// GET /c/task/list?custName=&idNo=&orderCode=&page=&limit=
// 返回 { list, total, page, limit }，list 字段见 capi.php 的 api_c_task_list。
import { useAuthStore } from '@/store/useAuthStore'
import { apiGet, apiPost, isRemoteAuth } from './auth'

// 本地演示数据（未配置后端时使用）
const MOCK_TASKS = [
  { id: 1, custName: '松滋市凯迪阳光生物能源开发有限公司', vavleModel: '弹簧式', orderCode: '2026113298', setPress: '0.02', tightnessPress: '0', diameterNominal: '80', seatSize: '', workingPress: '0.01', idNo: 'SFV-2026-101', status: 'wait', inspector: '' },
  { id: 2, custName: '松滋市凯迪阳光生物能源开发有限公司', vavleModel: '弹簧式', orderCode: '2026113297', setPress: '0.02', tightnessPress: '0', diameterNominal: '80', seatSize: '', workingPress: '0.01', idNo: 'SFV-2026-102', status: 'wait', inspector: '' },
  { id: 3, custName: '松滋市凯迪阳光生物能源开发有限公司', vavleModel: '弹簧式', orderCode: '2026113295', setPress: '0.05', tightnessPress: '0.02', diameterNominal: '10', seatSize: '', workingPress: '0.03', idNo: 'SFV-2026-103', status: 'wait', inspector: '' },
  { id: 4, custName: '松滋市凯迪阳光生物能源开发有限公司', vavleModel: '弹簧式', orderCode: '2026113294', setPress: '0.05', tightnessPress: '0.02', diameterNominal: '10', seatSize: '', workingPress: '0.03', idNo: 'SFV-2026-104', status: 'wait', inspector: '' },
  { id: 5, custName: '松滋市凯迪阳光生物能源开发有限公司', vavleModel: '弹簧式', orderCode: '2026113293', setPress: '0.80', tightnessPress: '0.72', diameterNominal: '15', seatSize: '', workingPress: '0.70', idNo: 'SFV-2026-105', status: 'inspection', inspector: '张校验' },
  { id: 6, custName: '松滋市凯迪阳光生物能源开发有限公司', vavleModel: '弹簧式', orderCode: '2026113292', setPress: '0.70', tightnessPress: '0.63', diameterNominal: '15', seatSize: '', workingPress: '0.70', idNo: 'SFV-2026-106', status: 'wait', inspector: '' },
  { id: 7, custName: '公安县兴成燃气有限公司', vavleModel: '弹簧式', orderCode: '2026113120', setPress: '27.50', tightnessPress: '24.75', diameterNominal: '15', seatSize: '', workingPress: '24.00', idNo: 'SFV-2026-107', status: 'wait', inspector: '' },
  { id: 8, custName: '公安县兴成燃气有限公司', vavleModel: '弹簧式', orderCode: '2026113119', setPress: '3.90', tightnessPress: '3.51', diameterNominal: '25', seatSize: '', workingPress: '3.50', idNo: 'SFV-2026-108', status: 'inspection', inspector: '张校验' }
]

export async function fetchTaskList({
  custName = '',
  idNo = '',
  orderCode = '',
  page = 1,
  limit = 20
} = {}) {
  // 本地演示模式：假数据 + 前端过滤分页
  if (!isRemoteAuth) {
    const match = (value, keyword) =>
      !keyword || String(value || '').toLowerCase().includes(keyword.toLowerCase())
    const filtered = MOCK_TASKS.filter(
      (t) =>
        match(t.custName, custName) &&
        match(t.idNo, idNo) &&
        match(t.orderCode, orderCode)
    )
    const start = (page - 1) * limit
    return {
      list: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit
    }
  }

  const auth = useAuthStore()
  return apiGet(
    '/c/task/list',
    { custName, idNo, orderCode, page, limit },
    auth.token
  )
}

// 领取任务（开始整定时调用）：wait → inspection，后端同时把 inspector 记为操作员姓名
// 返回 { orderCode, status }；他人已领取时后端会报错
export async function claimTask(id) {
  if (!isRemoteAuth) {
    // 本地演示模式：直接把对应假数据标记为检验中
    const t = MOCK_TASKS.find((item) => item.id === id)
    if (t) {
      t.status = 'inspection'
      t.inspector = t.inspector || '操作员'
    }
    return { orderCode: t?.orderCode || '', status: 'inspection' }
  }
  const auth = useAuthStore()
  return apiPost('/c/task/claim', { id }, auth.token)
}
