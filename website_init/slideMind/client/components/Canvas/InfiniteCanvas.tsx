'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCanvasStore, CanvasCard, CanvasConnection } from '@/lib/canvas-store'

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
  } = useCanvasStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingCard, setDraggingCard] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingMousePos, setConnectingMousePos] = useState({ x: 0, y: 0 })

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
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom - dragOffset.x
        const y = (e.clientY - rect.top - panOffset.y) / zoom - dragOffset.y
        updateCardPosition(draggingCard, { x, y })
      }
    }
    if (isConnecting) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setConnectingMousePos({
          x: (e.clientX - rect.left - panOffset.x) / zoom,
          y: (e.clientY - rect.top - panOffset.y) / zoom,
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingCard(null)
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
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: (e.clientX - rect.left - panOffset.x) / zoom - card.position.x,
        y: (e.clientY - rect.top - panOffset.y) / zoom - card.position.y,
      })
    }
  }

  const handleCardMouseUp = (cardId: string) => {
    if (isConnecting && connectionStart && connectionStart !== cardId) {
      addConnection(connectionStart, cardId)
      cancelConnection()
    }
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
      style={{ cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'default' }}
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
        {/* Connection lines SVG */}
        <svg className="canvas-svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          
          {/* Existing connections */}
          {connections.map((conn) => (
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
          {isConnecting && connectionStart && (
            <path
              d={`M ${getCardCenter(connectionStart).x} ${getCardCenter(connectionStart).y} L ${connectingMousePos.x} ${connectingMousePos.y}`}
              className="connection-preview"
            />
          )}
        </svg>

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

      {/* Empty state */}
      {cards.length === 0 && (
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
