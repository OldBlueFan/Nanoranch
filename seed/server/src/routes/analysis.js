/**
 * POST /api/analysis
 * Body: { image: base64String, mediaType: 'image/jpeg' | 'image/png', spaceId?: string }
 */
import { Router } from 'express'
import { analyzeSpacePhoto } from '../services/claude.js'
import { query } from '../db/pool.js'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const { image, mediaType, spaceId } = req.body

    if (!image || !mediaType) {
      return res.status(400).json({ error: 'image and mediaType are required' })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(mediaType)) {
      return res.status(400).json({ error: `Unsupported mediaType: ${mediaType}` })
    }

    const analysis = await analyzeSpacePhoto(image, mediaType)

    /* Optionally persist to db if spaceId provided */
    if (spaceId && process.env.DATABASE_URL) {
      await query(
        `INSERT INTO recommendations (space_id, raw_response)
         VALUES ($1, $2)`,
        [spaceId, JSON.stringify({ type: 'photo_analysis', text: analysis })]
      )
    }

    res.json({ analysis })
  } catch (err) {
    next(err)
  }
})

export default router
