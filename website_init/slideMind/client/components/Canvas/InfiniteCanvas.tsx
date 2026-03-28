'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCanvasStore, CanvasCard, CanvasConnection, MindMapEdge, MindMapNode, MindMapData } from '@/lib/canvas-store'
import MindMapNodeComponent from './MindMapNode'
import MindMapFloatingToolbar from './MindMapFloatingToolbar'

export default function InfiniteCanvas() {
  const {
    cards,
    connections,
    selectedCardIds,
    isConnecting,
    connectionStart,
    showGrid,
    zoom,
    panOffset,
    selectCard,
    deselectAll,
    updateCardPosition,
    removeCard,
    startConnection,
    cancelConnection,
    addConnection,
    setZoom,
    setPanOffset,
    // MindMap
    mindMapMode,
    mindMapData,
    selectedMindMapNodeId,
    isMindMapEditing,
    editingMindMapNodeId,
    selectMindMapNode,
    updateMindMapNode,
    addMindMapNode,
    removeMindMapNode,
    addMindMapEdge,
    setMindMapEditing,
    setEditingMindMapNode,
    setMindMapData,
    applyMindMapLayout,
    isDragToolActive,
    selectedTerm,
    selectedTermNodeId,
    setSelectedTerm,
  } = useCanvasStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingCard, setDraggingCard] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingMousePos, setConnectingMousePos] = useState({ x: 0, y: 0 })

  // MindMap node drag state
  const [draggingMindMapNode, setDraggingMindMapNode] = useState<string | null>(null)
  const [mindMapDragOffset, setMindMapDragOffset] = useState({ x: 0, y: 0 })

  // MindMap connection mode
  const [isMindMapConnecting, setIsMindMapConnecting] = useState(false)
  const [mindMapConnectionStart, setMindMapConnectionStart] = useState<string | null>(null)

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }
  }, [zoom, setZoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Pan canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-area')) {
      if (e.button === 0 && !draggingCard) {
        deselectAll()
        if (mindMapMode) {
          selectMindMapNode(null)
          if (isMindMapConnecting) {
            setIsMindMapConnecting(false)
            setMindMapConnectionStart(null)
          }
        }
      }
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
    if (draggingCard) {
      const canvasX = (e.clientX - panOffset.x) / zoom
      const canvasY = (e.clientY - panOffset.y) / zoom
      updateCardPosition(draggingCard, {
        x: canvasX - dragOffset.x,
        y: canvasY - dragOffset.y,
      })
    }
    if (draggingMindMapNode) {
      const canvasX = (e.clientX - panOffset.x) / zoom
      const canvasY = (e.clientY - panOffset.y) / zoom
      updateMindMapNode(draggingMindMapNode, {
        position: {
          x: canvasX - mindMapDragOffset.x,
          y: canvasY - mindMapDragOffset.y,
        },
      })
    }
    if (isConnecting) {
      setConnectingMousePos({
        x: (e.clientX - panOffset.x) / zoom,
        y: (e.clientY - panOffset.y) / zoom,
      })
    }
    if (isMindMapConnecting) {
      setConnectingMousePos({
        x: (e.clientX - panOffset.x) / zoom,
        y: (e.clientY - panOffset.y) / zoom,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingCard(null)
    setDraggingMindMapNode(null)
  }

  // Card drag handlers
  const handleCardMouseDown = (e: React.MouseEvent, card: CanvasCard) => {
    e.stopPropagation()

    if (e.shiftKey && !isConnecting) {
      startConnection(card.id)
      return
    }

    selectCard(card.id, e.metaKey || e.ctrlKey)
    setDraggingCard(card.id)
    // Store the offset between mouse position (in canvas coords) and card position
    const canvasX = (e.clientX - panOffset.x) / zoom
    const canvasY = (e.clientY - panOffset.y) / zoom
    setDragOffset({
      x: canvasX - card.position.x,
      y: canvasY - card.position.y,
    })
  }

  const handleCardMouseUp = (cardId: string) => {
    if (isConnecting && connectionStart && connectionStart !== cardId) {
      addConnection(connectionStart, cardId)
      cancelConnection()
    }
  }

  // MindMap node handlers
  const handleMindMapNodeSelect = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // If already in connecting mode and no start node set, set this node as start
    if (isMindMapConnecting && !mindMapConnectionStart) {
      setMindMapConnectionStart(nodeId)
      return
    }

    if (e.shiftKey && !isMindMapConnecting) {
      setIsMindMapConnecting(true)
      setMindMapConnectionStart(nodeId)
      return
    }

    selectMindMapNode(nodeId)
  }

  const handleMindMapDragStart = (nodeId: string, e: React.MouseEvent) => {
    if (!isDragToolActive) return // Only allow drag when tool is active

    const node = mindMapData?.nodes.find((n) => n.id === nodeId)
    if (!node) return

    const canvasX = (e.clientX - panOffset.x) / zoom
    const canvasY = (e.clientY - panOffset.y) / zoom
    setMindMapDragOffset({
      x: canvasX - node.position.x,
      y: canvasY - node.position.y,
    })
    setDraggingMindMapNode(nodeId)
  }

  const handleMindMapNodeMouseUp = (nodeId: string) => {
    if (isMindMapConnecting && mindMapConnectionStart && mindMapConnectionStart !== nodeId) {
      const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      addMindMapEdge({
        id: edgeId,
        from: mindMapConnectionStart,
        to: nodeId,
      })
      setIsMindMapConnecting(false)
      setMindMapConnectionStart(null)
    }
  }

  const handleMindMapNodePositionChange = (nodeId: string, position: { x: number; y: number }) => {
    updateMindMapNode(nodeId, { position })
  }

  const handleMindMapNodeTextUpdate = (nodeId: string, text: string) => {
    updateMindMapNode(nodeId, { text })
  }

  // Floating toolbar handlers
  const handleFloatingAddNode = () => {
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
      text: '# 新节点\n点击编辑内容',
      position: {
        x: 200 + Math.random() * 400,
        y: 200 + Math.random() * 200,
      },
    }
    addMindMapNode(newNode)
    selectMindMapNode(newNode.id)
  }

  const handleFloatingDeleteSelected = () => {
    if (selectedMindMapNodeId) {
      removeMindMapNode(selectedMindMapNodeId)
      selectMindMapNode(null)
    }
  }

  const handleFloatingAutoLayout = () => {
    applyMindMapLayout()
  }

  const handleStartFloatingConnect = () => {
    setIsMindMapConnecting(true)
  }

  const handleStopFloatingConnect = () => {
    setIsMindMapConnecting(false)
    setMindMapConnectionStart(null)
  }

  // Explain selected term - creates a new node with explanation
  const handleExplain = async () => {
    if (!selectedTerm || !selectedTermNodeId || !mindMapData) return

    const sourceNode = mindMapData.nodes.find((n) => n.id === selectedTermNodeId)
    if (!sourceNode) return

    try {
      const res = await fetch('http://localhost:3001/api/chat/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: selectedTerm }),
      })
      const data = await res.json()

      if (data.explanation) {
        // Create new node with explanation
        const newNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const newNode: MindMapNode = {
          id: newNodeId,
          text: `**${selectedTerm}**\n\n${data.explanation}`,
          position: {
            x: sourceNode.position.x + 220,
            y: sourceNode.position.y + Math.random() * 100 - 50,
          },
        }
        addMindMapNode(newNode)

        // Add edge from source node to new node
        const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        addMindMapEdge({
          id: edgeId,
          from: sourceNode.id,
          to: newNodeId,
        })

        // Add to chat context
        await fetch('http://localhost:3001/api/chat/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: `用户选中了"${selectedTerm}"，以下是解释：\n\n${data.explanation}`,
          }),
        })

        // Clear selection
        setSelectedTerm(null, null)
      }
    } catch (error) {
      console.error('Failed to explain term:', error)
    }
  }

  // Get mindmap node center for connection lines
  const getMindMapNodeCenter = (nodeId: string) => {
    const node = mindMapData?.nodes.find((n) => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    return {
      x: node.position.x + 90,
      y: node.position.y + 30,
    }
  }

  // Generate SVG path for mindmap edge
  const getMindMapEdgePath = (edge: MindMapEdge) => {
    const from = getMindMapNodeCenter(edge.from)
    const to = getMindMapNodeCenter(edge.to)
    const dx = to.x - from.x
    const midX = dx / 2
    return `M ${from.x} ${from.y} Q ${from.x + midX} ${from.y} ${(from.x + to.x) / 2} ${(from.y + to.y) / 2} T ${to.x} ${to.y}`
  }

  // Get card center for connection lines
  const getCardCenter = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return { x: 0, y: 0 }
    return {
      x: card.position.x + 100,
      y: card.position.y + 40,
    }
  }

  // Generate SVG path for connection
  const getConnectionPath = (conn: CanvasConnection) => {
    const from = getCardCenter(conn.fromCardId)
    const to = getCardCenter(conn.toCardId)
    const dx = to.x - from.x
    const midX = dx / 2
    return `M ${from.x} ${from.y} Q ${from.x + midX} ${from.y} ${(from.x + to.x) / 2} ${(from.y + to.y) / 2} T ${to.x} ${to.y}`
  }

  return (
    <div
      ref={canvasRef}
      className="canvas-container"
      style={{ cursor: isPanning ? 'grabbing' : isMindMapConnecting ? 'crosshair' : isConnecting ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid pattern */}
      {showGrid && (
        <div
          className="canvas-grid"
          style={{
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          }}
        />
      )}

      {/* Transform layer */}
      <div
        className="canvas-area"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection lines SVG - inherits transform from canvas-area */}
        <svg className="canvas-svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#A855F7" />
            </marker>
          </defs>

          {/* MindMap edges */}
          {mindMapMode && (mindMapData?.edges || []).map((edge) => (
            <g key={edge.id}>
              <path
                d={getMindMapEdgePath(edge)}
                className="mindmap-edge"
              />
            </g>
          ))}

          {/* Regular connections */}
          {!mindMapMode && connections.map((conn) => (
            <g key={conn.id}>
              <path
                d={getConnectionPath(conn)}
                className={`connection-line ${conn.type === 'dashed' ? 'dashed' : ''}`}
              />
              {/* Arrow head */}
              <circle
                cx={getCardCenter(conn.toCardId).x}
                cy={getCardCenter(conn.toCardId).y}
                r={4}
                fill="url(#lineGradient)"
              />
            </g>
          ))}

          {/* Connecting line preview */}
          {isConnecting && connectionStart && !mindMapMode && (
            <path
              d={`M ${getCardCenter(connectionStart).x} ${getCardCenter(connectionStart).y} L ${connectingMousePos.x} ${connectingMousePos.y}`}
              className="connection-preview"
            />
          )}

          {/* MindMap connection preview */}
          {isMindMapConnecting && mindMapConnectionStart && (
            <path
              d={`M ${getMindMapNodeCenter(mindMapConnectionStart).x} ${getMindMapNodeCenter(mindMapConnectionStart).y} L ${connectingMousePos.x} ${connectingMousePos.y}`}
              className="connection-preview"
            />
          )}
        </svg>

        {/* MindMap nodes */}
        {mindMapMode && (mindMapData?.nodes || []).map((node) => (
          <MindMapNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedMindMapNodeId === node.id}
            isEditing={editingMindMapNodeId === node.id}
            onSelect={(e) => handleMindMapNodeSelect(node.id, e)}
            onStartEdit={() => {
              setEditingMindMapNode(node.id)
              setMindMapEditing(true)
            }}
            onEndEdit={() => {
              setEditingMindMapNode(null)
              setMindMapEditing(false)
            }}
            onUpdateText={(text) => handleMindMapNodeTextUpdate(node.id, text)}
            onPositionChange={(pos) => handleMindMapNodePositionChange(node.id, pos)}
            onMouseUp={() => handleMindMapNodeMouseUp(node.id)}
            isDragging={draggingMindMapNode === node.id}
            dragOffset={mindMapDragOffset}
            onDragStart={(e) => handleMindMapDragStart(node.id, e)}
          />
        ))}

        {/* Cards */}
        {cards.map((card) => (
          <div
            key={card.id}
            className={`concept-card ${
              selectedCardIds.includes(card.id) ? 'selected' : ''
            } ${draggingCard === card.id ? 'dragging' : ''}`}
            style={{
              left: card.position.x,
              top: card.position.y,
              zIndex: draggingCard === card.id ? 1000 : selectedCardIds.includes(card.id) ? 100 : 1,
            }}
            onMouseDown={(e) => handleCardMouseDown(e, card)}
            onMouseUp={() => handleCardMouseUp(card.id)}
          >
            <div className="card-title">{card.concept.title}</div>
            <p className="card-description">
              {card.userEditedDescription || card.concept.description}
            </p>
            {card.concept.slideId && (
              <div className="card-footer">
                <span className="card-source">
                  {card.concept.slideId.slice(0, 8)}...
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCard(card.id)
                  }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Zoom indicator */}
      <div className="zoom-indicator">
        {Math.round(zoom * 100)}%
      </div>

      {/* MindMap Floating Toolbar */}
      {mindMapMode && (
        <MindMapFloatingToolbar
          isConnecting={isMindMapConnecting}
          onStartConnect={handleStartFloatingConnect}
          onStopConnect={handleStopFloatingConnect}
          onAddNode={handleFloatingAddNode}
          onDeleteSelected={handleFloatingDeleteSelected}
          onAutoLayout={handleFloatingAutoLayout}
          onExplain={handleExplain}
        />
      )}

      {/* Empty state */}
      {!mindMapMode && cards.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🧠</div>
          <h2>开始你的知识之旅</h2>
          <p>
            上传 Slides，AI 会帮你提取概念<br />
            然后拖拽、连接，构建你的思维导图
          </p>
        </div>
      )}
    </div>
  )
}
