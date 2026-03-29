'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { translations, Language, TranslationKey } from '@/lib/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh-CN')

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key
    },
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
