import { create } from 'zustand'

export interface Concept {
  id: string
  slideId: string
  title: string
  description: string
}

export interface CanvasCard {
  id: string
  conceptId: string
  concept: Concept
  position: { x: number; y: number }
  userEditedDescription?: string
}

export interface CanvasConnection {
  id: string
  fromCardId: string
  toCardId: string
  label?: string
  type: 'solid' | 'dashed'
}

export interface Slide {
  id: string
  filename: string
  content: string
  summary?: string
  concepts: Concept[]
  uploadedAt: Date
}

interface CanvasState {
  // Canvas elements
  cards: CanvasCard[]
  connections: CanvasConnection[]
  
  // Selection
  selectedCardIds: string[]
  selectedConnectionIds: string[]
  
  // Interaction mode
  isConnecting: boolean
  connectionStart: string | null
  
  // Viewport
  zoom: number
  panOffset: { x: number; y: number }
  showGrid: boolean
  
  // Slides
  slides: Slide[]
  activeSlideId: string | null
  
  // Actions
  addCard: (concept: Concept, position?: { x: number; y: number }) => void
  removeCard: (cardId: string) => void
  updateCardPosition: (cardId: string, position: { x: number; y: number }) => void
  updateCardDescription: (cardId: string, description: string) => void
  
  addConnection: (fromCardId: string, toCardId: string, type?: 'solid' | 'dashed') => void
  removeConnection: (connectionId: string) => void
  
  selectCard: (cardId: string, multi?: boolean) => void
  deselectAll: () => void
  
  startConnection: (cardId: string) => void
  cancelConnection: () => void
  
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  toggleGrid: () => void
  
  addSlide: (slide: Slide) => void
  setActiveSlide: (slideId: string) => void
  updateSlideSummary: (slideId: string, summary: string, concepts: Concept[]) => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  cards: [],
  connections: [],
  selectedCardIds: [],
  selectedConnectionIds: [],
  isConnecting: false,
  connectionStart: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  slides: [],
  activeSlideId: null,

  addCard: (concept, position) => {
    const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const card: CanvasCard = {
      id,
      conceptId: concept.id,
      concept,
      position: position || { 
        x: 200 + Math.random() * 200, 
        y: 200 + Math.random() * 200 
      },
    }
    set((state) => ({ cards: [...state.cards, card] }))
  },

  removeCard: (cardId) => {
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== cardId),
      connections: state.connections.filter(
        (conn) => conn.fromCardId !== cardId && conn.toCardId !== cardId
      ),
      selectedCardIds: state.selectedCardIds.filter((id) => id !== cardId),
    }))
  },

  updateCardPosition: (cardId, position) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, position } : c
      ),
    }))
  },

  updateCardDescription: (cardId, description) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, userEditedDescription: description } : c
      ),
    }))
  },

  addConnection: (fromCardId, toCardId, type = 'solid') => {
    const exists = get().connections.some(
      (c) =>
        (c.fromCardId === fromCardId && c.toCardId === toCardId) ||
        (c.fromCardId === toCardId && c.toCardId === fromCardId)
    )
    if (exists || fromCardId === toCardId) return

    const id = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const fromCard = get().cards.find((c) => c.id === fromCardId)
    const toCard = get().cards.find((c) => c.id === toCardId)
    const connectionType = fromCard?.concept.slideId !== toCard?.concept.slideId ? 'dashed' : type

    set((state) => ({
      connections: [...state.connections, { id, fromCardId, toCardId, type: connectionType }],
    }))
  },

  removeConnection: (connectionId) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
      selectedConnectionIds: state.selectedConnectionIds.filter((id) => id !== connectionId),
    }))
  },

  selectCard: (cardId, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedCardIds.includes(cardId)
        return {
          selectedCardIds: isSelected
            ? state.selectedCardIds.filter((id) => id !== cardId)
            : [...state.selectedCardIds, cardId],
        }
      }
      return { selectedCardIds: [cardId] }
    })
  },

  deselectAll: () => {
    set({ selectedCardIds: [], selectedConnectionIds: [], isConnecting: false, connectionStart: null })
  },

  startConnection: (cardId) => {
    set({ isConnecting: true, connectionStart: cardId })
  },

  cancelConnection: () => {
    set({ isConnecting: false, connectionStart: null })
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.5, Math.min(2, zoom)) })
  },

  setPanOffset: (offset) => {
    set({ panOffset: offset })
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }))
  },

  addSlide: (slide) => {
    set((state) => ({
      slides: [...state.slides, slide],
      activeSlideId: slide.id,
    }))
  },

  setActiveSlide: (slideId) => {
    set({ activeSlideId: slideId })
  },

  updateSlideSummary: (slideId, summary, concepts) => {
    set((state) => ({
      slides: state.slides.map((s) =>
        s.id === slideId ? { ...s, summary, concepts } : s
      ),
    }))
  },
}))
