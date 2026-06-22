'use client'

const KEYS = { ACCESS_TOKEN: 'rr_access', REFRESH_TOKEN: 'rr_refresh', USER: 'rr_user' }

export const storage = {
  getAccessToken: () => (typeof window !== 'undefined' ? localStorage.getItem(KEYS.ACCESS_TOKEN) : null),
  getRefreshToken: () => (typeof window !== 'undefined' ? localStorage.getItem(KEYS.REFRESH_TOKEN) : null),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(KEYS.ACCESS_TOKEN, access)
    localStorage.setItem(KEYS.REFRESH_TOKEN, refresh)
  },
  getUser: <T>(): T | null => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem(KEYS.USER) || 'null') } catch { return null }
  },
  setUser: (user: unknown) => localStorage.setItem(KEYS.USER, JSON.stringify(user)),
  clearAll: () => Object.values(KEYS).forEach((k) => localStorage.removeItem(k)),
}
