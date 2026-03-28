/**
 * MiniMax API Integration with Slide Analysis Prompt
 * 
 * Environment Variables:
 * MINIMAX_API_KEY - Your MiniMax API key (optional, falls back to demo mode)
 * MINIMAX_BASE_URL - API base URL (default: https://api.minimax.chat/v1)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load slide analysis prompt
const promptConfig = JSON.parse(
  readFileSync(join(__dirname, 'slide-analysis-prompt.json'), 'utf-8')
)

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1'

// Demo mode flag
const DEMO_MODE = !MINIMAX_API_KEY || MINIMAX_API_KEY === 'YOUR_API_KEY' || false // Force real mode for testing

// ============ Demo Mode Concept Templates ============

const DEMO_CONCEPTS = {
  'machine': [
    { title: '机器学习', description: '让计算机从数据中学习并自动改进的算法科学，无需明确编程即可完成任务。' },
    { title: '监督学习', description: '从带标签的训练数据中学习，预测新数据的标签，如分类和回归问题。' },
    { title: '神经网络', description: '受人脑启发的计算模型，由相互连接的节点层组成，能够学习复杂模式。' },
    { title: '深度学习', description: '使用多层神经网络学习数据表示，在图像、语音、自然语言领域突破显著。' },
    { title: 'Transformer', description: '一种注意力机制的神经网络架构，是 GPT、BERT 等大语言模型的基础。' },
  ],
  'linear': [
    { title: '线性回归', description: '用一条直线拟合数据点，描述变量之间的线性关系。公式：y = a + bx + ε' },
    { title: '多元线性回归', description: '用多个解释变量预测一个响应变量，处理更复杂的现实问题。' },
    { title: '最小二乘法', description: '通过最小化预测值与实际值之间平方差来估计线性回归参数的方法。' },
    { title: '相关系数', description: '衡量两个变量线性关系强度的统计量，取值范围 [-1, 1]' },
  ],
  'default': [
    { title: '核心概念 A', description: '这是从内容中提取的第一个关键概念，与主题密切相关。' },
    { title: '核心概念 B', description: '第二个关键概念，与其他概念存在潜在关联，可尝试在画布上连接。' },
    { title: '核心概念 C', description: '这是一个重要的基础概念，建议优先添加到学习计划中。' },
  ]
}

function getDemoConcepts(content) {
  const lowerContent = content.toLowerCase()
  
  if (lowerContent.includes('machine') || lowerContent.includes('learning') || lowerContent.includes('机器学习')) {
    return DEMO_CONCEPTS['machine']
  }
  if (lowerContent.includes('linear') || lowerContent.includes('回归') || lowerContent.includes('模型')) {
    return DEMO_CONCEPTS['linear']
  }
  
  return DEMO_CONCEPTS['default'].map((c, i) => ({
    ...c,
    id: `concept-${Date.now()}-${i}`
  }))
}

// ============ Chat Completion ============

export async function chatCompletion(messages, options = {}) {
  const {
    model = 'MiniMax-M2',
    temperature = 0.7,
    max_tokens = 2048
  } = options

  // Demo mode
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const lastMessage = messages[messages.length - 1]?.content || ''
    
    if (lastMessage.includes('关联') || lastMessage.includes('连接')) {
      return '这些概念之间确实存在联系！建议你在画布上尝试连接这几个概念，形成完整的知识链条。'
    }
    
    return '我理解了！你正在构建自己的知识网络。有什么具体想了解的概念吗？'
  }

  const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`MiniMax API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ============ Content Processing ============

/**
 * Summarize content using MiniMax with structured prompt
 */
export async function summarizeContent(content, maxLength = 200) {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800))
    const concepts = getDemoConcepts(content)
    return `这份内容涵盖了 ${concepts.length} 个关键概念，涉及核心知识点。建议点击「+ 添加」将概念卡片添加到画布中，构建你的个人知识网络。`
  }

  // Build the analysis prompt
  const systemPrompt = `${promptConfig.model_prompt.system_role}

任务：${promptConfig.model_prompt.task_description}

输出格式要求：
- summary: 100-200字的摘要
- 提取5-10个关键概念
- 每个概念包含：title（简洁名词）和 description（1-2句话，50字以内）

分析规则：
${promptConfig.model_prompt.rules.map(r => `- ${r}`).join('\n')}`

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请分析以下内容，提取关键概念并生成摘要：\n\n${content}` }
  ], { temperature: 0.5, max_tokens: 2000 })

  return response.trim()
}

/**
 * Extract key concepts from content using MiniMax
 */
export async function extractConcepts(content, maxConcepts = 8) {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    const concepts = getDemoConcepts(content)
    return concepts.map((c, i) => ({
      id: `concept-${Date.now()}-${i}`,
      ...c
    }))
  }

  // Build structured extraction prompt
  const systemPrompt = `你是专业的学术助手，擅长从教学材料中提取关键概念。

请从以下内容中提取${maxConcepts}个关键概念，每个概念包含：
1. title：简洁的概念名称（名词或短语）
2. description：1-2句话解释（50字以内），用简单直白的语言

输出必须是合法的JSON数组格式，格式如下：
[
  {"title": "概念名称", "description": "解释"},
  {"title": "概念名称", "description": "解释"}
]

概念要求：
- 优先提取有精确定义的术语
- 描述要包含该概念在文中的具体含义
- 可以适当类比生活例子`

  try {
    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `提取概念：\n\n${content}` }
    ], { temperature: 0.5, max_tokens: 1500 })

    // Parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const concepts = JSON.parse(jsonMatch[0])
      return concepts.map((c, i) => ({
        id: `concept-${Date.now()}-${i}`,
        title: c.title,
        description: c.description
      }))
    }
  } catch (error) {
    console.error('Failed to parse concepts:', error)
  }

  return []
}

/**
 * Find connections between concepts
 */
export async function findConnections(concepts) {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 600))
    if (concepts.length < 2) return '只有一个概念时暂时无法建立关联。'
    return `基于当前的${concepts.length}个概念，它们之间可能存在层级关系或应用场景的关联。`
  }

  const prompt = `以下是从Slides提取的概念：

${concepts.map((c, i) => `${i + 1}. ${c.title}: ${c.description}`).join('\n')}

请分析这些概念之间的潜在关联，用一段话描述它们如何相互联系。`

  const response = await chatCompletion([
    { role: 'user', content: prompt }
  ], { temperature: 0.7, max_tokens: 1000 })

  return response.trim()
}

/**
 * Explain a specific concept in context
 */
export async function explainConcept(concept, fullContext) {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return `「${concept}」是一个重要的概念。在当前的学习内容中扮演关键角色。`
  }

  const prompt = `基于以下内容，请解释"${concept}"这个概念：
- 用简单的语言解释
- 2-3句话
- 如果可能，提供一个生活中的例子

内容：
${fullContext}`

  const response = await chatCompletion([
    { role: 'user', content: prompt }
  ], { temperature: 0.7, max_tokens: 500 })

  return response.trim()
}

// ============ Embeddings ============

export async function getEmbeddings(texts) {
  if (DEMO_MODE) {
    return texts.map(() => 
      Array.from({ length: 768 }, () => Math.random() * 2 - 1)
    )
  }

  const response = await fetch(`${MINIMAX_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`
    },
    body: JSON.stringify({
      model: 'embo-01',
      texts
    })
  })

  if (!response.ok) {
    throw new Error(`Embeddings API error: ${response.status}`)
  }

  const data = await response.json()
  return data.embeddings
}

export function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Export prompt config for direct access
export { promptConfig }
