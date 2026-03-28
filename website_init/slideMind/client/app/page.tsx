'use client'

import { useState } from 'react'
import InfiniteCanvas from '@/components/Canvas/InfiniteCanvas'
import CanvasToolbar from '@/components/Canvas/CanvasToolbar'
import ChatPanel from '@/components/Chat/ChatPanel'
import SlideUploader from '@/components/Slides/SlideUploader'
import ConceptImporter from '@/components/Slides/ConceptImporter'
import MindMapToolbar from '@/components/Canvas/MindMapToolbar'
import { useCanvasStore } from '@/lib/canvas-store'

export default function Home() {
  const [showUploader, setShowUploader] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const { slides, cards, mindMapMode } = useCanvasStore()

  return (
    <div className="app-root">
      {/* Toolbar */}
      <CanvasToolbar />
      {mindMapMode && <MindMapToolbar />}

      {/* Main content area */}
      <div className="app-main">
        {/* Canvas - directly placed without extra wrapper */}
        <InfiniteCanvas />

        {/* FABs */}
        <div className="fab-container">
          <button
            onClick={() => setShowImporter(true)}
            className="fab fab-secondary"
            title="导入 AI 概念"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>

          <button
            onClick={() => setShowUploader(true)}
            className="fab fab-primary"
            title="上传 Slide"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Canvas hints */}
        {cards.length === 0 && !mindMapMode && (
          <div className="canvas-hints animate-fadeIn">
            <div className="hint-item">
              <kbd>Shift</kbd>
              <span>+ 点击卡片连接概念</span>
            </div>
            <div className="hint-item">
              <kbd>Space</kbd>
              <span>+ 拖拽平移画布</span>
            </div>
            <div className="hint-item">
              <kbd>⌘</kbd>
              <span>+ 点击多选卡片</span>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        <ChatPanel />
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div 
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowUploader(false)}
        >
          <div 
            className="modal-content animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">上传 Slides</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="modal-close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SlideUploader />
            
            {slides.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">已上传的 Slides</p>
                <div className="space-y-2">
                  {slides.map((slide) => (
                    <div key={slide.id} className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center">
                        <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{slide.filename}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Concept Importer Modal */}
      {showImporter && (
        <div 
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowImporter(false)}
        >
          <div 
            className="modal-content animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">导入 AI 概念</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  从对话中复制 AI 生成的概念数据
                </p>
              </div>
              <button
                onClick={() => setShowImporter(false)}
                className="modal-close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ConceptImporter />
          </div>
        </div>
      )}
    </div>
  )
}
