import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Polyfill window, localStorage, document.cookie for testing environment
globalThis.window = { location: { port: '5173' } }

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
}

let cookieJar = ''
globalThis.document = {
  get cookie() {
    return cookieJar
  },
  set cookie(val) {
    if (val.includes('max-age=0')) {
      cookieJar = ''
    } else {
      cookieJar = val.split(';')[0]
    }
  },
}

import {
  API_BASE,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  getAuthToken,
  subscribeUnauthorized,
  apiFetch,
  apiRequest,
  api,
} from './api.js'

describe('CostTrack Shared API Client', () => {
  beforeEach(() => {
    storage.clear()
    cookieJar = ''
  })

  it('correctly sets and retrieves user session with token', () => {
    assert.equal(getStoredUser(), null)
    assert.equal(getAuthToken(), null)

    const user = {
      id: 42,
      client_id: 1,
      client_name: 'Alpha Workspace',
      name: 'Alpha Admin',
      username: 'alpha@test.com',
      role: 'admin',
      access_token: 'jwt-token-xyz-123',
    }

    setStoredUser(user)

    const stored = getStoredUser()
    assert.equal(stored.id, 42)
    assert.equal(stored.client_name, 'Alpha Workspace')
    assert.equal(getAuthToken(), 'jwt-token-xyz-123')
  })

  it('clears user session on logout', () => {
    setStoredUser({ id: 1, access_token: 'token-abc' })
    assert.equal(getAuthToken(), 'token-abc')

    clearStoredUser()
    assert.equal(getStoredUser(), null)
    assert.equal(getAuthToken(), null)
  })

  it('automatically attaches Bearer Authorization header to outgoing requests', async () => {
    setStoredUser({ id: 10, access_token: 'valid-jwt-token' })

    let capturedUrl = ''
    let capturedHeaders = {}
    globalThis.fetch = async (url, options) => {
      capturedUrl = url
      capturedHeaders = options.headers
      return new Response(JSON.stringify([{ id: 1, name: 'Project 1' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const projects = await api.get('/projects')
    assert.equal(capturedUrl, 'http://localhost:8080/api/v1/projects')
    assert.equal(capturedHeaders.get('Authorization'), 'Bearer valid-jwt-token')
    assert.equal(Array.isArray(projects), true)
    assert.equal(projects[0].name, 'Project 1')
  })

  it('serializes JSON object bodies automatically', async () => {
    setStoredUser({ id: 10, access_token: 'valid-jwt-token' })

    let capturedBody = ''
    let capturedHeaders = {}
    globalThis.fetch = async (url, options) => {
      capturedBody = options.body
      capturedHeaders = options.headers
      return new Response(JSON.stringify({ id: 99, name: 'New Project' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = { name: 'Skyline', estimated_cost: 500000 }
    const result = await api.post('/projects', payload)

    assert.equal(capturedHeaders.get('Content-Type'), 'application/json')
    assert.equal(capturedBody, JSON.stringify(payload))
    assert.equal(result.id, 99)
  })

  it('intercepts 401 Unauthorized, clears auth storage, and notifies listeners', async () => {
    setStoredUser({ id: 10, access_token: 'expired-token' })

    let unauthorizedNotified = false
    let notificationReason = ''
    const unsubscribe = subscribeUnauthorized((reason) => {
      unauthorizedNotified = true
      notificationReason = reason
    })

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_TOKEN', message: 'Token has expired' },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    await assert.rejects(
      async () => {
        await api.get('/projects')
      },
      (err) => {
        assert.match(err.message, /Token has expired/i)
        return true
      }
    )

    // Verify storage was purged
    assert.equal(getStoredUser(), null)
    assert.equal(getAuthToken(), null)
    assert.equal(unauthorizedNotified, true)
    assert.equal(notificationReason, 'Token has expired')

    unsubscribe()
  })

  it('unwraps error message from non-2xx responses', async () => {
    setStoredUser({ id: 10, access_token: 'valid-token' })

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: { code: 'FORBIDDEN', message: 'Only administrators can perform this action' },
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    await assert.rejects(
      async () => {
        await api.post('/projects', { name: 'Forbidden' })
      },
      (err) => {
        assert.equal(err.message, 'Only administrators can perform this action')
        return true
      }
    )
  })
})

