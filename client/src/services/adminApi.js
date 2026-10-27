const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function adminApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(isMutation ? { 'X-Requested-With': 'StudyTube' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || 'Request failed.'
    const error = new Error(message)
    error.details = payload?.error || payload || {}
    throw error
  }

  return payload
}
