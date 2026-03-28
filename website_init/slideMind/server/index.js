import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import slidesRouter from './routes/slides.js'
import conceptsRouter from './routes/concepts.js'
import chatRouter from './routes/chat.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from client build in production
const clientBuildPath = join(__dirname, '../client/.next')
app.use('/client', express.static(clientBuildPath))

// API Routes
app.use('/api/slides', slidesRouter)
app.use('/api/concepts', conceptsRouter)
app.use('/api/chat', chatRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve client app for all other routes (SPA)
app.get('*', (req, res) => {
  res.send('SlideMind API Server - Use /api/* routes for the application')
})

app.listen(PORT, () => {
  console.log(`🎒 SlideMind server running on http://localhost:${PORT}`)
  console.log(`📚 API endpoints:`)
  console.log(`   POST /api/slides/upload`)
  console.log(`   GET  /api/slides/:id`)
  console.log(`   POST /api/concepts`)
  console.log(`   POST /api/connections`)
  console.log(`   POST /api/chat`)
})
