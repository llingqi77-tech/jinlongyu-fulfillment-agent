import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatView } from '../chat/ChatView'
import { TrackingView } from '../tracking/TrackingView'
import { useWorkflowStore } from '../../store/workflowStore'
import type { Tab } from '../../types/workflow'

const SWIPE_THRESHOLD = 50

export function SwipePages() {
  const activeTab = useWorkflowStore((s) => s.activeTab)
  const setActiveTab = useWorkflowStore((s) => s.setActiveTab)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [pageWidth, setPageWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setPageWidth(el.clientWidth))
    ro.observe(el)
    setPageWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const goToTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab)
      setDragX(0)
    },
    [setActiveTab]
  )

  const translateX =
    activeTab === 'tracking' ? -pageWidth - dragX : dragX

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (Math.abs(dy) > Math.abs(dx)) return
    e.preventDefault()
    if (activeTab === 'chat' && dx < 0) {
      setDragX(0)
      return
    }
    if (activeTab === 'tracking' && dx > 0) {
      setDragX(0)
      return
    }
    setDragX(dx)
  }

  const onTouchEnd = () => {
    if (!touchStart.current) {
      setIsDragging(false)
      return
    }
    // 左滑 → 对话；右滑 → 追踪
    if (activeTab === 'tracking' && dragX < -SWIPE_THRESHOLD) {
      goToTab('chat')
    } else if (activeTab === 'chat' && dragX > SWIPE_THRESHOLD) {
      goToTab('tracking')
    } else {
      setDragX(0)
    }
    touchStart.current = null
    setIsDragging(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className={`flex h-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
        style={{
          width: pageWidth ? pageWidth * 2 : '200%',
          transform: `translateX(${translateX}px)`,
        }}
      >
        <div className="h-full shrink-0" style={{ width: pageWidth || '50%' }}>
          <ChatView />
        </div>
        <div className="h-full shrink-0" style={{ width: pageWidth || '50%' }}>
          <TrackingView />
        </div>
      </div>
    </div>
  )
}
