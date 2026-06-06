/**
 * Claude API service — wraps @anthropic-ai/sdk for nano};{ranch use cases.
 *
 * Two entry points:
 *   analyzeSpacePhoto(base64, mediaType) → narrative analysis string
 *   getPlantRecommendations(spaceDescription) → structured plant list JSON
 */
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

const MODEL = 'claude-opus-4-6'

/* ── System prompt ── */
const SYSTEM = `You are a native plant restoration expert helping people rewild their outdoor spaces.
You provide practical, evidence-based recommendations tailored to the user's specific location and space.
Always emphasize locally native species, ecological function (pollinators, birds, soil health), and
achievable actions for any scale — from a patio planter to several acres.
Respond with warmth and encourage curiosity. Use plain language, not botanical jargon.`

/**
 * Analyse a photo of an outdoor space and return a narrative description
 * of its rewilding potential.
 *
 * @param {string} base64   Base-64 encoded image data
 * @param {string} mediaType  e.g. 'image/jpeg'
 * @returns {Promise<string>} Narrative analysis
 */
export async function analyzeSpacePhoto(base64, mediaType) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Please analyse this outdoor space photo. Describe:
1. What you observe (soil type hints, sun exposure, existing vegetation)
2. Rewilding opportunities — what native plants or habitat features could thrive here
3. One simple first step the person could take this week

Be specific and encouraging. Keep it to 3–4 short paragraphs.`,
        },
      ],
    }],
  })

  return message.content[0].text
}

/**
 * Get structured native plant recommendations for a described space.
 *
 * @param {object} params
 * @param {string} params.description  User's free-text description of their space
 * @param {string} [params.location]   City/region (optional but improves results)
 * @param {number} [params.sizeSqft]   Approximate size in sq ft
 * @returns {Promise<Array>} Array of plant recommendation objects
 */
export async function getPlantRecommendations({ description, location, sizeSqft }) {
  const locationNote = location ? `Location: ${location}.` : ''
  const sizeNote = sizeSqft ? `Space size: approximately ${sizeSqft} sq ft.` : ''

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `${locationNote} ${sizeNote}

Space description: ${description}

Please recommend 5–8 native plants for this space. Respond ONLY with a JSON array (no markdown, no explanation outside the array):

[
  {
    "commonName": "string",
    "scientificName": "string",
    "why": "one sentence — why this plant fits this space",
    "wildlife": ["comma-separated beneficiaries e.g. monarch butterfly, native bees"],
    "careLevel": "easy | moderate | experienced",
    "height": "e.g. 1–3 ft",
    "bloomSeason": "spring | summer | fall | winter | year-round"
  }
]`,
    }],
  })

  const text = message.content[0].text.trim()
  // Strip any accidental markdown fences
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(json)
}
