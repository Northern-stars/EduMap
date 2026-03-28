'use client'

import { useCanvasStore } from '@/lib/canvas-store'

interface Props {
  isConnecting: boolean
  onStartConnect: () => void
  onStopConnect: () => void
  onAddNode: () => void
  onDeleteSelected: () => void
  onAutoLayout: () => void
}

export default function MindMapFloatingToolbar({
  isConnecting,
  onStartConnect,
  onStopConnect,
  onAddNode,
  onDeleteSelected,
  onAutoLayout,
}: Props) {
  const { selectedMindMapNodeId } = useCanvasStore()

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
        className={`mindmap-floating-btn ${isConnecting ? 'active' : ''}`}
        onClick={isConnecting ? onStopConnect : onStartConnect}
        title={isConnecting ? '取消连接' : '连接模式 (Shift+点击)'}
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