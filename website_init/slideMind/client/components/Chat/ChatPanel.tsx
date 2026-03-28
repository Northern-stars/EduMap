'use client'

import { useState, useRef, useEffect } from 'react'
import { useCanvasStore, Concept } from '@/lib/canvas-store'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export default function ChatPanel() {
  const { slides, activeSlideId, addCard, selectedCardIds, cards } = useCanvasStore()
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSlide = slides.find((s) => s.id === activeSlideId)
  const selectedCards = cards.filter((c) => selectedCardIds.includes(c.id))

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
      // Simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let responseContent = ''
      
      if (selectedCards.length > 0) {
        responseContent = `我注意到你选中了 ${selectedCards.length} 个概念。你可以继续问我问题，或者在画布上尝试连接这些概念。选中概念后，我可以帮你：\n\n• 深入解释某个概念的含义\n• 找出这些概念之间的关联\n• 建议你接下来可以添加什么概念`
      } else if (activeSlide) {
        responseContent = `我正在分析"${activeSlide.filename}"。你可以：\n\n• 点击右侧的概念卡片，添加到画布\n• 按住 Shift 连接两个概念\n• 继续和我对话，探讨这些概念`
      } else {
        responseContent = '欢迎使用 SlideMind！上传一个 Slide 或导入概念，开始构建你的知识网络吧。'
      }

      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
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
    addCard(concept)
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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{activeSlide.filename}</span>
          </div>
          
          {activeSlide.summary && (
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              {activeSlide.summary}
            </p>
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
                <p className="concept-item-desc">{concept.description}</p>
              </button>
            ))}
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
              {msg.content}
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
      {selectedCards.length > 0 && (
        <div className="px-5 py-3 bg-[var(--primary-light)] border-t border-[var(--primary)]/20">
          <p className="text-sm text-[var(--primary)] font-medium">
            已选中 {selectedCards.length} 个概念
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
