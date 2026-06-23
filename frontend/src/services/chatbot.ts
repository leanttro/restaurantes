import { api } from './api'
import { ChatbotMessagePayload, ChatbotMessageResponse, ChatbotSettings } from '@/types'

export const chatbotService = {
  async sendMessage(payload: ChatbotMessagePayload): Promise<ChatbotMessageResponse> {
    const { restaurant_id, ...body } = payload
    const { data } = await api.post<ChatbotMessageResponse>(
      `/restaurants/${restaurant_id}/chatbot/message`,
      body
    )
    return data
  },
  async getSettings(restaurantId: string): Promise<ChatbotSettings> {
    const { data } = await api.get<ChatbotSettings>(`/restaurants/${restaurantId}/chatbot/settings`)
    return data
  },
  async updateSettings(restaurantId: string, payload: Partial<ChatbotSettings>): Promise<ChatbotSettings> {
    const { data } = await api.put<ChatbotSettings>(`/restaurants/${restaurantId}/chatbot/settings`, payload)
    return data
  },
  async testMessage(restaurantId: string, message: string): Promise<{ reply: string }> {
    const { data } = await api.post<{ reply: string }>(`/restaurants/${restaurantId}/chatbot/test`, { message })
    return data
  },
}
