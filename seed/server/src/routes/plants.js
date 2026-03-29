/**
 * POST /api/plants
 * Body: { description: string, location?: string, sizeSqft?: number, spaceId?: string }
 */
import { Router } from 'express'
import { getPlantRecommendations } from '../services/claude.js'
import { query } from '../db/pool.js'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const { description, location, sizeSqft, spaceId } = req.body

    if (!description?.trim()) {
      return res.status(400).json({ error: 'description is required' })
    }

    const plants = await getPlantRecommendations({ description, location, sizeSqft })

    /* Optionally persist */
    if (spaceId && process.env.DATABASE_URL) {
      await query(
        `INSERT INTO recommendations (space_id, raw_response, parsed_plants)
         VALUES ($1, $2, $2)`,
        [spaceId, JSON.stringify(plants)]
      )
    }

    res.json({ plants })
  } catch (err) {
    next(err)
  }
})

export default router
