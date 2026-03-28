'use client'

import { useState } from 'react'
import { useCanvasStore, MindMapData, MindMapNode } from '@/lib/canvas-store'

export default function MindMapToolbar() {
  const {
    mindMapMode,
    mindMapData,
    setMindMapMode,
    setMindMapData,
    addMindMapNode,
    removeMindMapNode,
    selectedMindMapNodeId,
    selectMindMapNode,
    applyMindMapLayout,
  } = useCanvasStore()

  const [isLoading, setIsLoading] = useState(false)
  const [mindMapList, setMindMapList] = useState<{ id: string; title: string; nodeCount: number }[]>([])
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [newNodeText, setNewNodeText] = useState('')

  const handleEnterMindMap = () => {
    setMindMapMode(true)
  }

  const handleExitMindMap = () => {
    setMindMapMode(false)
    setMindMapData(null)
  }

  const handleNewMindMap = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/mindmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setMindMapData(data as MindMapData)
    } catch (error) {
      console.error('Failed to create mindmap:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMindMaps = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/mindmaps')
      const data = await res.json()
      setMindMapList(data)
      setShowLoadModal(true)
    } catch (error) {
      console.error('Failed to load mindmaps:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMindMap = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:3001/api/mindmaps/${id}`)
      const data = await res.json()
      setMindMapData(data as MindMapData)
      setShowLoadModal(false)
    } catch (error) {
      console.error('Failed to load mindmap:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMindMap = async () => {
    if (!mindMapData) return
    setIsLoading(true)
    try {
      await fetch(`http://localhost:3001/api/mindmaps/${mindMapData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mindMapData),
      })
    } catch (error) {
      console.error('Failed to save mindmap:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNode = () => {
    if (!mindMapData) return
    const newNode: MindMapNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: newNodeText || '# 新节点\n点击编辑内容',
      position: {
        x: 200 + Math.random() * 400,
        y: 200 + Math.random() * 200,
      },
    }
    addMindMapNode(newNode)
    selectMindMapNode(newNode.id)
    setNewNodeText('')
  }

  const handleDeleteNode = () => {
    if (selectedMindMapNodeId) {
      removeMindMapNode(selectedMindMapNodeId)
      selectMindMapNode(null)
    }
  }

  if (!mindMapMode) {
    return (
      <div className="mindmap-toolbar">
        <button onClick={handleEnterMindMap} className="mindmap-toolbar-btn primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          思维导图模式
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mindmap-toolbar active">
        <div className="mindmap-toolbar-section">
          <span className="mindmap-toolbar-title">
            {mindMapData?.title || '新建思维导图'}
          </span>
        </div>

        <div className="mindmap-toolbar-section">
          <button onClick={handleNewMindMap} className="mindmap-toolbar-btn" disabled={isLoading}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建
          </button>

          <button onClick={handleLoadMindMaps} className="mindmap-toolbar-btn" disabled={isLoading}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            加载
          </button>

          <button onClick={handleSaveMindMap} className="mindmap-toolbar-btn" disabled={isLoading || !mindMapData}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
          </button>
        </div>

        <div className="mindmap-toolbar-divider" />

        <div className="mindmap-toolbar-section">
          <div className="mindmap-toolbar-input-group">
            <input
              type="text"
              value={newNodeText}
              onChange={(e) => setNewNodeText(e.target.value)}
              placeholder="新节点内容..."
              className="mindmap-toolbar-input"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
            />
            <button onClick={handleAddNode} className="mindmap-toolbar-btn">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加节点
            </button>
          </div>
        </div>

        <div className="mindmap-toolbar-divider" />

        <div className="mindmap-toolbar-section">
          <button onClick={applyMindMapLayout} className="mindmap-toolbar-btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            自动布局
          </button>

          <button
            onClick={handleDeleteNode}
            className="mindmap-toolbar-btn danger"
            disabled={!selectedMindMapNodeId}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除节点
          </button>
        </div>

        <div className="mindmap-toolbar-divider" />

        <button onClick={handleExitMindMap} className="mindmap-toolbar-btn">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          退出
        </button>
      </div>

      {/* Load Modal */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择思维导图</h3>
              <button onClick={() => setShowLoadModal(false)} className="modal-close">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {mindMapList.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-8">暂无思维导图</p>
              ) : (
                <div className="mindmap-list">
                  {mindMapList.map((mm) => (
                    <button
                      key={mm.id}
                      className="mindmap-list-item"
                      onClick={() => handleSelectMindMap(mm.id)}
                    >
                      <span className="mindmap-list-title">{mm.title}</span>
                      <span className="mindmap-list-meta">{mm.nodeCount} 个节点</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
