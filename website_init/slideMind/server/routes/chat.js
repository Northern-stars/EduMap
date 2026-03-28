import express from 'express'
import { chatCompletion } from '../services/minimax.js'

const router = express.Router()

// In-memory conversation history (use a real DB in production)
const conversationsStore = new Map()

router.post('/', async (req, res) => {
  try {
    const { slideId, selectedCards = [], message, userId = 'default' } = req.body

    if (!message) {
      return res.status(400).json({ error: 'message is required' })
    }

    // Get conversation history
    if (!conversationsStore.has(userId)) {
      conversationsStore.set(userId, [])
    }
    const history = conversationsStore.get(userId)

    // Build context for the AI
    let systemContext = `你是一个智能学习助手，帮助用户理解概念并构建知识网络。
用户正在使用 SlideMind，一个概念关联思维导图工具。
你应该：
1. 简洁明了地回答问题
2. 帮助用户理解概念之间的联系
3. 建议用户可以在画布上创建哪些新的概念卡片
4. 当发现概念间有关联时，明确指出`

    if (selectedCards.length > 0) {
      systemContext += `\n\n用户当前选中了 ${selectedCards.length} 个概念卡片。`
    }

    // Build messages
    const messages = [
      { role: 'system', content: systemContext },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]

    // Get AI response
    const response = await chatCompletion(messages, {
      temperature: 0.7,
      max_tokens: 1500
    })

    // Update history
    history.push({ role: 'user', content: message })
    history.push({ role: 'assistant', content: response })

    // Limit history to last 20 messages
    if (history.length > 20) {
      history.splice(0, history.length - 20)
    }

    // Parse response for suggested actions
    const suggestions = parseSuggestions(response)

    res.json({
      response,
      suggestions,
      historyLength: history.length
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to generate response' })
  }
})

// Parse potential actions from AI response
function parseSuggestions(text) {
  const suggestions = []
  
  // Look for concept mentions
  const conceptPattern = /[""]([^""]+)[""]/g
  let match
  while ((match = conceptPattern.exec(text)) !== null) {
    suggestions.push({
      type: 'concept',
      title: match[1]
    })
  }

  // Look for "你应该..." or "你可以..." patterns
  if (text.includes('你应该') || text.includes('你可以')) {
    suggestions.push({
      type: 'action',
      title: '采纳建议'
    })
  }

  return suggestions.slice(0, 3)
}

// Clear conversation history
router.delete('/history', async (req, res) => {
  const { userId = 'default' } = req.query
  conversationsStore.delete(userId)
  res.json({ success: true })
})

// Get conversation history
router.get('/history', async (req, res) => {
  const { userId = 'default' } = req.query
  const history = conversationsStore.get(userId) || []
  res.json({ history })
})

export default router
