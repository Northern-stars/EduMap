import { create } from 'zustand'

export interface Concept {
  id: string
  slideId: string
  title: string
  description: string
}

// Unified node type - used for both canvas cards and mindmap nodes
export interface MindMapNode {
  id: string
  text: string  // Markdown content (title + description combined)
  position: { x: number; y: number }
  color?: string  // Border color for selected state
  width?: number  // Node width for resize
  height?: number  // Node height for resize
  // Canvas card fields (optional for mindmap nodes)
  conceptId?: string
  concept?: Concept
  userEditedDescription?: string
  // Association level tracking (set when node is created via association)
  level?: number
}

export interface CanvasConnection {
  id: string
  fromNodeId: string
  toNodeId: string
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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

// MindMap Edge type
export interface MindMapEdge {
  id: string
  from: string
  to: string
  label?: string
}

export interface MindMapData {
  id: string
  title: string
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  createdAt: string
  updatedAt: string
}

interface CanvasState {
  // Canvas elements (unified - all nodes are MindMapNodes)
  nodes: MindMapNode[]
  connections: CanvasConnection[]

  // Selection
  selectedNodeIds: string[]
  selectedConnectionIds: string[]

  // Interaction mode
  isConnecting: boolean
  connectionStart: string | null

  // Viewport
  zoom: number
  panOffset: { x: number; y: number }
  showGrid: boolean

  // Chat panel
  chatPanelVisible: boolean
  setChatPanelVisible: (visible: boolean) => void

  // Slides
  slides: Slide[]
  activeSlideId: string | null

  // Chat
  lastAiMessage: ChatMessage | null
  setLastAiMessage: (message: ChatMessage | null) => void

  // MindMap mode
  mindMapMode: boolean
  mindMapData: MindMapData | null
  selectedMindMapNodeId: string | null
  isMindMapEditing: boolean
  editingMindMapNodeId: string | null
  isDragToolActive: boolean
  selectedTerm: string | null  // Currently selected text in mindmap
  selectedTermNodeId: string | null  // Node ID where the term was selected

  // Actions
  addNode: (node: MindMapNode) => void
  addNodeFromConcept: (concept: Concept, position?: { x: number; y: number }) => void
  removeNode: (nodeId: string) => void
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  updateNodeDescription: (nodeId: string, description: string) => void

  addConnection: (fromNodeId: string, toNodeId: string, type?: 'solid' | 'dashed') => void
  removeConnection: (connectionId: string) => void

  selectNode: (nodeId: string, multi?: boolean) => void
  deselectAll: () => void

  startConnection: (nodeId: string) => void
  cancelConnection: () => void

  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  toggleGrid: () => void

  addSlide: (slide: Slide) => void
  setActiveSlide: (slideId: string) => void
  updateSlideSummary: (slideId: string, summary: string, concepts: Concept[]) => void

  // MindMap actions
  setMindMapMode: (enabled: boolean) => void
  setMindMapData: (data: MindMapData | null) => void
  addMindMapNode: (node: MindMapNode) => void
  updateMindMapNode: (id: string, updates: Partial<MindMapNode>) => void
  removeMindMapNode: (id: string) => void
  addMindMapEdge: (edge: MindMapEdge) => void
  removeMindMapEdge: (id: string) => void
  selectMindMapNode: (id: string | null) => void
  setMindMapEditing: (editing: boolean) => void
  setEditingMindMapNode: (id: string | null) => void
  setDragToolActive: (active: boolean) => void
  setSelectedTerm: (term: string | null, nodeId?: string | null) => void
  applyMindMapLayout: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  connections: [],
  selectedNodeIds: [],
  selectedConnectionIds: [],
  isConnecting: false,
  connectionStart: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  chatPanelVisible: true,
  slides: [],
  activeSlideId: null,
  lastAiMessage: null,

  // MindMap initial state
  mindMapMode: false,
  mindMapData: null,
  selectedMindMapNodeId: null,
  isMindMapEditing: false,
  editingMindMapNodeId: null,
  isDragToolActive: false,
  selectedTerm: null,
  selectedTermNodeId: null,

  addNodeFromConcept: (concept, position) => {
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const node: MindMapNode = {
      id,
      conceptId: concept.id,
      concept,
      text: `**${concept.title}**\n\n${concept.description}`,
      position: position || {
        x: 200 + Math.random() * 200,
        y: 200 + Math.random() * 200
      },
    }
    set((state) => ({ nodes: [...state.nodes, node] }))
  },

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }))
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      connections: state.connections.filter(
        (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
      ),
      selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
    }))
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position } : n
      ),
    }))
  },

  updateNodeDescription: (nodeId, description) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, userEditedDescription: description } : n
      ),
    }))
  },

  addConnection: (fromNodeId, toNodeId, type = 'solid') => {
    const exists = get().connections.some(
      (c) =>
        (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) ||
        (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
    )
    if (exists || fromNodeId === toNodeId) return

    const id = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const fromNode = get().nodes.find((n) => n.id === fromNodeId)
    const toNode = get().nodes.find((n) => n.id === toNodeId)
    const connectionType = fromNode?.concept?.slideId !== toNode?.concept?.slideId ? 'dashed' : type

    set((state) => ({
      connections: [...state.connections, { id, fromNodeId, toNodeId, type: connectionType }],
    }))
  },

  removeConnection: (connectionId) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
      selectedConnectionIds: state.selectedConnectionIds.filter((id) => id !== connectionId),
    }))
  },

  selectNode: (nodeId, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedNodeIds.includes(nodeId)
        return {
          selectedNodeIds: isSelected
            ? state.selectedNodeIds.filter((id) => id !== nodeId)
            : [...state.selectedNodeIds, nodeId],
        }
      }
      return { selectedNodeIds: [nodeId] }
    })
  },

  deselectAll: () => {
    set({ selectedNodeIds: [], selectedConnectionIds: [], isConnecting: false, connectionStart: null })
  },

  startConnection: (nodeId) => {
    set({ isConnecting: true, connectionStart: nodeId })
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

  setChatPanelVisible: (visible) => set({ chatPanelVisible: visible }),

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

  setLastAiMessage: (message) => {
    set({ lastAiMessage: message })
  },

  // MindMap actions
  setMindMapMode: (enabled) => set({ mindMapMode: enabled }),

  setMindMapData: (data) => set({
    mindMapData: data ? { ...data, nodes: data.nodes || [], edges: data.edges || [] } : null
  }),

  addMindMapNode: (node) => {
    const { mindMapData } = get()
    if (!mindMapData) return
    set({
      mindMapData: {
        ...mindMapData,
        nodes: [...(mindMapData.nodes || []), node],
      },
    })
  },

  updateMindMapNode: (id, updates) => {
    const { mindMapData } = get()
    if (!mindMapData) return
    set({
      mindMapData: {
        ...mindMapData,
        nodes: (mindMapData.nodes || []).map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      },
    })
  },

  removeMindMapNode: (id) => {
    const { mindMapData } = get()
    if (!mindMapData) return
    set({
      mindMapData: {
        ...mindMapData,
        nodes: (mindMapData.nodes || []).filter((n) => n.id !== id),
        edges: (mindMapData.edges || []).filter((e) => e.from !== id && e.to !== id),
      },
    })
  },

  addMindMapEdge: (edge) => {
    const { mindMapData } = get()
    if (!mindMapData) return
    // Prevent duplicate edges
    const exists = (mindMapData.edges || []).some(
      (e) => e.from === edge.from && e.to === edge.to
    )
    if (exists) return
    set({
      mindMapData: {
        ...mindMapData,
        edges: [...(mindMapData.edges || []), edge],
      },
    })
  },

  removeMindMapEdge: (id) => {
    const { mindMapData } = get()
    if (!mindMapData) return
    set({
      mindMapData: {
        ...mindMapData,
        edges: (mindMapData.edges || []).filter((e) => e.id !== id),
      },
    })
  },

  selectMindMapNode: (id) => set({ selectedMindMapNodeId: id }),

  setMindMapEditing: (editing) => set({ isMindMapEditing: editing }),

  setEditingMindMapNode: (id) => set({ editingMindMapNodeId: id }),

  setDragToolActive: (active) => set({ isDragToolActive: active }),

  setSelectedTerm: (term, nodeId = null) => set({ selectedTerm: term, selectedTermNodeId: nodeId }),

  applyMindMapLayout: () => {
    const { mindMapData } = get()
    if (!mindMapData || !mindMapData.nodes || mindMapData.nodes.length === 0) return

    // Build adjacency list and calculate layers using BFS
    const adjList = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    const allNodeIds = mindMapData.nodes.map((n) => n.id)

    // Initialize
    allNodeIds.forEach((id) => {
      adjList.set(id, [])
      inDegree.set(id, 0)
    })

    // Build graph
    ;(mindMapData.edges || []).forEach((edge) => {
      adjList.get(edge.from)?.push(edge.to)
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1)
    })

    // Find root nodes (in-degree = 0) or use first node
    const rootNodes = allNodeIds.filter((id) => inDegree.get(id) === 0)
    const startNodes = rootNodes.length > 0 ? rootNodes : [allNodeIds[0]]

    // BFS to assign layers
    const layers = new Map<string, number>()
    const queue: string[] = [...startNodes]
    startNodes.forEach((id) => layers.set(id, 0))

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentLayer = layers.get(current) || 0
      const children = adjList.get(current) || []

      children.forEach((child) => {
        if (!layers.has(child)) {
          layers.set(child, currentLayer + 1)
          queue.push(child)
        } else {
          // Update to minimum layer if already visited
          layers.set(child, Math.min(layers.get(child)!, currentLayer + 1))
        }
      })
    }

    // Group nodes by layer
    const layerGroups = new Map<number, string[]>()
    layers.forEach((layer, nodeId) => {
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, [])
      }
      layerGroups.get(layer)!.push(nodeId)
    })

    // Calculate positions
    const spacingX = 220
    const spacingY = 120
    const nodeWidth = 180
    const nodeHeight = 60

    const updatedNodes = (mindMapData.nodes || []).map((node) => {
      const layer = layers.get(node.id) || 0
      const sameLayerNodes = layerGroups.get(layer) || []
      const indexInLayer = sameLayerNodes.indexOf(node.id)
      const totalInLayer = sameLayerNodes.length

      // Center horizontally, offset vertically by layer
      const totalWidth = totalInLayer * spacingX
      const startX = (totalWidth - nodeWidth) / 2

      return {
        ...node,
        position: {
          x: startX + indexInLayer * spacingX,
          y: layer * spacingY + 100,
        },
      }
    })

    set({
      mindMapData: {
        ...mindMapData,
        nodes: updatedNodes,
      },
    })
  },
}))
