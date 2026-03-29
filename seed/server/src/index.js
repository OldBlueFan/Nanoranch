import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import analysisRouter from './routes/analysis.js'
import plantsRouter from './routes/plants.js'
import spacesRouter from './routes/spaces.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' })) // photos can be large

/* ── Routes ── */
app.use('/api/analysis', analysisRouter)
app.use('/api/plants', plantsRouter)
app.use('/api/spaces', spacesRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', season: currentSeason() })
})

/* ── Error handler (must be last) ── */
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`nano};{ranch server listening on http://localhost:${PORT}`)
})

function currentSeason() {
  const m = new Date().getMonth()
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'fall'
  return 'winter'
}
