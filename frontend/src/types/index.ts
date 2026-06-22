export type UserRole = 'restaurant_admin' | 'super_admin'

export interface User {
  id: string
  name: string
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
export interface RegisterPayload { name: string; email: string; password: string; role: UserRole; restaurant_name?: string }

export type RestaurantStatus = 'active' | 'inactive' | 'pending'

export interface Restaurant {
  id: string; slug: string; name: string; description?: string; cuisine_type?: string
  address: string; city: string; phone: string; whatsapp_number?: string
  cover_image_url?: string; logo_url?: string; status: RestaurantStatus; max_party_size: number; created_at: string
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta',
  friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

export interface OperatingHour {
  id: string; restaurant_id: string; weekday: WeekDay; is_open: boolean
  start_time: string; end_time: string; max_capacity: number
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Reservation {
  id: string; confirmation_code: string; restaurant_id: string; client_name: string
  client_phone: string; client_email?: string; date: string; time: string
  party_size: number; status: ReservationStatus; notes?: string
  source: 'chatbot' | 'form' | 'whatsapp' | 'admin'; created_at: string
}

export interface CreateReservationPayload {
  restaurant_id: string; client_name: string; client_phone: string; client_email?: string
  date: string; time: string; party_size: number; notes?: string; source?: Reservation['source']
}

export interface AvailabilitySlot { time: string; available: boolean; remaining_capacity: number }

export interface Promotion {
  id: string; restaurant_id: string; title: string; description?: string
  discount_percent: number; valid_from: string; valid_until: string; conditions?: string; is_active: boolean
}

export interface CreatePromotionPayload {
  title: string; description?: string; discount_percent: number
  valid_from: string; valid_until: string; conditions?: string
}

export interface ChatbotSettings {
  restaurant_id: string; temperature: number; system_prompt: string
  greeting_message: string; model: string; is_enabled: boolean
}

export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; created_at: string }

export interface ChatbotMessagePayload {
  restaurant_id: string; client_phone: string; message: string; conversation_id?: string
}

export interface ChatbotMessageResponse {
  conversation_id: string; reply: string
  reservation_draft?: Partial<CreateReservationPayload>; is_ready_to_confirm: boolean
}

export type WhatsappTemplateType = 'confirmation' | 'reminder' | 'cancellation'

export interface WhatsappTemplate {
  restaurant_id: string; type: WhatsappTemplateType; content: string; updated_at: string
}

export type WhatsappConnectionStatus = 'connected' | 'disconnected' | 'connecting'

export interface WhatsappStatus { status: WhatsappConnectionStatus; qr_code?: string; phone_number?: string }

export interface AnalyticsSummary {
  total_reservations: number; confirmed_reservations: number; cancelled_reservations: number
  occupancy_rate: number; revenue_estimate?: number; reservations_by_day: { date: string; count: number }[]
}

export interface SuperAdminSummary {
  total_restaurants: number; active_restaurants: number; total_reservations: number
  revenue_estimate: number; reservations_by_day: { date: string; count: number }[]
}

export interface PaginatedResponse<T> { items: T[]; total: number; page: number; limit: number; pages: number }
