'use client'

import { useState } from 'react'
import { useCanvasStore } from '@/lib/canvas-store'

export default function ConceptImporter() {
  const { addSlide, updateSlideSummary } = useCanvasStore()
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)

  const handleImport = () => {
    if (!importText.trim()) return

    try {
      let data = JSON.parse(importText)
      
      if (data.summary && data.concepts) {
        const slideId = `slide-${Date.now()}`
        
        const concepts = data.concepts.map((c: any, i: number) => ({
          id: c.id || `concept-${Date.now()}-${i}`,
          slideId: slideId,
          title: c.title,
          description: c.description
        }))

        addSlide({
          id: slideId,
          filename: data.filename || 'Imported concepts',
          content: data.content || '',
          concepts: concepts,
          uploadedAt: new Date(),
        })

        updateSlideSummary(slideId, data.summary, concepts)

        setImportResult(`✅ 成功导入 ${concepts.length} 个概念！`)
        setImportText('')
        
        setTimeout(() => setImportResult(null), 3000)
      } else {
        setImportResult('❌ 格式不对，请确保包含 summary 和 concepts 字段')
      }
    } catch {
      setImportResult('❌ 无法解析格式')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          粘贴 AI 生成的概念数据
        </label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`粘贴格式示例：

{"summary": "这是摘要", "concepts": [
  {"title": "概念A", "description": "描述"},
  {"title": "概念B", "description": "描述"}
]}`}
          className="w-full h-40 p-4 text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)] resize-none focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all"
        />
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          className="btn-gradient flex-1"
        >
          导入概念
        </button>
        
        {importResult && (
          <span className="text-sm font-medium animate-fadeIn">{importResult}</span>
        )}
      </div>
    </div>
  )
}
