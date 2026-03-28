import express from 'express'

const router = express.Router()

// In-memory stores
const cardsStore = new Map()
const connectionsStore = new Map()

// Create a new card from concept
router.post('/', async (req, res) => {
  try {
    const { slideId, conceptId, position } = req.body

    if (!slideId || !conceptId) {
      return res.status(400).json({ error: 'slideId and conceptId are required' })
    }

    const cardId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    
    const card = {
      id: cardId,
      slideId,
      conceptId,
      position: position || { x: 200, y: 200 },
      userEditedDescription: null,
      createdAt: new Date().toISOString(),
    }

    cardsStore.set(cardId, card)
    res.json({ cardId, card })
  } catch (error) {
    console.error('Create card error:', error)
    res.status(500).json({ error: 'Failed to create card' })
  }
})

// Update card position
router.patch('/:id/position', async (req, res) => {
  try {
    const card = cardsStore.get(req.params.id)
    if (!card) {
      return res.status(404).json({ error: 'Card not found' })
    }

    const { x, y } = req.body
    card.position = { x, y }
    cardsStore.set(card.id, card)

    res.json({ success: true })
  } catch (error) {
    console.error('Update position error:', error)
    res.status(500).json({ error: 'Failed to update position' })
  }
})

// Update card description
router.patch('/:id/description', async (req, res) => {
  try {
    const card = cardsStore.get(req.params.id)
    if (!card) {
      return res.status(404).json({ error: 'Card not found' })
    }

    const { description } = req.body
    card.userEditedDescription = description
    cardsStore.set(card.id, card)

    res.json({ success: true })
  } catch (error) {
    console.error('Update description error:', error)
    res.status(500).json({ error: 'Failed to update description' })
  }
})

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    const card = cardsStore.get(req.params.id)
    if (!card) {
      return res.status(404).json({ error: 'Card not found' })
    }

    // Delete associated connections
    for (const [connId, conn] of connectionsStore.entries()) {
      if (conn.fromCardId === req.params.id || conn.toCardId === req.params.id) {
        connectionsStore.delete(connId)
      }
    }

    cardsStore.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete card error:', error)
    res.status(500).json({ error: 'Failed to delete card' })
  }
})

// Get all cards
router.get('/', async (req, res) => {
  const cards = Array.from(cardsStore.values())
  res.json(cards)
})

export default router
