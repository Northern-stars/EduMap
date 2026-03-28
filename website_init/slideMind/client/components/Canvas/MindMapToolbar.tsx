'use client'

import { useState } from 'react'
import { useCanvasStore, MindMapData, MindMapNode, MindMapEdge } from '@/lib/canvas-store'

export default function MindMapToolbar() {
  const {
    mindMapMode,
    mindMapData,
    setMindMapMode,
    setMindMapData,
    addMindMapNode,
    addMindMapEdge,
    removeMindMapNode,
    selectedMindMapNodeId,
    selectMindMapNode,
    applyMindMapLayout,
    isDragToolActive,
    setDragToolActive,
  } = useCanvasStore()

  const [isLoading, setIsLoading] = useState(false)
  const [mindMapList, setMindMapList] = useState<{ id: string; title: string; nodeCount: number }[]>([])
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showAssociateModal, setShowAssociateModal] = useState(false)
  const [saveFileName, setSaveFileName] = useState('')
  const [newNodeText, setNewNodeText] = useState('')
  const [associateText, setAssociateText] = useState('')
  const [associateMaxIter, setAssociateMaxIter] = useState(2)
  const [associateMaxWord, setAssociateMaxWord] = useState(3)
  const [isAssociating, setIsAssociating] = useState(false)
  const [associateProgress, setAssociateProgress] = useState('')

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

  const handleSaveMindMap = () => {
    if (!mindMapData) return
    setSaveFileName(mindMapData.title || '新建思维导图')
    setShowSaveModal(true)
  }

  const handleConfirmSave = async () => {
    if (!mindMapData || !saveFileName.trim()) return
    setIsLoading(true)
    try {
      const updatedData = { ...mindMapData, title: saveFileName.trim(), updatedAt: new Date().toISOString() }
      await fetch(`http://localhost:3001/api/mindmaps/${mindMapData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })
      setMindMapData(updatedData)
      setShowSaveModal(false)
    } catch (error) {
      console.error('Failed to save mindmap:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNode = () => {
    // If no mindMapData exists, create a default one
    if (!mindMapData) {
      const defaultData: MindMapData = {
        id: `mindmap-${Date.now()}`,
        title: '新建思维导图',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMindMapData(defaultData)
    }
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

  const handleConceptAssociate = async () => {
    if (!associateText.trim()) return

    // Create mindmap data synchronously first
    const mindmapId = `mindmap-${Date.now()}`
    const initialData: MindMapData = {
      id: mindmapId,
      title: '概念联想',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMindMapData(initialData)

    setIsAssociating(true)
    setAssociateProgress('开始分析...')

    try {
      const response = await fetch('http://localhost:3001/api/mindmaps/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: associateText,
          max_iter: associateMaxIter,
          max_word: associateMaxWord,
          base_position: { x: 400, y: 300 }
        }),
      })

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // Use local accumulators to avoid stale state issues
      const localNodes: MindMapNode[] = []
      const localEdges: MindMapEdge[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            continue
          }
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            try {
              const parsed = JSON.parse(data)

              if (parsed.id && parsed.text) {
                // It's a node - add to local accumulator
                localNodes.push(parsed as MindMapNode)
                setAssociateProgress(`已创建节点: ${parsed.text.slice(0, 30)}...`)
              } else if (parsed.from && parsed.to) {
                // It's an edge - add to local accumulator
                localEdges.push(parsed as MindMapEdge)
              } else if (parsed.total_nodes !== undefined) {
                setAssociateProgress(`完成！共创建 ${parsed.total_nodes} 个节点`)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Batch update with all nodes and edges at once
      const { mindMapData: currentData } = useCanvasStore.getState()
      if (currentData) {
        setMindMapData({
          ...currentData,
          nodes: [...currentData.nodes, ...localNodes],
          edges: [...currentData.edges, ...localEdges],
        })
      }
    } catch (error) {
      console.error('Concept association failed:', error)
      setAssociateProgress('错误: ' + (error as Error).message)
    } finally {
      setIsAssociating(false)
      setTimeout(() => {
        setShowAssociateModal(false)
        setAssociateProgress('')
        setAssociateText('')
      }, 1500)
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
          <button onClick={() => setShowAssociateModal(true)} className="mindmap-toolbar-btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            概念联想
          </button>

          <button onClick={applyMindMapLayout} className="mindmap-toolbar-btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            自动布局
          </button>

          <button
            onClick={() => setDragToolActive(!isDragToolActive)}
            className={`mindmap-toolbar-btn ${isDragToolActive ? 'active' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            拖拽工具
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>保存思维导图</h3>
              <button onClick={() => setShowSaveModal(false)} className="modal-close">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-[var(--text-secondary)]">文件名</label>
                <input
                  type="text"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  placeholder="输入文件名..."
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowSaveModal(false)} className="btn btn-secondary">
                取消
              </button>
              <button onClick={handleConfirmSave} className="btn btn-primary" disabled={!saveFileName.trim() || isLoading}>
                {isLoading ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concept Associate Modal */}
      {showAssociateModal && (
        <div className="modal-overlay" onClick={() => !isAssociating && setShowAssociateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>自动概念联想</h3>
              <button onClick={() => !isAssociating && setShowAssociateModal(false)} className="modal-close" disabled={isAssociating}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">输入文本</label>
                  <textarea
                    value={associateText}
                    onChange={(e) => setAssociateText(e.target.value)}
                    placeholder="输入要分析的文字内容..."
                    className="w-full h-32 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                    disabled={isAssociating}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">最大迭代次数</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={associateMaxIter}
                      onChange={(e) => setAssociateMaxIter(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      disabled={isAssociating}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">每步最大概念数</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={associateMaxWord}
                      onChange={(e) => setAssociateMaxWord(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      disabled={isAssociating}
                    />
                  </div>
                </div>
                {isAssociating && associateProgress && (
                  <div className="text-sm text-[var(--primary)] text-center py-2">
                    {associateProgress}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAssociateModal(false)} className="btn btn-secondary" disabled={isAssociating}>
                取消
              </button>
              <button
                onClick={handleConceptAssociate}
                className="btn btn-primary"
                disabled={!associateText.trim() || isAssociating}
              >
                {isAssociating ? '分析中...' : '开始联想'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
