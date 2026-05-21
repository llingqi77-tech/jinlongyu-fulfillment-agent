import type { PendingOrder, ShortageLine } from '../types/workflow'

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

/** 邮件系统：今日待解析订单（演示数据） */
export const MOCK_TODAY_EMAIL_ORDERS: PendingOrder[] = [
  {
    id: `PO-${today}-001`,
    hotelName: '北京三里屯洲际酒店',
    contact: '张经理 / 138****8821',
    updatedAt: new Date().toISOString(),
    lines: [
      { sku: 'JLY-5L-001', name: '金龙鱼食用调和油', spec: '5L/桶', quantity: 80, unit: '桶' },
      { sku: 'JLY-1L-002', name: '金龙鱼葵花籽油', spec: '1.8L/瓶', quantity: 120, unit: '瓶' },
    ],
  },
  {
    id: `PO-${today}-002`,
    hotelName: '上海外滩华尔道夫酒店',
    contact: '李主管 / 139****6612',
    updatedAt: new Date().toISOString(),
    lines: [
      { sku: 'JLY-10KG-003', name: '金龙鱼大米', spec: '10kg/袋', quantity: 150, unit: '袋' },
      { sku: 'JLY-5L-001', name: '金龙鱼食用调和油', spec: '5L/桶', quantity: 40, unit: '桶' },
    ],
  },
  {
    id: `PO-${today}-003`,
    hotelName: '广州白天鹅宾馆',
    contact: '王采购 / 137****3308',
    updatedAt: new Date().toISOString(),
    lines: [
      { sku: 'JLY-1L-002', name: '金龙鱼葵花籽油', spec: '1.8L/瓶', quantity: 60, unit: '瓶' },
      { sku: 'JLY-10KG-003', name: '金龙鱼大米', spec: '10kg/袋', quantity: 90, unit: '袋' },
    ],
  },
]

export const MOCK_PARSED_ORDER: PendingOrder = {
  id: 'PO-20250521-001',
  hotelName: '北京三里屯洲际酒店',
  contact: '张经理 / 138****8821',
  updatedAt: new Date().toISOString(),
  lines: [
    {
      sku: 'JLY-5L-001',
      name: '金龙鱼食用调和油',
      spec: '5L/桶',
      quantity: 80,
      unit: '桶',
    },
    {
      sku: 'JLY-1L-002',
      name: '金龙鱼葵花籽油',
      spec: '1.8L/瓶',
      quantity: 120,
      unit: '瓶',
    },
    {
      sku: 'JLY-10KG-003',
      name: '金龙鱼大米',
      spec: '10kg/袋',
      quantity: 200,
      unit: '袋',
    },
  ],
}

export const MOCK_SHORTAGE_LINES: ShortageLine[] = [
  {
    sku: 'JLY-5L-001',
    name: '金龙鱼食用调和油',
    required: 80,
    available: 45,
    gap: 35,
  },
  {
    sku: 'JLY-1L-002',
    name: '金龙鱼葵花籽油',
    required: 120,
    available: 60,
    gap: 60,
  },
  {
    sku: 'JLY-10KG-003',
    name: '金龙鱼大米',
    required: 200,
    available: 200,
    gap: 0,
  },
]

export const MOCK_SUPPLIERS = [
  '益海嘉里华北供应链',
  '北京粮油批发中心',
  '京东企业购',
]

export const VOICE_EDIT_SAMPLES = [
  '把 JLY-5L-001 数量改为 100',
  '酒店名称改为北京国贸大酒店',
  '删除 JLY-10KG-003 这一行',
]

export const VOICE_PO_SAMPLES = [
  {
    transcript: '向益海嘉里华北供应链采购，金额十二万八千五百元',
    supplier: '益海嘉里华北供应链',
    amount: 128500,
  },
  {
    transcript: '请北京粮油批发中心供货，采购金额十万五千元',
    supplier: '北京粮油批发中心',
    amount: 105000,
  },
  {
    transcript: '走京东企业购，总金额九万八',
    supplier: '京东企业购',
    amount: 98000,
  },
]
