import { api } from './api'
import { storage } from '@/utils/storage'
import { AuthTokens, LoginPayload, RegisterPayload, User } from '@/types'

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data: tokens } = await api.post<AuthTokens>('/auth/login', payload)
    storage.setTokens(tokens.access_token, tokens.refresh_token)
    const user = await authService.fetchCurrentUser()
    return { user, tokens }
  },
  async register(payload: RegisterPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data: tokens } = await api.post<AuthTokens>('/auth/register', payload)
    storage.setTokens(tokens.access_token, tokens.refresh_token)
    const user = await authService.fetchCurrentUser()
    return { user, tokens }
  },
  async fetchCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    storage.setUser(data)
    return data
  },
  async logout(): Promise<void> {
    try { await api.post('/auth/logout') } finally { storage.clearAll() }
  },
}
