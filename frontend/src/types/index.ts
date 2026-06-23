export type UserRole = 'restaurant_admin' | 'super_admin'

export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  restaurant_id?: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { full_name: string; email: string; password: string; role: UserRole; restaurant_name?: string }

export type RestaurantStatus = 'active' | 'inactive' | 'pending'

export interface Restaurant {
  id: string
  slug: string
  name: string
  description?: string
  cuisine_type?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  whatsapp_number?: string
  cover_image_url?: string
  logo_url?: string
  max_party_size?: number
  is_active: boolean
  status?: RestaurantStatus
  created_at: string
}

export interface AvailableHour {
  id: string
  restaurant_id: string
  day_of_week: number
  start_time: string
  end_time: string
  interval_minutes: number
  max_capacity: number
  is_active: boolean
}

export const DAY_LABELS: Record<number, string> = {
  0: 'Segunda', 1: 'Terça', 2: 'Quarta', 3: 'Quinta',
  4: 'Sexta', 5: 'Sábado', 6: 'Domingo',
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Reservation {
  id: string
  restaurant_id: string
  client_id?: string | null
  guest_name?: string
  guest_phone?: string
  guest_email?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  reservation_date: string
  reservation_time: string
  date?: string
  time?: string
  party_size: number
  occasion?: string
  special_requests?: string
  notes?: string
  status: ReservationStatus
  confirmation_code?: string
  source?: 'chatbot' | 'form' | 'whatsapp' | 'admin'
  created_at: string
}

export interface CreateReservationPayload {
  restaurant_id: string
  reservation_date: string
  reservation_time: string
  party_size: number
  guest_name: string
  guest_phone: string
  guest_email?: string
  occasion?: string
  special_requests?: string
  source?: Reservation['source']
}

export interface AvailabilitySlot {
  time: string
  available_capacity: number
  is_available: boolean
}

export interface Promotion {
  id: string
  restaurant_id: string
  title: string
  description?: string
  discount_type: string
  discount_value: number
  valid_from: string
  valid_until: string
  conditions?: Record<string, unknown>
  is_active: boolean
}

export interface CreatePromotionPayload {
  title: string
  description?: string
  discount_type: string
  discount_value: number
  valid_from: string
  valid_until: string
  conditions?: Record<string, unknown>
}

export interface ChatbotSettings {
  restaurant_id: string
  temperature: number
  system_prompt: string
  greeting_message: string
  is_active: boolean
  is_enabled: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatbotMessagePayload {
  restaurant_id: string
  client_phone: string
  message: string
  conversation_id?: string
}

export interface ChatbotMessageResponse {
  conversation_id: string
  reply: string
  reservation_draft?: Partial<CreateReservationPayload>
  is_ready_to_confirm: boolean
}

export type WhatsappTemplateType = 'confirmation' | 'reminder' | 'cancellation'

export interface WhatsappTemplate {
  id: string
  restaurant_id: string
  template_type: WhatsappTemplateType
  message_body: string
  is_active: boolean
}

export type WhatsappConnectionStatus = 'connected' | 'disconnected' | 'connecting'
export interface WhatsappStatus { status: WhatsappConnectionStatus; qr_code?: string; phone_number?: string }

export interface AnalyticsSummary {
  total_reservations: number
  confirmed_reservations: number
  cancelled_reservations: number
  occupancy_rate: number
  revenue_estimate?: number
  reservations_by_day: { date: string; count: number }[]
}

export interface SuperAdminSummary {
  total_restaurants: number
  active_restaurants: number
  total_reservations: number
  revenue_estimate: number
  reservations_by_day: { date: string; count: number }[]
}

export interface PaginatedResponse<T> { items: T[]; total: number; page: number; limit: number; pages: number }
