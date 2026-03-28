// MiniMax API Client
// Documentation: https://www.minimaxi.com/document

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || ''
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  id: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface EmbeddingResponse {
  model: string
  embeddings: number[][]
  usage?: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * Chat completion using MiniMax Text-01
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}
): Promise<string> {
  const { model = 'MiniMax-Text-01', temperature = 0.7, max_tokens = 2048 } = options

  const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  })

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`)
  }

  const data: ChatCompletionResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Text embeddings using MiniMax embeddings model
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${MINIMAX_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'embo-01',
      texts,
    }),
  })

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`)
  }

  const data: EmbeddingResponse = await response.json()
  return data.embeddings
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Find similar concepts based on embeddings
 */
export async function findSimilarConcepts(
  targetText: string,
  conceptTexts: string[],
  threshold: number = 0.7
): Promise<{ index: number; similarity: number }[]> {
  const embeddings = await getEmbeddings([targetText, ...conceptTexts])
  const targetEmbedding = embeddings[0]
  
  const similarities: { index: number; similarity: number }[] = []
  
  for (let i = 1; i < embeddings.length; i++) {
    const similarity = cosineSimilarity(targetEmbedding, embeddings[i])
    if (similarity >= threshold) {
      similarities.push({ index: i - 1, similarity })
    }
  }
  
  return similarities.sort((a, b) => b.similarity - a.similarity)
}

// Prompt templates
export const PROMPT_TEMPLATES = {
  summarize: `你是一个专业的学习助手。请阅读以下内容，并生成：
1. 一个简洁的摘要（100字以内）
2. 5-8个关键概念，每个概念包含：标题、简要解释（50字以内）

内容：
{content}`,

  explainConcept: `基于以下内容，解释"{concept}"这个概念。要求：
- 用简单的语言
- 2-3句话
- 包含一个生活中的例子

内容：
{content}`,

  findConnections: `以下是从不同slides提取的概念：
{concepts}

请找出这些概念之间可能的关联，用一段话描述它们如何相互关联。`,

  generateInsights: `用户正在学习以下内容：
{content}

用户选中了以下概念：
{selectedConcepts}

请给出3个深入的问题，帮助用户更好地理解这些概念之间的联系。`,
}
