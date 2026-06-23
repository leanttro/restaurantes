import { api } from './api'
import {
  AnalyticsSummary,
  AvailableHour,
  CreatePromotionPayload,
  PaginatedResponse,
  Promotion,
  Restaurant,
} from '@/types'

export const restaurantsService = {
  async getRestaurants(
    params: { page?: number; limit?: number; search?: string; status?: string } = {}
  ): Promise<PaginatedResponse<Restaurant>> {
    const { data } = await api.get<PaginatedResponse<Restaurant>>('/restaurants', { params })
    return data
  },

  async getRestaurant(idOrSlug: string): Promise<Restaurant> {
    const { data } = await api.get<Restaurant>(`/restaurants/${idOrSlug}`)
    return data
  },

  async createRestaurant(payload: Partial<Restaurant>): Promise<Restaurant> {
    const { data } = await api.post<Restaurant>('/restaurants', payload)
    return data
  },

  async updateRestaurant(id: string, payload: Partial<Restaurant>): Promise<Restaurant> {
    const { data } = await api.put<Restaurant>(`/restaurants/${id}`, payload)
    return data
  },

  async deleteRestaurant(id: string): Promise<void> {
    await api.delete(`/restaurants/${id}`)
  },

  async setStatus(id: string, status: 'active' | 'inactive'): Promise<Restaurant> {
    const { data } = await api.patch<Restaurant>(`/restaurants/${id}/status`, { status })
    return data
  },

  async getAnalytics(
    id: string,
    dateRange?: { from: string; to: string }
  ): Promise<AnalyticsSummary> {
    const { data } = await api.get<AnalyticsSummary>(`/restaurants/${id}/analytics`, {
      params: dateRange,
    })
    return data
  },

  async getHours(restaurantId: string): Promise<AvailableHour[]> {
    const { data } = await api.get<AvailableHour[]>(`/restaurants/${restaurantId}/hours`)
    return data
  },

  async createHour(
    restaurantId: string,
    payload: Omit<AvailableHour, 'id' | 'restaurant_id'>
  ): Promise<AvailableHour> {
    const { data } = await api.post<AvailableHour>(
      `/restaurants/${restaurantId}/hours`,
      payload
    )
    return data
  },

  async deleteHour(restaurantId: string, hourId: string): Promise<void> {
    await api.delete(`/restaurants/${restaurantId}/hours/${hourId}`)
  },

  async getPromotions(restaurantId: string): Promise<Promotion[]> {
    const { data } = await api.get<Promotion[]>(`/restaurants/${restaurantId}/promotions`)
    return data
  },

  async createPromotion(
    restaurantId: string,
    payload: CreatePromotionPayload
  ): Promise<Promotion> {
    const { data } = await api.post<Promotion>(
      `/restaurants/${restaurantId}/promotions`,
      payload
    )
    return data
  },

  async updatePromotion(
    restaurantId: string,
    promotionId: string,
    payload: Partial<CreatePromotionPayload> & { is_active?: boolean }
  ): Promise<Promotion> {
    const { data } = await api.put<Promotion>(
      `/restaurants/${restaurantId}/promotions/${promotionId}`,
      payload
    )
    return data
  },

  async deletePromotion(restaurantId: string, promotionId: string): Promise<void> {
    await api.delete(`/restaurants/${restaurantId}/promotions/${promotionId}`)
  },
}
