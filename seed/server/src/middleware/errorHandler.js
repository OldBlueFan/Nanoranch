/**
 * Global Express error handler.
 * Logs the error and sends a clean JSON response.
 */
export default function errorHandler(err, _req, res, _next) {
  console.error('[error]', err.message ?? err)

  /* Anthropic SDK errors expose a status property */
  const status = err.status ?? err.statusCode ?? 500
  const message = status < 500 ? err.message : 'Something went wrong'

  res.status(status).json({ error: message })
}
