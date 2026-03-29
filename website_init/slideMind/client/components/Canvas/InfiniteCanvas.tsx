'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCanvasStore, MindMapEdge, MindMapNode, MindMapData, CanvasConnection } from '@/lib/canvas-store'
import MindMapNodeComponent from './MindMapNode'
import MindMapFloatingToolbar from './MindMapFloatingToolbar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function InfiniteCanvas() {
  const {
    connections,
    selectedNodeIds,
    isConnecting,
    connectionStart,
    showGrid,
    zoom,
    panOffset,
    selectNode,
    deselectAll,
    updateNodePosition,
    removeNode,
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
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingMousePos, setConnectingMousePos] = useState({ x: 0, y: 0 })

  // MindMap node drag state
  const [draggingMindMapNode, setDraggingMindMapNode] = useState<string | null>(null)
  const [mindMapDragOffset, setMindMapDragOffset] = useState({ x: 0, y: 0 })

  // MindMap connection mode
  const [isMindMapConnecting, setIsMindMapConnecting] = useState(false)
  const [mindMapConnectionStart, setMindMapConnectionStart] = useState<string | null>(null)

  // Use refs to track latest connection state for event handlers (avoid stale closure)
  const isMindMapConnectingRef = useRef(isMindMapConnecting)
  const isConnectingRef = useRef(isConnecting)

  // Sync refs when state changes
  useEffect(() => {
    isMindMapConnectingRef.current = isMindMapConnecting
  }, [isMindMapConnecting])

  useEffect(() => {
    isConnectingRef.current = isConnecting
  }, [isConnecting])

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
      if (e.button === 0 && !draggingNode) {
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
    if (draggingNode) {
      const canvasX = (e.clientX - panOffset.x) / zoom
      const canvasY = (e.clientY - panOffset.y) / zoom
      updateNodePosition(draggingNode, {
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
    if (isConnectingRef.current) {
      setConnectingMousePos({
        x: (e.clientX - panOffset.x) / zoom,
        y: (e.clientY - panOffset.y) / zoom,
      })
    }
    if (isMindMapConnectingRef.current) {
      setConnectingMousePos({
        x: (e.clientX - panOffset.x) / zoom,
        y: (e.clientY - panOffset.y) / zoom,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingNode(null)
    setDraggingMindMapNode(null)
  }

  // Node drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: MindMapNode) => {
    e.stopPropagation()

    if (e.shiftKey && !isConnecting) {
      isConnectingRef.current = true  // Update ref immediately for event handlers
      startConnection(node.id)
      return
    }

    selectNode(node.id, e.metaKey || e.ctrlKey)
    setDraggingNode(node.id)
    // Store the offset between mouse position (in canvas coords) and node position
    const canvasX = (e.clientX - panOffset.x) / zoom
    const canvasY = (e.clientY - panOffset.y) / zoom
    setDragOffset({
      x: canvasX - node.position.x,
      y: canvasY - node.position.y,
    })
  }

  const handleNodeMouseUp = (nodeId: string) => {
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      addConnection(connectionStart, nodeId)
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
      isMindMapConnectingRef.current = true  // Update ref immediately for event handlers
      setIsMindMapConnecting(true)
      setMindMapConnectionStart(nodeId)
      return
    }

    // Toggle: if already selected, deselect; otherwise select this node
    if (selectedMindMapNodeId === nodeId) {
      selectMindMapNode(null)
    } else {
      selectMindMapNode(nodeId)
    }
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

  const handleMindMapNodeResize = (nodeId: string, size: { width: number; height: number }) => {
    updateMindMapNode(nodeId, { width: size.width, height: size.height })
  }

  const handleMindMapNodeTextUpdate = (nodeId: string, text: string) => {
    updateMindMapNode(nodeId, { text })
  }

  const handleMindMapNodeColorUpdate = (nodeId: string, color: string | undefined) => {
    updateMindMapNode(nodeId, { color })
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
    isMindMapConnectingRef.current = true  // Update ref immediately for event handlers
    setIsMindMapConnecting(true)
  }

  const handleStopFloatingConnect = () => {
    isMindMapConnectingRef.current = false
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

  // Get edge colors based on connected node colors
  const getEdgeColors = (edge: MindMapEdge) => {
    const fromNode = mindMapData?.nodes.find((n) => n.id === edge.from)
    const toNode = mindMapData?.nodes.find((n) => n.id === edge.to)
    const fromColor = fromNode?.color || null
    const toColor = toNode?.color || null

    if (fromColor && toColor) {
      return { fromColor, toColor, hasGradient: true }
    } else if (fromColor) {
      return { fromColor, toColor: fromColor, hasGradient: false }
    } else if (toColor) {
      return { fromColor: toColor, toColor, hasGradient: false }
    }
    return { fromColor: '#000000', toColor: '#000000', hasGradient: false }
  }

  // Generate SVG path for mindmap edge
  const getMindMapEdgePath = (edge: MindMapEdge) => {
    const from = getMindMapNodeCenter(edge.from)
    const to = getMindMapNodeCenter(edge.to)
    const dx = to.x - from.x
    const midX = dx / 2
    return `M ${from.x} ${from.y} Q ${from.x + midX} ${from.y} ${(from.x + to.x) / 2} ${(from.y + to.y) / 2} T ${to.x} ${to.y}`
  }

  // Get node center for connection lines
  const getNodeCenter = (nodeId: string) => {
    const node = mindMapData?.nodes.find((n) => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    return {
      x: node.position.x + 90,
      y: node.position.y + 30,
    }
  }

  // Generate SVG path for connection
  const getConnectionPath = (conn: CanvasConnection) => {
    const from = getNodeCenter(conn.fromNodeId)
    const to = getNodeCenter(conn.toNodeId)
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
            {/* Pre-define all edge gradients in defs */}
            {mindMapMode && (mindMapData?.edges || []).map((edge) => {
              const colors = getEdgeColors(edge)
              return (
                <linearGradient key={`gradient-${edge.id}`} id={`edge-gradient-${edge.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors.fromColor} />
                  <stop offset="100%" stopColor={colors.toColor} />
                </linearGradient>
              )
            })}
          </defs>

          {/* MindMap edges */}
          {mindMapMode && (mindMapData?.edges || []).map((edge) => {
            return (
              <g key={edge.id}>
                <path
                  d={getMindMapEdgePath(edge)}
                  className="mindmap-edge"
                  stroke={`url(#edge-gradient-${edge.id})`}
                />
              </g>
            )
          })}

          {/* Regular connections */}
          {connections.map((conn) => (
            <g key={conn.id}>
              <path
                d={getConnectionPath(conn)}
                className={`connection-line ${conn.type === 'dashed' ? 'dashed' : ''}`}
              />
              {/* Arrow head */}
              <circle
                cx={getNodeCenter(conn.toNodeId).x}
                cy={getNodeCenter(conn.toNodeId).y}
                r={4}
                fill="url(#lineGradient)"
              />
            </g>
          ))}

          {/* Connecting line preview */}
          {isConnecting && connectionStart && (
            <path
              d={`M ${getNodeCenter(connectionStart).x} ${getNodeCenter(connectionStart).y} L ${connectingMousePos.x} ${connectingMousePos.y}`}
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
        {(mindMapData?.nodes || []).map((node) => (
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
            onUpdateColor={(color) => handleMindMapNodeColorUpdate(node.id, color)}
            onPositionChange={(pos) => handleMindMapNodePositionChange(node.id, pos)}
            onResize={(size) => handleMindMapNodeResize(node.id, size)}
            onMouseUp={() => handleMindMapNodeMouseUp(node.id)}
            isDragging={draggingMindMapNode === node.id}
            dragOffset={mindMapDragOffset}
            onDragStart={(e) => handleMindMapDragStart(node.id, e)}
          />
        ))}
      </div>

      {/* MindMap Floating Toolbar */}
      <MindMapFloatingToolbar
        isConnecting={isMindMapConnecting}
        onStartConnect={handleStartFloatingConnect}
        onStopConnect={handleStopFloatingConnect}
        onAddNode={handleFloatingAddNode}
        onDeleteSelected={handleFloatingDeleteSelected}
        onAutoLayout={handleFloatingAutoLayout}
        onExplain={handleExplain}
      />

      {/* Empty state */}
      {(mindMapData?.nodes?.length || 0) === 0 && (
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
