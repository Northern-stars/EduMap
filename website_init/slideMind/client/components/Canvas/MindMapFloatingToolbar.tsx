'use client'

import { useState } from 'react'
import { useCanvasStore } from '@/lib/canvas-store'

interface Props {
  isConnecting: boolean
  onStartConnect: () => void
  onStopConnect: () => void
  onAddNode: () => void
  onDeleteSelected: () => void
  onAutoLayout: () => void
  onExplain: () => void
}

export default function MindMapFloatingToolbar({
  isConnecting,
  onStartConnect,
  onStopConnect,
  onAddNode,
  onDeleteSelected,
  onAutoLayout,
  onExplain,
}: Props) {
  const [isExplaining, setIsExplaining] = useState(false)
  const { selectedMindMapNodeId, isDragToolActive, setDragToolActive, selectedTerm } = useCanvasStore()

  const handleExplain = async () => {
    if (!selectedTerm || isExplaining) return
    setIsExplaining(true)
    try {
      await onExplain()
    } finally {
      setIsExplaining(false)
    }
  }

  return (
    <div className="mindmap-floating-toolbar">
      <button
        className="mindmap-floating-btn"
        onClick={onAddNode}
        title="添加节点"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <button
        className={`mindmap-floating-btn ${isDragToolActive ? 'active' : ''}`}
        onClick={() => setDragToolActive(!isDragToolActive)}
        title="拖拽工具"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      <button
        className={`mindmap-floating-btn ${isConnecting ? 'active' : ''}`}
        onClick={isConnecting ? onStopConnect : onStartConnect}
        title={isConnecting ? '取消连接' : '连接模式'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>

      <button
        className="mindmap-floating-btn"
        onClick={onAutoLayout}
        title="自动布局"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      </button>

      <div className="mindmap-floating-divider" />

      <button
        className="mindmap-floating-btn"
        onClick={handleExplain}
        disabled={!selectedTerm || isExplaining}
        title={selectedTerm ? `解释: ${selectedTerm}` : '先选中要解释的文本'}
      >
        {isExplaining ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      <div className="mindmap-floating-divider" />

      <button
        className="mindmap-floating-btn danger"
        onClick={onDeleteSelected}
        disabled={!selectedMindMapNodeId}
        title="删除选中节点"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}