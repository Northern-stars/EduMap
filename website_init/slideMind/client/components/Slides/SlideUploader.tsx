'use client'

import { useState, useRef, useCallback } from 'react'
import { useCanvasStore, Slide, Concept } from '@/lib/canvas-store'

export default function SlideUploader() {
  const { addSlide, updateSlideSummary, addCard } = useCanvasStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setIsUploading(true)
    setProgress(0)
    setCurrentSlide(null)

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
      setCurrentSlide(slide)

      // Simulate progress
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
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        setProgress(95)

        // Fetch processed result
        const slideResponse = await fetch(`http://localhost:3001/api/slides/${result.slideId}`)
        if (slideResponse.ok) {
          const processedSlide = await slideResponse.json()
          
          if (processedSlide.summary && processedSlide.concepts?.length > 0) {
            updateSlideSummary(slideId, processedSlide.summary, processedSlide.concepts)
            setCurrentSlide({ ...processedSlide, id: slideId })
          } else {
            // Fallback
            const fallbackConcepts: Concept[] = [
              { id: `${slideId}-1`, slideId, title: '概念 1', description: '点击添加' },
              { id: `${slideId}-2`, slideId, title: '概念 2', description: '点击添加' },
            ]
            updateSlideSummary(slideId, '内容已解析，请选择概念添加', fallbackConcepts)
            setCurrentSlide({ ...slide, concepts: fallbackConcepts, summary: '内容已解析，请选择概念添加' })
          }
        }
      }
      
      setProgress(100)
      setTimeout(() => setIsUploading(false), 500)
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleConceptClick = (concept: Concept) => {
    addCard(concept)
  }

  const handleAddAllConcepts = () => {
    if (currentSlide?.concepts) {
      currentSlide.concepts.forEach(concept => {
        addCard(concept)
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
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

      {/* Concepts Selection - Only show after upload */}
      {currentSlide && currentSlide.concepts.length > 0 && (
        <div className="animate-fadeIn">
          {/* Summary */}
          {currentSlide.summary && (
            <div className="card mb-4">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {currentSlide.summary}
              </p>
            </div>
          )}

          {/* Concept list */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                📚 提取的概念 ({currentSlide.concepts.length})
              </h4>
              <button
                onClick={handleAddAllConcepts}
                className="btn-gradient btn-sm"
              >
                添加全部
              </button>
            </div>

            <div className="space-y-2">
              {currentSlide.concepts.map((concept, index) => (
                <button
                  key={concept.id}
                  onClick={() => handleConceptClick(concept)}
                  className="w-full card text-left hover:border-[var(--primary)] transition-all group flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-[var(--text-primary)] text-sm mb-0.5 group-hover:text-[var(--primary)] transition-colors">
                      {concept.title}
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {concept.description}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 rounded bg-[var(--primary)] text-white flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-tertiary)]">
            点击概念添加到画布，或点击「添加全部」一键添加
          </p>
        </div>
      )}
    </div>
  )
}
