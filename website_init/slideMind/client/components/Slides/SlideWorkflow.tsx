'use client'

import { useState, useRef } from 'react'
import { useCanvasStore, Slide, Concept } from '@/lib/canvas-store'

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: '上传' },
    { num: 2, label: '阅读摘要' },
    { num: 3, label: '选择概念' },
    { num: 4, label: '构建导图' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentStep >= step.num 
              ? 'bg-[var(--primary)] text-white' 
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
          }`}>
            <span>{step.num}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${
              currentStep > step.num ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SlideWorkflow() {
  const { addSlide, updateSlideSummary, slides, addCard, cards } = useCanvasStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current active slide
  const activeSlide = slides[slides.length - 1]

  const processFile = async (file: File) => {
    setIsUploading(true)
    setProgress(0)
    setCurrentStep(1)

    try {
      const slideId = `slide-${Date.now()}`
      
      const slide: Slide = {
        id: slideId,
        filename: file.name,
        content: '',
        concepts: [],
        uploadedAt: new Date(),
      }
      addSlide(slide)

      // Progress animation
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 70))
      }, 100)

      // Call backend API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:3001/api/slides/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(80)

      if (response.ok) {
        const result = await response.json()
        
        // Wait for async processing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setProgress(95)

        // Fetch processed result
        const slideResponse = await fetch(`http://localhost:3001/api/slides/${result.slideId}`)
        if (slideResponse.ok) {
          const processedSlide = await slideResponse.json()
          
          if (processedSlide.summary && processedSlide.concepts?.length > 0) {
            updateSlideSummary(slideId, processedSlide.summary, processedSlide.concepts)
            setProgress(100)
            setCurrentStep(2) // Move to "Read Summary" step
          } else {
            // Fallback if no AI processing
            updateSlideSummary(slideId, '内容已上传，请选择下方概念添加', [
              { id: '1', slideId, title: '概念 1', description: '点击添加' },
              { id: '2', slideId, title: '概念 2', description: '点击添加' },
            ])
            setProgress(100)
            setCurrentStep(2)
          }
        }
      }
      
      setTimeout(() => {
        setIsUploading(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // Handle concept selection
  const handleConceptClick = (concept: Concept) => {
    addCard(concept)
    setCurrentStep(3) // Move to "Select Concepts" step
  }

  // Manual selection mode - add all concepts as cards
  const handleAddAllConcepts = () => {
    if (activeSlide?.concepts) {
      activeSlide.concepts.forEach((concept) => {
        addCard(concept)
      })
      setCurrentStep(4)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'pointer-events-none' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto">
                <div className="loading-spinner" />
              </div>
              <p className="text-base font-medium text-[var(--text-primary)]">正在解析文件...</p>
              <div className="progress-bar max-w-xs mx-auto">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="upload-zone-icon">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3>上传 Slides</h3>
              <p>拖拽文件到此处，或点击选择文件</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">支持 PPTX, PDF, PNG, JPG</p>
            </>
          )}
        </div>
      )}

      {/* Step 2: Read Summary */}
      {currentStep >= 2 && activeSlide && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Card */}
          <div className="card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[var(--text-primary)] truncate">{activeSlide.filename}</h4>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">已上传</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm text-xs"
              >
                更换文件
              </button>
            </div>
            
            {activeSlide.summary ? (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {activeSlide.summary}
                </p>
              </div>
            ) : (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text-tertiary)]">
                正在生成摘要...
              </div>
            )}
          </div>

          {/* Concepts Section */}
          {activeSlide.concepts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  📚 提取的概念 ({activeSlide.concepts.length})
                </h4>
                <p className="text-xs text-[var(--text-tertiary)]">
                  点击概念卡片添加，或一键添加全部
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleAddAllConcepts}
                  className="btn-gradient btn-sm flex-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加全部概念
                </button>
              </div>

              {/* Concept list - manual selection */}
              <div className="grid gap-3">
                {activeSlide.concepts.map((concept, index) => (
                  <button
                    key={concept.id}
                    onClick={() => handleConceptClick(concept)}
                    className="card text-left hover:border-[var(--primary)] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                          {concept.title}
                        </h5>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                          {concept.description}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3-4: Build mind map hints */}
      {(currentStep >= 3 || cards.length > 0) && (
        <div className="card bg-gradient-to-r from-[var(--primary-light)] to-[var(--secondary)]/10 border-[var(--primary)]/20 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                {currentStep >= 4 ? '已添加到画布！' : '概念已选择'}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {currentStep >= 4 
                  ? '现在你可以在画布上自由拖动概念卡片，按住 Shift 连接相关概念，构建你的思维导图。'
                  : '继续选择更多概念，或切换到画布开始构建导图。'
                }
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-white rounded-lg border border-[var(--border)]">
                  <kbd className="font-mono">Shift</kbd> + 点击 = 连接概念
                </span>
                <span className="px-2 py-1 bg-white rounded-lg border border-[var(--border)]">
                  <kbd className="font-mono">Space</kbd> + 拖拽 = 平移画布
                </span>
                <span className="px-2 py-1 bg-white rounded-lg border border-[var(--border)]">
                  <kbd className="font-mono">⌘</kbd> + 点击 = 多选
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeSlide && currentStep === 1 && (
        <div className="text-center py-8 text-[var(--text-tertiary)]">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm">上传一个 Slide 开始</p>
        </div>
      )}
    </div>
  )
}
