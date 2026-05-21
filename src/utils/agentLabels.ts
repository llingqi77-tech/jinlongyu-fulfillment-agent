import type { AgentStepIcon, TrackingSystem } from '../types/workflow'

export function stepIcon(screenAction?: string, detail?: string): AgentStepIcon {
  if (!screenAction) return detail?.includes('理解') ? 'search' : 'click'
  if (
    screenAction.includes('launch') ||
    screenAction.includes('login') ||
    screenAction.includes('open') ||
    screenAction === 'inventory_open' ||
    screenAction === 'order_ocr'
  )
    return 'search'
  if (screenAction.includes('fill') || screenAction.includes('edit')) return 'input'
  if (screenAction === 'inventory_match') return 'search'
  return 'click'
}

export function formatStepDisplay(
  detail: string,
  screenAction?: string,
  system?: TrackingSystem
): string {
  const sys = systemLabel(system)
  const label = actionLabel(screenAction)
  if (label === '打开') return `点击 打开「${sys}」`
  if (label === '录入' || label === '填写') return `输入 ${detail}`
  if (label === '保存') return `点击 保存订单`
  if (label === '登录') return `输入 登录${sys}`
  if (label === '启动') return `点击 启动${sys}`
  if (label === '更新') return `输入 ${detail}`
  if (label === '提交') return `点击 提交至${sys}`
  if (label === '查询') return `搜索 ${detail}`
  if (label === '匹配') return `搜索 ${detail}`
  if (detail.includes('理解')) return `搜索 ${detail}`
  return detail
}

export function actionLabel(screenAction?: string): string {
  const map: Record<string, string> = {
    order_launch: '启动',
    order_login: '登录',
    order_ocr: '查询',
    order_open: '打开',
    order_fill_header: '录入',
    order_fill_lines: '录入',
    order_save: '保存',
    order_edit: '更新',
    sales_convert: '提交',
    inventory_launch: '启动',
    inventory_login: '登录',
    inventory_open: '查询',
    inventory_match: '匹配',
    po_launch: '启动',
    po_login: '登录',
    po_open: '打开',
    po_fill: '填写',
  }
  return screenAction ? (map[screenAction] ?? '执行') : '执行'
}

export function systemLabel(system?: TrackingSystem): string {
  const map: Record<TrackingSystem, string> = {
    order: '订单系统',
    inventory: '库存系统',
    purchase: '采购系统',
  }
  return system ? map[system] : '金龙鱼系统'
}
