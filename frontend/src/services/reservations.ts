import { api } from './api'
import {
  AvailabilitySlot,
  CreateReservationPayload,
  PaginatedResponse,
  Reservation,
  ReservationStatus,
} from '@/types'

export const reservationsService = {
  async checkAvailability(
    restaurantId: string,
    date: string,
    partySize: number
  ): Promise<AvailabilitySlot[]> {
    const { data } = await api.post<{ available_slots: AvailabilitySlot[] }>(
      '/reservations/check-availability',
      { restaurant_id: restaurantId, date, party_size: partySize }
    )
    return data.available_slots ?? []
  },

  async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
    const { data } = await api.post<Reservation>('/reservations/create', payload)
    return data
  },

  async getReservations(
    restaurantId: string,
    filters: {
      status?: ReservationStatus
      date?: string
      limit?: number
      page?: number
    } = {}
  ): Promise<PaginatedResponse<Reservation>> {
    const params: Record<string, unknown> = {}
    if (filters.status) params.status_filter = filters.status
    if (filters.date) params.date_filter = filters.date
    if (filters.limit) params.size = filters.limit
    if (filters.page) params.page = filters.page
    const { data } = await api.get<PaginatedResponse<Reservation>>(
      `/restaurants/${restaurantId}/reservations`,
      { params }
    )
    return data
  },

  async getReservationByCode(code: string): Promise<Reservation> {
    const { data } = await api.get<Reservation>(`/reservations/code/${code}`)
    return data
  },

  async updateStatus(
    restaurantId: string,
    reservationId: string,
    newStatus: ReservationStatus
  ): Promise<Reservation> {
    const { data } = await api.put<Reservation>(
      `/restaurants/${restaurantId}/reservations/${reservationId}/status`,
      null,
      { params: { new_status: newStatus } }
    )
    return data
  },

  async confirmReservation(id: string): Promise<Reservation> {
    const { data } = await api.put<Reservation>(`/reservations/${id}/confirm`)
    return data
  },

  async cancelReservation(id: string): Promise<Reservation> {
    const { data } = await api.put<Reservation>(`/reservations/${id}/cancel`)
    return data
  },

  async addNote(id: string, note: string): Promise<Reservation> {
    const { data } = await api.patch<Reservation>(`/reservations/${id}/note`, { note })
    return data
  },
}
