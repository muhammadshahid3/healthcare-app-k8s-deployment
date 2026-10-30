// Backend se baat karne ka chhota sa helper.
// Docker mein nginx, local dev mein Vite "/api" ko backend tak pahunchata hai.
const BASE = import.meta.env.VITE_API_URL || '/api'
const STORAGE_KEY = 'medibook_auth'

function getToken() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))?.token
  } catch {
    return null
  }
}

function errorMessage(data, status) {
  if (data?.message) return data.message
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0]
    if (first) return first
  }
  if (data?.title) return data.title
  if (status === 401) return 'Please login again.'
  if (status === 403) return 'You are not allowed to do this.'
  return 'Something went wrong. Please try again.'
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) throw new Error(errorMessage(data, res.status))
  return data
}

export { STORAGE_KEY }
