import type { TrackingScreenState, TrackingSystem } from '../types/workflow'
import { MOCK_PARSED_ORDER, MOCK_SHORTAGE_LINES } from '../mocks/parsedOrder'
import { useWorkflowStore } from './workflowStore'

export const INITIAL_SCREEN: TrackingScreenState = {
  view: 'launch',
  activeField: null,
  filledFields: {},
  highlightedSkus: [],
  tableRowsVisible: 0,
  flashSave: false,
  statusText: '等待 Agent 连接…',
  loginProgress: 0,
}

export async function runScreenAction(
  action: string,
  durationMs: number,
  system?: TrackingSystem
) {
  const store = useWorkflowStore.getState()
  if (system) store.setTrackingSystem(system)

  const order = () => useWorkflowStore.getState().pendingOrder
  const draft = () => useWorkflowStore.getState().purchaseDraft
  const setScreen = (patch: Partial<TrackingScreenState>) =>
    store.setTrackingScreen({ ...useWorkflowStore.getState().trackingScreen, ...patch })

  const tick = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const stepDelay = Math.max(320, Math.floor(durationMs / 4))

  switch (action) {
    case 'order_launch':
      setScreen({
        view: 'launch',
        filledFields: {},
        tableRowsVisible: 0,
        statusText: '正在启动订单系统…',
      })
      await tick(durationMs)
      break

    case 'order_login': {
      setScreen({ view: 'login', loginProgress: 0, statusText: '正在登录 OMS…' })
      for (let p = 1; p <= 4; p++) {
        setScreen({ loginProgress: p * 25, statusText: p < 4 ? '验证账号凭证…' : '登录成功' })
        await tick(stepDelay)
      }
      await tick(stepDelay)
      break
    }

    case 'order_ocr':
      setScreen({
        view: 'app',
        filledFields: {},
        tableRowsVisible: 0,
        statusText: 'OCR 识别订单文档…',
      })
      await tick(durationMs)
      break

    case 'order_open':
      setScreen({
        view: 'app',
        filledFields: {},
        tableRowsVisible: 0,
        statusText: '打开订单录入界面…',
      })
      await tick(durationMs)
      break

    case 'inventory_launch':
      setScreen({
        view: 'launch',
        statusText: '正在启动库存系统…',
      })
      await tick(durationMs)
      break

    case 'inventory_login': {
      setScreen({ view: 'login', loginProgress: 0, statusText: '正在登录 WMS…' })
      for (let p = 1; p <= 4; p++) {
        setScreen({ loginProgress: p * 25, statusText: '同步仓库数据…' })
        await tick(stepDelay)
      }
      break
    }

    case 'po_launch':
      setScreen({
        view: 'launch',
        statusText: '正在启动采购系统…',
      })
      await tick(durationMs)
      break

    case 'po_login': {
      setScreen({ view: 'login', loginProgress: 0, statusText: '正在登录 SRM…' })
      for (let p = 1; p <= 4; p++) {
        setScreen({ loginProgress: p * 25, statusText: '加载供应商目录…' })
        await tick(stepDelay)
      }
      break
    }

    case 'order_fill_header': {
      const o = MOCK_PARSED_ORDER
      setScreen({ view: 'app', activeField: 'hotelName', statusText: '填写客户信息…' })
      await tick(stepDelay)
      setScreen({
        filledFields: { hotelName: o.hotelName, contact: o.contact },
        activeField: 'contact',
      })
      await tick(stepDelay)
      setScreen({ activeField: null })
      await tick(stepDelay)
      break
    }

    case 'order_fill_lines': {
      const lines = MOCK_PARSED_ORDER.lines
      for (let i = 0; i < lines.length; i++) {
        setScreen({
          activeField: `line-${i}`,
          tableRowsVisible: i + 1,
          statusText: `录入 SKU：${lines[i].sku}`,
        })
        await tick(stepDelay)
      }
      setScreen({ activeField: null, statusText: '校验行项目…' })
      await tick(stepDelay)
      break
    }

    case 'order_save':
      setScreen({ view: 'app', flashSave: true, statusText: '保存订单…' })
      await tick(durationMs * 0.6)
      setScreen({ flashSave: false, statusText: '订单已保存' })
      await tick(durationMs * 0.4)
      break

    case 'order_edit': {
      const o = order()
      if (!o) {
        setScreen({ statusText: '同步待转单修改…', flashSave: true })
        await tick(durationMs)
        setScreen({ flashSave: false, statusText: '待转单已更新' })
        break
      }

      const editedSkus = useWorkflowStore.getState().trackingScreen.highlightedSkus
      setScreen({ view: 'app', statusText: '同步待转单修改…', flashSave: false })

      if (o.hotelName) {
        setScreen({ activeField: 'hotelName', statusText: '更新酒店/客户信息…' })
        await tick(stepDelay)
        setScreen({
          filledFields: { hotelName: o.hotelName, contact: o.contact, orderId: o.id },
          activeField: 'contact',
        })
        await tick(stepDelay)
      }

      for (let i = 0; i < o.lines.length; i++) {
        const line = o.lines[i]
        const isEdited = editedSkus.includes(line.sku)
        setScreen({
          activeField: `line-${i}`,
          tableRowsVisible: i + 1,
          highlightedSkus: isEdited ? editedSkus : [],
          statusText: isEdited ? `更新 ${line.sku} 数量 → ${line.quantity}${line.unit}` : `校验 ${line.sku}…`,
        })
        await tick(stepDelay)
      }

      setScreen({
        activeField: null,
        highlightedSkus: editedSkus,
        tableRowsVisible: o.lines.length,
        filledFields: { hotelName: o.hotelName, contact: o.contact, orderId: o.id },
        flashSave: true,
        statusText: '保存待转单修改…',
      })
      await tick(durationMs * 0.55)
      setScreen({ flashSave: false, statusText: '待转单已更新' })
      await tick(durationMs * 0.25)
      break
    }

    case 'sales_convert':
      setScreen({ statusText: '转为销售订单…', flashSave: true })
      await tick(durationMs)
      setScreen({
        flashSave: false,
        statusText: `销售单已生成：${useWorkflowStore.getState().salesOrder?.id ?? ''}`,
      })
      break

    case 'inventory_open':
      setScreen({
        view: 'app',
        tableRowsVisible: MOCK_SHORTAGE_LINES.length,
        highlightedSkus: [],
        statusText: '加载库存数据…',
      })
      await tick(durationMs * 0.5)
      break

    case 'inventory_match': {
      const shortage = MOCK_SHORTAGE_LINES.filter((l) => l.gap > 0).map((l) => l.sku)
      for (let i = 0; i < shortage.length; i++) {
        setScreen({
          highlightedSkus: shortage.slice(0, i + 1),
          statusText: `匹配 ${shortage[i]} 库存…`,
        })
        await tick(stepDelay)
      }
      setScreen({ statusText: '缺货标记完成' })
      await tick(stepDelay)
      break
    }

    case 'po_open':
      setScreen({ view: 'app', filledFields: {}, statusText: '打开采购订单录入…' })
      await tick(durationMs * 0.4)
      break

    case 'po_fill': {
      const d = draft()
      setScreen({ view: 'app', activeField: 'supplier', statusText: '填写供应商…' })
      await tick(stepDelay)
      setScreen({
        filledFields: {
          supplier: d?.supplier ?? '',
          amount: d?.amount ? String(d.amount) : '',
        },
        activeField: 'amount',
      })
      await tick(stepDelay)
      setScreen({ activeField: null, flashSave: true, statusText: '提交采购单…' })
      await tick(durationMs * 0.5)
      setScreen({
        flashSave: false,
        statusText: `采购单已提交：${useWorkflowStore.getState().purchaseOrder?.id ?? ''}`,
      })
      await tick(durationMs * 0.2)
      break
    }

    default:
      await tick(durationMs)
  }

  // sync order form when pending order exists
  const po = order()
  if (po && useWorkflowStore.getState().trackingSystem === 'order') {
    const fields: Record<string, string> = {
      hotelName: po.hotelName,
      contact: po.contact,
      orderId: po.id,
    }
    setScreen({
      filledFields: { ...useWorkflowStore.getState().trackingScreen.filledFields, ...fields },
      tableRowsVisible: po.lines.length,
    })
  }
}
