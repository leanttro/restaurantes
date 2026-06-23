'use client'
import { FormEvent, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { reservationsService } from '@/services/reservations'
import { ApiError } from '@/types/api'
import { AvailabilitySlot, Reservation, Restaurant } from '@/types'

type Lang = 'pt' | 'en' | 'es'

const T: Record<Lang, Record<string, string>> = {
  pt: {
    date: 'Data', people: 'Pessoas', time: 'Horário', name: 'Nome completo',
    whatsapp: 'WhatsApp', email: 'E-mail (opcional)', notes: 'Observações (opcional)',
    confirm: 'Confirmar reserva', loading: 'Consultando…', noSlots: 'Nenhum horário disponível.',
    namePh: 'Como podemos te chamar', phonePh: '(11) 90000-0000', emailPh: 'voce@email.com',
    notesPh: 'Aniversário, alergias, preferência de mesa…',
    errDate: 'Escolha uma data futura.', errParty: 'Número de pessoas inválido.',
    errTime: 'Selecione um horário.', errName: 'Informe seu nome.',
    errPhone: 'Informe um telefone válido.', errSubmit: 'Não foi possível concluir a reserva.',
    choosePeople: 'Escolha a quantidade de pessoas',
    chooseDatePh: 'Escolha a data da Reserva',
    chooseTimePh: 'Escolha o horário',
    person: 'Pessoa', persons: 'Pessoas',
    advance: 'Avançar',
    today: 'Hoje',
    available: 'Disponível', unavailable: 'Indisponível', discount: 'Com desconto no cardápio',
    step1: 'Detalhes', step2: 'Seus dados',
    back: 'Voltar',
  },
  en: {
    date: 'Date', people: 'People', time: 'Time', name: 'Full name',
    whatsapp: 'WhatsApp', email: 'Email (optional)', notes: 'Notes (optional)',
    confirm: 'Confirm reservation', loading: 'Checking…', noSlots: 'No slots available.',
    namePh: 'How should we call you', phonePh: '+1 555 0000000', emailPh: 'you@email.com',
    notesPh: 'Birthday, allergies, table preference…',
    errDate: 'Choose a future date.', errParty: 'Invalid number of people.',
    errTime: 'Select a time slot.', errName: 'Please enter your name.',
    errPhone: 'Please enter a valid phone.', errSubmit: 'Could not complete the reservation.',
    choosePeople: 'Choose number of people',
    chooseDatePh: 'Choose reservation date',
    chooseTimePh: 'Choose a time',
    person: 'Person', persons: 'People',
    advance: 'Next',
    today: 'Today',
    available: 'Available', unavailable: 'Unavailable', discount: 'Discount on menu',
    step1: 'Details', step2: 'Your info',
    back: 'Back',
  },
  es: {
    date: 'Fecha', people: 'Personas', time: 'Hora', name: 'Nombre completo',
    whatsapp: 'WhatsApp', email: 'Correo (opcional)', notes: 'Notas (opcional)',
    confirm: 'Confirmar reserva', loading: 'Consultando…', noSlots: 'Sin horarios disponibles.',
    namePh: '¿Cómo te llamamos?', phonePh: '+34 600 000000', emailPh: 'tu@email.com',
    notesPh: 'Cumpleaños, alergias, preferencia de mesa…',
    errDate: 'Elige una fecha futura.', errParty: 'Número de personas inválido.',
    errTime: 'Selecciona un horario.', errName: 'Indica tu nombre.',
    errPhone: 'Indica un teléfono válido.', errSubmit: 'No se pudo completar la reserva.',
    choosePeople: 'Elige la cantidad de personas',
    chooseDatePh: 'Elige la fecha de la reserva',
    chooseTimePh: 'Elige el horario',
    person: 'Persona', persons: 'Personas',
    advance: 'Avanzar',
    today: 'Hoy',
    available: 'Disponible', unavailable: 'No disponible', discount: 'Descuento en menú',
    step1: 'Detalles', step2: 'Tus datos',
    back: 'Volver',
  },
}

const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_HEADERS_PT = ['D','S','T','Q','Q','S','S']
const DAY_HEADERS_EN = ['S','M','T','W','T','F','S']
const DAY_HEADERS_ES = ['D','L','M','X','J','V','S']

function getMonthNames(lang: Lang) {
  if (lang === 'en') return MONTH_NAMES_EN
  if (lang === 'es') return MONTH_NAMES_ES
  return MONTH_NAMES_PT
}
function getDayHeaders(lang: Lang) {
  if (lang === 'en') return DAY_HEADERS_EN
  if (lang === 'es') return DAY_HEADERS_ES
  return DAY_HEADERS_PT
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  return `${h}:${m}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface Props {
  restaurant: Restaurant
  onSuccess: (r: Reservation) => void
  lang?: Lang
}

export function ReservationForm({ restaurant, onSuccess, lang = 'pt' }: Props) {
  const t = T[lang]
  const monthNames = getMonthNames(lang)
  const dayHeaders = getDayHeaders(lang)

  const todayDate = new Date()
  const todayStr = todayDate.toISOString().slice(0, 10)

  const [step, setStep] = useState<1 | 2>(1)
  const [date, setDate] = useState('')
  const [partySize, setPartySize] = useState(0)
  const [showPartyDropdown, setShowPartyDropdown] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calYear, setCalYear] = useState(todayDate.getFullYear())
  const [calMonth, setCalMonth] = useState(todayDate.getMonth())

  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const maxParty = restaurant.max_party_size ?? 20

  useEffect(() => {
    if (!date || date <= todayStr || !partySize) { setSlots([]); return }
    let active = true
    setLoadingSlots(true); setTime('')
    reservationsService
      .checkAvailability(restaurant.id, date, partySize)
      .then((s) => { if (active) setSlots(s) })
      .catch(() => { if (active) setSlots([]) })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [date, partySize, restaurant.id])

  function validateStep1() {
    const e: Record<string, string | undefined> = {}
    if (!partySize || partySize < 1) e.partySize = t.errParty
    if (!date || date <= todayStr) e.date = t.errDate
    if (!time) e.time = t.errTime
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e: Record<string, string | undefined> = {}
    if (!name.trim()) e.name = t.errName
    if (!phone.trim() || phone.trim().length < 8) e.phone = t.errPhone
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goToStep2(e: React.MouseEvent) {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validateStep2()) return
    setSubmitting(true)
    try {
      const reservation = await reservationsService.createReservation({
        restaurant_id: restaurant.id,
        guest_name: name,
        guest_phone: phone,
        guest_email: email || undefined,
        reservation_date: date,
        reservation_time: time,
        party_size: partySize,
        special_requests: notes || undefined,
        source: 'form',
      })
      onSuccess(reservation)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t.errSubmit)
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar helpers
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)
  const todayY = todayDate.getFullYear()
  const todayM = todayDate.getMonth()
  const todayD = todayDate.getDate()

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }
  function goToday() {
    setCalYear(todayY); setCalMonth(todayM)
  }
  function selectDay(day: number) {
    const ds = toDateString(calYear, calMonth, day)
    if (ds <= todayStr) return
    setDate(ds)
    setShowCalendar(false)
  }
  function isPast(day: number) {
    const ds = toDateString(calYear, calMonth, day)
    return ds <= todayStr
  }
  function isSelected(day: number) {
    return toDateString(calYear, calMonth, day) === date
  }
  function isToday(day: number) {
    return calYear === todayY && calMonth === todayM && day === todayD
  }

  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const displayDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="w-full">
      {step === 1 ? (
        <div className="space-y-5">
          {/* Pessoas */}
          <div className="relative">
            <label className="label-field">* {t.people}</label>
            <button
              type="button"
              onClick={() => { setShowPartyDropdown(v => !v); setShowCalendar(false) }}
              className="input-field flex items-center justify-between text-left"
              style={{ cursor: 'pointer' }}
            >
              <span className={partySize ? 'text-ink-900' : 'text-ink-400'}>
                {partySize ? `${partySize} ${partySize === 1 ? t.person : t.persons}` : t.choosePeople}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-ink-400">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {errors.partySize && <p className="error-text">{errors.partySize}</p>}
            {showPartyDropdown && (
              <div className="absolute z-30 mt-1 w-full rounded-lg border border-ink-900/10 bg-white shadow-ticket overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  {Array.from({ length: maxParty }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setPartySize(n); setShowPartyDropdown(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        partySize === n
                          ? 'bg-bordeaux-50 font-semibold text-bordeaux-700'
                          : 'text-ink-800 hover:bg-sand-50'
                      }`}
                    >
                      {n} {n === 1 ? t.person : t.persons}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Data — calendário */}
          <div className="relative">
            <label className="label-field">* {t.date}</label>
            <button
              type="button"
              onClick={() => { setShowCalendar(v => !v); setShowPartyDropdown(false) }}
              className="input-field flex items-center justify-between text-left"
              style={{ cursor: 'pointer' }}
            >
              <span className={date ? 'text-ink-900' : 'text-ink-400'}>
                {date ? displayDate : t.chooseDatePh}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-ink-400">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {errors.date && <p className="error-text">{errors.date}</p>}

            {showCalendar && (
              <div className="absolute z-30 mt-1 w-full rounded-xl border border-ink-900/10 bg-white shadow-ticket p-4">
                {/* Nav */}
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-sand-100 text-ink-600">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-ink-900">{calYear} &nbsp;{monthNames[calMonth]}</span>
                  <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-sand-100 text-ink-600">
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {dayHeaders.map((d, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-ink-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {calendarCells.map((day, i) => {
                    if (!day) return <div key={i} />
                    const past = isPast(day)
                    const selected = isSelected(day)
                    const today = isToday(day)
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={past}
                        onClick={() => selectDay(day)}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors font-medium
                          ${selected ? 'bg-bordeaux-600 text-white' : ''}
                          ${!selected && today ? 'border border-bordeaux-400 text-bordeaux-700' : ''}
                          ${!selected && !today && !past ? 'text-ink-800 hover:bg-bordeaux-50 hover:text-bordeaux-700' : ''}
                          ${past ? 'text-ink-400/50 cursor-not-allowed' : ''}
                        `}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
                {/* Legend + Hoje */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-900/8 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-ink-600">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink-900" />
                    {t.available}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink-400/30" />
                    {t.unavailable}
                  </div>
                  <button
                    type="button"
                    onClick={goToday}
                    className="ml-auto rounded-full bg-bordeaux-600 px-3 py-1 text-xs font-semibold text-white hover:bg-bordeaux-700"
                  >
                    {t.today}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Horário */}
          <div>
            <label className="label-field">* {t.time}</label>
            {!date || !partySize ? (
              <p className="text-xs text-ink-400 mt-1">{t.chooseDatePh}</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-ink-600 mt-1">
                <Loader2 size={15} className="animate-spin" /> {t.loading}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-ink-600 mt-1">{t.noSlots}</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 mt-1">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time}
                    disabled={!slot.is_available}
                    onClick={() => setTime(slot.time)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      time === slot.time
                        ? 'border-bordeaux-600 bg-bordeaux-600 text-white'
                        : slot.is_available
                        ? 'border-ink-900/15 text-ink-800 hover:border-bordeaux-400 hover:bg-bordeaux-50'
                        : 'cursor-not-allowed border-ink-900/8 text-ink-400 line-through'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            )}
            {errors.time && <p className="error-text">{errors.time}</p>}
          </div>

          <button
            type="button"
            onClick={goToStep2}
            className="btn-primary w-full justify-center"
          >
            {t.advance}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resumo */}
          <div className="rounded-lg bg-sand-100 px-4 py-3 text-sm text-ink-700">
            <span className="font-semibold">{partySize} {partySize === 1 ? t.person : t.persons}</span>
            {' · '}
            <span>{displayDate}</span>
            {' · '}
            <span className="font-semibold">{formatTime(time)}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">{t.name}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder={t.namePh} />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>
            <div>
              <label className="label-field">{t.whatsapp}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder={t.phonePh} />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="label-field">{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder={t.emailPh} />
          </div>

          <div>
            <label className="label-field">{t.notes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field min-h-[72px] resize-none" placeholder={t.notesPh} />
          </div>

          {submitError && (
            <p className="rounded bg-rust-500/10 px-3 py-2 text-sm font-medium text-rust-600">{submitError}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">
              {t.back}
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t.confirm}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
