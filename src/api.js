/**
 * Shared API Client for CostTrack Multi-Tenant SaaS
 *
 * Automatically manages JWT bearer authentication, centralized error handling,
 * and automatic logout on 401 Unauthorized (session expired / revoked).
 */

export function getApiBase() {
  if (typeof window !== 'undefined' && window.location?.port === '5173') {
    return 'http://localhost:8080/api/v1'
  }
  return '/api/v1'
}

export const API_BASE = getApiBase()

const USER_STORAGE_KEY = 'costtrack-user'
const USER_COOKIE_KEY = 'costtrack_user'
const TOKEN_COOKIE_KEY = 'costtrack_token'

// Event listener for 401 Unauthorized (e.g. session expired)
let unauthorizedListeners = []

/**
 * Register a callback to be invoked when an API request receives a 401 Unauthorized.
 * Returns an unsubscription function.
 */
export function subscribeUnauthorized(listener) {
  unauthorizedListeners.push(listener)
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== listener)
  }
}

function notifyUnauthorized(message) {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener(message)
    } catch (err) {
      console.error('Error in unauthorized listener', err)
    }
  })
}

/**
 * Retrieves the currently stored user session from localStorage or cookie fallback.
 */
export function getStoredUser() {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (!parsed || (!parsed.token && !parsed.access_token)) {
        clearStoredUser()
        return null
      }
      return parsed
    }
    const match = document.cookie.match(new RegExp(`${USER_COOKIE_KEY}=([^;]+)`))
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[1]))
      if (!parsed || (!parsed.token && !parsed.access_token)) {
        clearStoredUser()
        return null
      }
      return parsed
    }
  } catch {
    return null
  }
  return null
}

/**
 * Stores the user session object (including JWT) in localStorage and synchronized cookie.
 */
export function setStoredUser(user) {
  try {
    if (!user) {
      clearStoredUser()
      return
    }
    const jsonStr = JSON.stringify(user)
    localStorage.setItem(USER_STORAGE_KEY, jsonStr)
    // Synchronize cookies with 7 day expiry and SameSite protection
    document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(jsonStr)}; path=/; max-age=604800; SameSite=Lax`
    const token = user.access_token || user.token
    if (token) {
      document.cookie = `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`
    }
  } catch (err) {
    console.error('Failed to save user session', err)
  }
}

/**
 * Removes the stored user session and clears authentication cookies.
 */
export function clearStoredUser() {
  try {
    localStorage.removeItem(USER_STORAGE_KEY)
    document.cookie = `${USER_COOKIE_KEY}=; path=/; max-age=0`
    document.cookie = `${TOKEN_COOKIE_KEY}=; path=/; max-age=0`
  } catch (err) {
    console.error('Failed to clear user session', err)
  }
}

/**
 * Retrieves the active access token.
 */
export function getAuthToken() {
  const user = getStoredUser()
  return user?.access_token || user?.token || null
}

/**
 * Centralized fetch wrapper that automatically attaches the Authorization Bearer header,
 * serializes JSON request bodies, and intercepts 401 responses.
 */
export async function apiFetch(endpoint, options = {}) {
  const base = getApiBase()
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const headers = new Headers(options.headers || {})

  // Attach token if present and not already specified
  const token = getAuthToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Automatically handle JSON payloads if body is an object
  let body = options.body
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    body = JSON.stringify(body)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  })

  // Centralized 401 Unauthorized handling: session expired or invalid
  if (response.status === 401) {
    const errorData = await response.clone().json().catch(() => ({}))
    const errorMsg = errorData.error?.message || 'Session expired. Please sign in again.'
    clearStoredUser()
    notifyUnauthorized(errorMsg)
    throw new Error(errorMsg)
  }

  return response
}

/**
 * Performs an API request and parses the JSON response (or returns null for 204 No Content).
 * Throws an Error with the server's error message if the response is not OK.
 */
export async function apiRequest(endpoint, options = {}) {
  const response = await apiFetch(endpoint, options)

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || `Request failed (${response.status})`)
    }
    return data
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed (${response.status})`)
  }

  return response
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Authenticates user credentials with the backend.
 */
export async function authLogin(credentials) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error?.message || 'Unable to sign in. Please verify your credentials.')
  }

  setStoredUser(data)
  return data
}

/**
 * Refreshes the user profile from /users/me using the active token.
 */
export async function fetchMe() {
  return api.get('/users/me')
}
