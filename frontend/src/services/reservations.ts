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
      date_filter?: string
      status_filter?: ReservationStatus
      page?: number
      size?: number
    } = {}
  ): Promise<PaginatedResponse<Reservation>> {
    const { data } = await api.get<PaginatedResponse<Reservation>>(
      `/restaurants/${restaurantId}/reservations`,
      { params: filters }
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
}
