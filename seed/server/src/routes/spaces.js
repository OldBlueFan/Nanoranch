/**
 * CRUD for rewilding spaces.
 *
 * GET    /api/spaces         — list all
 * POST   /api/spaces         — create
 * GET    /api/spaces/:id     — get one (with recommendations)
 * PATCH  /api/spaces/:id     — update
 * DELETE /api/spaces/:id     — delete
 */
import { Router } from 'express'
import { query } from '../db/pool.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM spaces ORDER BY created_at DESC'
    )
    res.json({ spaces: rows })
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description, location, sizeSqft, photoUrl } = req.body
    const { rows } = await query(
      `INSERT INTO spaces (name, description, location, size_sqft, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name ?? 'My Space', description, location, sizeSqft, photoUrl]
    )
    res.status(201).json({ space: rows[0] })
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { rows: [space] } = await query(
      'SELECT * FROM spaces WHERE id = $1',
      [req.params.id]
    )
    if (!space) return res.status(404).json({ error: 'Space not found' })

    const { rows: recommendations } = await query(
      `SELECT * FROM recommendations
       WHERE space_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.params.id]
    )
    res.json({ space, recommendations })
  } catch (err) { next(err) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, description, location, sizeSqft } = req.body
    const { rows: [space] } = await query(
      `UPDATE spaces
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           size_sqft = COALESCE($4, size_sqft)
       WHERE id = $5
       RETURNING *`,
      [name, description, location, sizeSqft, req.params.id]
    )
    if (!space) return res.status(404).json({ error: 'Space not found' })
    res.json({ space })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM spaces WHERE id = $1',
      [req.params.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Space not found' })
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
