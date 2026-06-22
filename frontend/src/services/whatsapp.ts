import { api } from './api'
import { WhatsappStatus, WhatsappTemplate, WhatsappTemplateType } from '@/types'

export const whatsappService = {
  async getStatus(restaurantId: string): Promise<WhatsappStatus> {
    const { data } = await api.get<WhatsappStatus>(`/restaurants/${restaurantId}/whatsapp/status`)
    return data
  },
  async connect(restaurantId: string): Promise<WhatsappStatus> {
    const { data } = await api.post<WhatsappStatus>(`/restaurants/${restaurantId}/whatsapp/connect`)
    return data
  },
  async disconnect(restaurantId: string): Promise<void> {
    await api.post(`/restaurants/${restaurantId}/whatsapp/disconnect`)
  },
  async getTemplates(restaurantId: string): Promise<WhatsappTemplate[]> {
    const { data } = await api.get<WhatsappTemplate[]>(`/restaurants/${restaurantId}/whatsapp/templates`)
    return data
  },
  async updateTemplate(restaurantId: string, type: WhatsappTemplateType, content: string): Promise<WhatsappTemplate> {
    const { data } = await api.put<WhatsappTemplate>(`/restaurants/${restaurantId}/whatsapp/templates/${type}`, { content })
    return data
  },
}
