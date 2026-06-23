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
  cuisine_type?: string       // novo campo (adicionar no banco)
  address?: string
  city?: string
  phone?: string
  email?: string
  whatsapp_number?: string    // novo campo (adicionar no banco)
  cover_image_url?: string    // novo campo (adicionar no banco)
  logo_url?: string           // novo campo (adicionar no banco)
  max_party_size?: number     // novo campo (adicionar no banco)
  is_active: boolean
  created_at: string
}

// AvailableHour — usa day_of_week (int 0–6) e is_active, igual ao backend
export interface AvailableHour {
  id: string
  restaurant_id: string
  day_of_week: number         // 0=Segunda … 6=Domingo
  start_time: string          // "HH:MM"
  end_time: string            // "HH:MM"
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
  // backend usa guest_name / guest_phone / guest_email
  guest_name?: string
  guest_phone?: string
  guest_email?: string
  // aliases para compatibilidade com o frontend antigo
  client_name?: string
  client_phone?: string
  client_email?: string
  reservation_date: string    // "YYYY-MM-DD"
  reservation_time: string    // "HH:MM"
  // alias para componentes antigos que usam .date / .time
  date?: string
  time?: string
  party_size: number
  occasion?: string
  special_requests?: string
  notes?: string
  status: ReservationStatus
  confirmation_code?: string  // se o backend passar
  source?: 'chatbot' | 'form' | 'whatsapp' | 'admin'
  created_at: string
}

export interface CreateReservationPayload {
  restaurant_id: string
  reservation_date: string    // "YYYY-MM-DD"
  reservation_time: string    // "HH:MM"
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
  is_enabled: boolean         // alias que o backend devolve
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
