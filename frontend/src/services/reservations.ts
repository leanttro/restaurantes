import { api } from './api'
import { AvailabilitySlot, CreateReservationPayload, PaginatedResponse, Reservation, ReservationStatus } from '@/types'

export const reservationsService = {
  async checkAvailability(restaurantId: string, date: string, partySize: number): Promise<AvailabilitySlot[]> {
    const { data } = await api.get<AvailabilitySlot[]>('/reservations/availability', {
      params: { restaurant_id: restaurantId, date, party_size: partySize },
    })
    return data
  },
  async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
    const { data } = await api.post<Reservation>('/reservations', payload)
    return data
  },
  async getReservations(restaurantId: string, filters: { date?: string; status?: ReservationStatus; page?: number; limit?: number } = {}): Promise<PaginatedResponse<Reservation>> {
    const { data } = await api.get<PaginatedResponse<Reservation>>('/reservations', {
      params: { restaurant_id: restaurantId, ...filters },
    })
    return data
  },
  async getReservationByCode(code: string): Promise<Reservation> {
    const { data } = await api.get<Reservation>(`/reservations/code/${code}`)
    return data
  },
  async confirmReservation(id: string): Promise<Reservation> {
    const { data } = await api.patch<Reservation>(`/reservations/${id}/confirm`)
    return data
  },
  async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    const { data } = await api.patch<Reservation>(`/reservations/${id}/cancel`, { reason })
    return data
  },
  async addNote(id: string, note: string): Promise<Reservation> {
    const { data } = await api.patch<Reservation>(`/reservations/${id}/notes`, { note })
    return data
  },
}
