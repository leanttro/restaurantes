'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { restaurantsService } from '@/services/restaurants'
import { ChatbotWidget } from '@/components/reservation/ChatbotWidget'
import { ReservationForm } from '@/components/reservation/ReservationForm'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Restaurant, Reservation, AvailableHour, DAY_LABELS, DAY_LABELS_SHORT } from '@/types'
import { Clock, Globe, MapPin, Phone, Users } from 'lucide-react'

type Lang = 'pt' | 'en' | 'es'

const T: Record<Lang, Record<string, string>> = {
  pt: {
    notFound: 'Restaurante não encontrado.',
    makeReservation: 'Faça sua reserva',
    useForm: 'Prefiro preencher um formulário',
    backToAI: '← Usar assistente de IA',
    address: 'Endereço', phone: 'Telefone', maxParty: 'Máx. por mesa',
    people: 'pessoas', info: 'Informações', hours: 'Horários',
  },
  en: {
    notFound: 'Restaurant not found.',
    makeReservation: 'Make a reservation',
    useForm: 'I prefer to fill a form',
    backToAI: '← Use AI assistant',
    address: 'Address', phone: 'Phone', maxParty: 'Max. party size',
    people: 'people', info: 'Information', hours: 'Opening hours',
  },
  es: {
    notFound: 'Restaurante no encontrado.',
    makeReservation: 'Haz tu reserva',
    useForm: 'Prefiero rellenar un formulario',
    backToAI: '← Usar asistente de IA',
    address: 'Dirección', phone: 'Teléfono', maxParty: 'Máx. por mesa',
    people: 'personas', info: 'Información', hours: 'Horarios',
  },
}

// day_of_week do JS: 0=Domingo, 1=Segunda... — converte pro padrão do backend (0=Segunda)
function todayDayOfWeek() {
  const js = new Date().getDay()
  return js === 0 ? 6 : js - 1
}

export default function RestaurantPage() {
  const { restaurant: slug } = useParams<{ restaurant: string }>()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [hours, setHours] = useState<AvailableHour[]>([])
  const [loading, setLoading] = useState(true)
  const [useForm, setUseForm] = useState(false)
  const [lang, setLang] = useState<Lang>('pt')

  useEffect(() => {
    const bl = navigator.language.slice(0, 2) as Lang
    if (['pt', 'en', 'es'].includes(bl)) setLang(bl)
  }, [])

  useEffect(() => {
    restaurantsService
      .getRestaurant(slug)
      .then((r) => {
        setRestaurant(r)
        return restaurantsService.getHours(r.id)
      })
      .then((h) => setHours(h.filter((x) => x.is_active).sort((a, b) => a.day_of_week - b.day_of_week)))
      .finally(() => setLoading(false))
  }, [slug])

  function handleComplete(reservation: Reservation) {
    const code = reservation.confirmation_code ?? reservation.id
    router.push(`/success?code=${code}`)
  }

  const t = T[lang]
  const today = todayDayOfWeek()

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <LoadingSpinner size="lg" label="" />
      </div>
    )

  if (!restaurant)
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <p className="text-ink-600">{t.notFound}</p>
      </div>
    )

  // Horários para o mini-calendário semanal
  const hoursByDay: Record<number, AvailableHour> = {}
  hours.forEach(h => { hoursByDay[h.day_of_week] = h })
  const weekDays = [0, 1, 2, 3, 4, 5, 6]

  return (
    <div className="min-h-screen bg-sand-50">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative bg-bordeaux-700 pb-24 pt-10 overflow-hidden">
        {/* Foto de fundo transparente (cover_image_url usada duas vezes) */}
        {restaurant.cover_image_url && (
          <img
            src={restaurant.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}

        {/* Language switcher */}
        <div className="relative z-10 mx-auto flex max-w-4xl justify-end px-4 pb-4 sm:px-6">
          <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-1 py-1">
            <Globe size={13} className="ml-2 text-sand-100/60" />
            {(['pt', 'en', 'es'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  lang === l ? 'bg-white text-bordeaux-700' : 'text-sand-100/70 hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-end gap-5">
            {/* Logo */}
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt="logo"
                className="h-20 w-20 rounded-2xl object-cover shadow-lg border-2 border-white/20 shrink-0"
              />
            )}
            <div>
              <h1 className="font-display text-4xl font-bold text-white">{restaurant.name}</h1>
              {(restaurant.cuisine_type || restaurant.city) && (
                <p className="mt-1 text-sm font-medium text-gold-400">
                  {[restaurant.cuisine_type, restaurant.city].filter(Boolean).join(' · ')}
                </p>
              )}
              {restaurant.description && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-sand-100/80">{restaurant.description}</p>
              )}
            </div>
          </div>

          {/* Foto destaque do local (cover_image_url em destaque) */}
          {restaurant.cover_image_url && (
            <div className="mt-5 overflow-hidden rounded-2xl shadow-lg" style={{ maxHeight: 220 }}>
              <img
                src={restaurant.cover_image_url}
                alt={restaurant.name}
                className="w-full object-cover"
                style={{ maxHeight: 220 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">

          {/* Reservation panel */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-xl bg-white shadow-ticket">
              <div className="border-b border-ink-900/8 px-5 py-4">
                <h2 className="font-display text-xl font-semibold text-ink-900">{t.makeReservation}</h2>
              </div>
              <div className="p-5">
                {!useForm ? (
                  <ChatbotWidget
                    restaurantId={restaurant.id}
                    restaurantName={restaurant.name}
                    lang={lang}
                    onReservationComplete={handleComplete}
                    onUseFormInstead={() => setUseForm(true)}
                  />
                ) : (
                  <>
                    <ReservationForm restaurant={restaurant} onSuccess={handleComplete} lang={lang} />
                    <button onClick={() => setUseForm(false)} className="mt-3 text-xs text-ink-600 hover:text-bordeaux-600">
                      {t.backToAI}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl bg-white p-5 shadow-ticket">
              <h3 className="mb-4 font-display text-lg font-semibold text-ink-900">{t.info}</h3>
              <dl className="space-y-3 text-sm">
                {restaurant.address && (
                  <div className="flex gap-3">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-bordeaux-600" />
                    <div>
                      <dt className="font-medium text-ink-900">{t.address}</dt>
                      <dd className="text-ink-600">{restaurant.address}</dd>
                    </div>
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex gap-3">
                    <Phone size={16} className="mt-0.5 shrink-0 text-bordeaux-600" />
                    <div>
                      <dt className="font-medium text-ink-900">{t.phone}</dt>
                      <dd className="text-ink-600">
                        <a href={`tel:${restaurant.phone}`} className="hover:text-bordeaux-600">{restaurant.phone}</a>
                      </dd>
                    </div>
                  </div>
                )}
                {restaurant.max_party_size && (
                  <div className="flex gap-3">
                    <Users size={16} className="mt-0.5 shrink-0 text-bordeaux-600" />
                    <div>
                      <dt className="font-medium text-ink-900">{t.maxParty}</dt>
                      <dd className="text-ink-600">{restaurant.max_party_size} {t.people}</dd>
                    </div>
                  </div>
                )}

                {/* Horários — mini calendário semanal */}
                {hours.length > 0 && (
                  <div className="flex gap-3">
                    <Clock size={16} className="mt-0.5 shrink-0 text-bordeaux-600" />
                    <div className="w-full">
                      <dt className="mb-2 font-medium text-ink-900">{t.hours}</dt>
                      <dd>
                        <div className="grid grid-cols-7 gap-0.5">
                          {weekDays.map((dow) => {
                            const h = hoursByDay[dow]
                            const isToday = dow === today
                            return (
                              <div key={dow} className="flex flex-col items-center gap-1">
                                <span className={`text-[10px] font-semibold ${isToday ? 'text-bordeaux-600' : 'text-ink-400'}`}>
                                  {DAY_LABELS_SHORT[dow]}
                                </span>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-medium leading-tight text-center transition-colors
                                  ${h ? (isToday ? 'bg-bordeaux-600 text-white' : 'bg-bordeaux-50 text-bordeaux-700') : 'bg-ink-900/5 text-ink-400/50'}`}>
                                  {h ? (
                                    <span className="px-0.5">{h.start_time.slice(0,5)}</span>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </div>
                                {h && (
                                  <span className={`text-[9px] leading-none ${isToday ? 'text-bordeaux-600 font-semibold' : 'text-ink-400'}`}>
                                    {h.end_time.slice(0,5)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Banners clicáveis */}
            {restaurant.banner1_image_url && (
              <a
                href={restaurant.banner1_link_url || '#'}
                target={restaurant.banner1_link_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl shadow-ticket transition-opacity hover:opacity-90"
              >
                <img
                  src={restaurant.banner1_image_url}
                  alt="Promoção"
                  className="w-full object-cover"
                  style={{ maxHeight: 160 }}
                />
              </a>
            )}
            {restaurant.banner2_image_url && (
              <a
                href={restaurant.banner2_link_url || '#'}
                target={restaurant.banner2_link_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl shadow-ticket transition-opacity hover:opacity-90"
              >
                <img
                  src={restaurant.banner2_image_url}
                  alt="Promoção"
                  className="w-full object-cover"
                  style={{ maxHeight: 160 }}
                />
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
