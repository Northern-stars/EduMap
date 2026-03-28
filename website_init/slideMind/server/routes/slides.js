import express from 'express'
import multer from 'multer'
import { parsePPTX, parsePDF, parseImage } from '../services/slide-parser.js'
import { summarizeContent, extractConcepts } from '../services/minimax.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'image/png',
      'image/jpeg',
    ]
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.pptx') || 
        file.originalname.endsWith('.pdf') ||
        file.originalname.endsWith('.png') ||
        file.originalname.endsWith('.jpg') ||
        file.originalname.endsWith('.jpeg')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// In-memory store for slides (use a real DB in production)
const slidesStore = new Map()

// Upload and process a slide
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const slideId = `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    let content = ''

    // Parse based on file type
    try {
      if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
          req.file.originalname.endsWith('.pptx')) {
        content = await parsePPTX(req.file.buffer)
      } else if (req.file.mimetype === 'application/pdf' ||
                 req.file.originalname.endsWith('.pdf')) {
        content = await parsePDF(req.file.buffer)
      } else if (req.file.mimetype === 'image/png' ||
                 req.file.mimetype === 'image/jpeg' ||
                 req.file.originalname.endsWith('.png') ||
                 req.file.originalname.endsWith('.jpg') ||
                 req.file.originalname.endsWith('.jpeg')) {
        content = await parseImage(req.file.buffer, req.file.originalname)
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      content = `[Content extracted from ${req.file.originalname}]\n[Note: Some content may not have been extracted completely]`
    }

    // Store slide
    const slide = {
      id: slideId,
      filename: req.file.originalname,
      content: content,
      summary: null,
      concepts: [],
      status: 'processing',
      createdAt: new Date().toISOString(),
    }
    slidesStore.set(slideId, slide)

    // Process asynchronously with AI
    processSlideAsync(slideId, content)

    res.json({ 
      slideId, 
      filename: req.file.originalname,
      status: 'processing'
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to process file' })
  }
})

// Process slide with AI
async function processSlideAsync(slideId, content) {
  try {
    // Generate summary
    const summary = await summarizeContent(content)
    
    // Extract concepts
    const concepts = await extractConcepts(content)

    // Update store
    const slide = slidesStore.get(slideId)
    if (slide) {
      slide.summary = summary
      slide.concepts = concepts
      slide.status = 'ready'
      slidesStore.set(slideId, slide)
    }
  } catch (error) {
    console.error('AI processing error:', error)
    const slide = slidesStore.get(slideId)
    if (slide) {
      slide.status = 'error'
      slide.error = error.message
      slidesStore.set(slideId, slide)
    }
  }
}

// Get slide by ID
router.get('/:id', async (req, res) => {
  const slide = slidesStore.get(req.params.id)
  
  if (!slide) {
    return res.status(404).json({ error: 'Slide not found' })
  }

  res.json(slide)
})

// Get all slides
router.get('/', async (req, res) => {
  const slides = Array.from(slidesStore.values())
  res.json(slides)
})

export default router
