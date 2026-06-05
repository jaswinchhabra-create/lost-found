export class AppState {
  constructor(apiBase) {
    this.apiBase = apiBase
    this.token = null
    this.user = null
    this.posts = []
    this.filter = null // 'lost' | 'found' | null
    this.searchQuery = ''
    this.listeners = new Set()
  }

  onStateChange(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit() {
    for (const fn of this.listeners) fn()
  }

  setAuth({ token, user }) {
    this.token = token
    this.user = user
    saveState(this)
    this.emit()
  }

  clearAuth() {
    this.token = null
    this.user = null
    saveState(this)
    this.emit()
  }

  authHeaders() {
    if (!this.token) return {}
    return { Authorization: `Bearer ${this.token}` }
  }

  async refreshPosts() {
    try {
      const res = await fetch(`${this.apiBase}/api/posts`)
      if (!res.ok) throw new Error('Failed to load posts')
      const data = await res.json()
      this.posts = data.posts || []
      this.emit()
    } catch (err) {
      console.warn('Could not refresh posts:', err.message)
    }
  }
}

const LS_KEY = 'lostfound_state_v1'

export function loadState(state) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    state.token = parsed.token || null
    state.user = parsed.user || null
  } catch {
    // ignore
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ token: state.token, user: state.user }))
  } catch {
    // ignore
  }
}
