'use client'

import { useState } from 'react'
import { useCanvasStore } from '@/lib/canvas-store'
import { useLanguage } from '@/contexts/LanguageContext'
import { languages } from '@/lib/i18n'

export default function CanvasToolbar() {
  const { zoom, setZoom, toggleGrid, nodes, deselectAll, slides } = useCanvasStore()
  const { language, setLanguage, t } = useLanguage()
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleToggleGrid = () => {
    toggleGrid()
  }

  const handleZoomIn = () => setZoom(zoom + 0.1)
  const handleZoomOut = () => setZoom(zoom - 0.1)
  const handleFitView = () => setZoom(1)

  return (
    <div className="toolbar">
      {/* Left - Logo & Actions */}
      <div className="toolbar-left">
        <div className="logo">
          <div className="logo-icon">🧠</div>
          <span className="logo-text">SlideMind</span>
        </div>
        
        <div className="toolbar-divider" />
        
        {/* Quick stats */}
        {slides.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{slides.length} {t('toolbar.slideCount')}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{nodes.length} {t('toolbar.conceptCount')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Center - Canvas controls */}
      <div className="toolbar-center">
        <button
          onClick={handleZoomOut}
          className="toolbar-btn"
          title={t('toolbar.zoomOut')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        
        <button
          onClick={handleFitView}
          className="zoom-display"
        >
          {Math.round(zoom * 100)}%
        </button>
        
        <button
          onClick={handleZoomIn}
          className="toolbar-btn"
          title={t('toolbar.zoomIn')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          onClick={handleToggleGrid}
          className="toolbar-btn"
          title={t('toolbar.toggleGrid')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 5h16M4 14h16" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          onClick={deselectAll}
          className="toolbar-btn"
          title={t('toolbar.deselect')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Right - Actions */}
      <div className="toolbar-right">
        <div className="relative">
          <button
            className="toolbar-btn"
            title={t('toolbar.help')}
            onClick={() => setShowHelp(!showHelp)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {showHelp && (
            <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border border-[var(--border)] w-64 animate-scaleIn z-50">
              <h3 className="font-semibold text-sm mb-3 text-[var(--text-primary)]">{t('help.title')}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <kbd className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">Shift</kbd>
                  <span className="text-[var(--text-secondary)]">{t('help.shiftClick')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <kbd className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">Space</kbd>
                  <span className="text-[var(--text-secondary)]">{t('help.spaceDrag')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <kbd className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">⌘</kbd>
                  <span className="text-[var(--text-secondary)]">{t('help.cmdClick')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <kbd className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">⌥</kbd>
                  <span className="text-[var(--text-secondary)]">{t('help.altClick')}</span>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)]"
              >
                <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            className="toolbar-btn"
            title={t('toolbar.settings')}
            onClick={() => setShowSettings(!showSettings)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {showSettings && (
            <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border border-[var(--border)] w-56 animate-scaleIn z-50">
              <h3 className="font-semibold text-sm mb-3 text-[var(--text-primary)]">{t('settings.title')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-2">{t('settings.language')}</label>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          language === lang.code
                            ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)]"
              >
                <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
