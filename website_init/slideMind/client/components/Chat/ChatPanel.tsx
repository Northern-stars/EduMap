'use client'

import { useState, useRef, useEffect } from 'react'
import { useCanvasStore, Concept, ChatMessage, MindMapNode } from '@/lib/canvas-store'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export default function ChatPanel() {
  const { slides, activeSlideId, addMindMapNode, selectedMindMapNodeId, mindMapData, lastAiMessage, setLastAiMessage, setMindMapData } = useCanvasStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 SlideMind 的助手。上传 Slides 后，我可以帮你总结概念、解释术语，或者帮你基于当前选中的概念生成新的关联。',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conceptSummaryCollapsed, setConceptSummaryCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Listen for AI messages from other components (e.g., SlideUploader)
  useEffect(() => {
    if (lastAiMessage) {
      setMessages((prev) => [...prev, lastAiMessage as Message])
      setLastAiMessage(null)  // Clear after displaying
    }
  }, [lastAiMessage, setLastAiMessage])

  const activeSlide = slides.find((s) => s.id === activeSlideId)
  const selectedNode = mindMapData?.nodes.find((n) => n.id === selectedMindMapNodeId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send message to backend
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          userId: 'default',
          slideId: activeSlideId,
          selectedCards: selectedNode ? [selectedNode.id] : [],
        }),
      })

      const data = await res.json()

      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '抱歉，发生了错误。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConceptClick = (concept: Concept) => {
    const mindMapNode = {
      id: `mindmap-node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: `## ${concept.title}\n\n${concept.description}`,
      position: {
        x: 200 + Math.random() * 400,
        y: 200 + Math.random() * 200,
      },
    }
    addMindMapNode(mindMapNode)
  }

  const handleAddToCanvas = (content: string) => {
    // Ensure mindMapData exists
    if (!mindMapData) {
      const defaultData = {
        id: `mindmap-${Date.now()}`,
        title: '新建思维导图',
        nodes: [] as MindMapNode[],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMindMapData(defaultData)
    }

    const newNode: MindMapNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: content,
      position: {
        x: 200 + Math.random() * 400,
        y: 200 + Math.random() * 200,
      },
    }
    addMindMapNode(newNode)
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <h2>AI 助手</h2>
        <p>选择概念后，我可以帮你深入解释</p>
      </div>

      {/* Summary section - Lovart style */}
      {activeSlide && (
        <div className="concept-summary">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{activeSlide.filename}</span>
            </div>
            <button
              onClick={() => setConceptSummaryCollapsed(!conceptSummaryCollapsed)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors"
              title={conceptSummaryCollapsed ? '展开' : '收起'}
            >
              <svg
                className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 ${conceptSummaryCollapsed ? '-rotate-90' : 'rotate-0'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className={`transition-all duration-200 ease-in-out ${conceptSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-[250px]'} overflow-y-auto`}>
            {activeSlide.summary && (
              <div className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSlide.summary}</ReactMarkdown>
              </div>
            )}

            {activeSlide.concepts.length > 0 && (
              <div className="concept-summary-title">提取的概念</div>
            )}

            <div className="concept-list">
              {activeSlide.concepts.map((concept) => (
                <button
                  key={concept.id}
                  onClick={() => handleConceptClick(concept)}
                  className="concept-item"
                >
                  <div className="concept-item-title">
                    <span>{concept.title}</span>
                    <span className="add-hint">+ 添加</span>
                  </div>
                  <p className="concept-item-desc"><ReactMarkdown remarkPlugins={[remarkGfm]}>{concept.description}</ReactMarkdown></p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}
          >
            <div className={`chat-bubble ${msg.role === 'user' ? 'user' : msg.role === 'system' ? 'bg-[var(--bg-tertiary)] text-center' : 'assistant'}`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  {msg.content && (
                    <button
                      onClick={() => handleAddToCanvas(msg.content)}
                      className="mt-3 flex items-center gap-2 px-3 py-2 text-xs bg-[var(--primary-light)] hover:bg-[var(--primary)] hover:text-white text-[var(--primary)] rounded-lg transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      添加到画布
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-bubble assistant flex items-center gap-2">
              <div className="loading-spinner" />
              <span className="text-sm">思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected concepts indicator */}
      {selectedNode && (
        <div className="px-5 py-3 bg-[var(--primary-light)] border-t border-[var(--primary)]/20">
          <p className="text-sm text-[var(--primary)] font-medium">
            已选中概念: {selectedNode.text.split('\n')[0].replace(/^#+\s*/, '').replace(/\*\*/g, '')}
          </p>
        </div>
      )}

      {/* Input - Lovart style */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问我关于概念的问题..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="chat-send-btn"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
