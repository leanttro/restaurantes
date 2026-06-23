'use client'
import { FormEvent, useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Calendar, Clock, Users } from 'lucide-react'
import { reservationsService } from '@/services/reservations'
import { ApiError } from '@/types/api'
import { AvailabilitySlot, Reservation, Restaurant } from '@/types'

type Lang = 'pt' | 'en' | 'es'

const T: Record<Lang, Record<string, string>> = {
  pt: {
    people: 'Pessoas', time: 'Horário', name: 'Nome completo',
    whatsapp: 'WhatsApp', email: 'E-mail (opcional)', notes: 'Observações (opcional)',
    confirm: 'Confirmar reserva', loading: 'Consultando…', noSlots: 'Nenhum horário disponível neste dia.',
    namePh: 'Como podemos te chamar', phonePh: '(11) 90000-0000', emailPh: 'voce@email.com',
    notesPh: 'Aniversário, alergias, preferência de mesa…',
    errDate: 'Escolha uma data.', errParty: 'Selecione a quantidade de pessoas.',
    errTime: 'Selecione um horário.', errName: 'Informe seu nome.',
    errPhone: 'Informe um telefone válido (10-11 dígitos).', errSubmit: 'Não foi possível concluir a reserva.',
    person: 'Pessoa', persons: 'Pessoas', advance: 'Avançar', back: 'Voltar',
    today: 'Hoje', selectDate: 'Selecione uma data acima', chooseDate: 'Escolha a data da Reserva',
    chooseTime: 'Escolha o horário', available: 'Disponível', unavailable: 'Indisponível',
    withPromo: 'Com desconto no cardápio',
  },
  en: {
    people: 'People', time: 'Time', name: 'Full name',
    whatsapp: 'WhatsApp', email: 'Email (optional)', notes: 'Notes (optional)',
    confirm: 'Confirm reservation', loading: 'Checking…', noSlots: 'No slots available this day.',
    namePh: 'How should we call you', phonePh: '+1 555 0000000', emailPh: 'you@email.com',
    notesPh: 'Birthday, allergies, table preference…',
    errDate: 'Choose a date.', errParty: 'Select number of people.',
    errTime: 'Select a time slot.', errName: 'Please enter your name.',
    errPhone: 'Please enter a valid phone (10-11 digits).', errSubmit: 'Could not complete the reservation.',
    person: 'Person', persons: 'People', advance: 'Next', back: 'Back',
    today: 'Today', selectDate: 'Select a date above', chooseDate: 'Choose the Reservation Date',
    chooseTime: 'Choose the time', available: 'Available', unavailable: 'Unavailable',
    withPromo: 'With menu discount',
  },
  es: {
    people: 'Personas', time: 'Hora', name: 'Nombre completo',
    whatsapp: 'WhatsApp', email: 'Correo (opcional)', notes: 'Notas (opcional)',
    confirm: 'Confirmar reserva', loading: 'Consultando…', noSlots: 'Sin horarios disponibles este día.',
    namePh: '¿Cómo te llamamos?', phonePh: '+34 600 000000', emailPh: 'tu@email.com',
    notesPh: 'Cumpleaños, alergias, preferencia de mesa…',
    errDate: 'Elige una fecha.', errParty: 'Selecciona el número de personas.',
    errTime: 'Selecciona un horario.', errName: 'Indica tu nombre.',
    errPhone: 'Indica un teléfono válido (10-11 dígitos).', errSubmit: 'No se pudo completar la reserva.',
    person: 'Persona', persons: 'Personas', advance: 'Avanzar', back: 'Volver',
    today: 'Hoy', selectDate: 'Selecciona una fecha arriba', chooseDate: 'Elige la fecha de Reserva',
    chooseTime: 'Elige el horario', available: 'Disponible', unavailable: 'No disponible',
    withPromo: 'Con descuento en el menú',
  },
}

const MONTH_FULL: Record<Lang, string[]> = {
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
}

const DAY_SHORT: Record<Lang, string[]> = {
  pt: ['D','S','T','Q','Q','S','S'],
  en: ['S','M','T','W','T','F','S'],
  es: ['D','L','M','X','J','V','S'],
}

function formatPhoneToE164(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) return `55${clean}`
  if (clean.length === 10) return `55${clean}`
  if (clean.length >= 12) return clean.startsWith('55') ? clean : clean.slice(1)
  return clean
}

function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '')
  return clean.length >= 10 && clean.length <= 13
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  return `${h}:${m}`
}

interface Props {
  restaurant: Restaurant
  onSuccess: (r: Reservation) => void
  lang?: Lang
}

export function ReservationForm({ restaurant, onSuccess, lang = 'pt' }: Props) {
  const t = T[lang]
  const months = MONTH_FULL[lang]
  const days = DAY_SHORT[lang]

  const maxParty = restaurant.max_party_size ?? 20
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  const [step, setStep] = useState<1 | 2>(1)
  const [partySize, setPartySize] = useState(0)
  const [date, setDate] = useState('')
  const [showCal, setShowCal] = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })
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

  // Fetch slots when date or partySize changes
  useEffect(() => {
    if (!date || date <= todayStr || !partySize) { setSlots([]); setTime(''); return }
    let active = true
    setLoadingSlots(true); setTime('')
    reservationsService
      .checkAvailability(restaurant.id, date, partySize)
      .then((s) => { if (active) setSlots(s) })
      .catch(() => { if (active) setSlots([]) })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [date, partySize, restaurant.id])

  // Build calendar grid
  const calDays = useCallback(() => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    // pad to complete last week
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [calMonth])

  function prevMonth() {
    setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }
  function goToday() {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0)
    setCalMonth(d)
  }

  function selectDate(d: Date) {
    const ds = toDateStr(d)
    setDate(ds)
    setTime('')
    setShowCal(false)
  }

  function validateStep1() {
    const e: Record<string, string | undefined> = {}
    if (!partySize) e.partySize = t.errParty
    if (!date || date <= todayStr) e.date = t.errDate
    if (!time) e.time = t.errTime
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e: Record<string, string | undefined> = {}
    if (!name.trim()) e.name = t.errName
    if (!isValidPhone(phone)) e.phone = t.errPhone
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validateStep2()) return
    setSubmitting(true)
    try {
      const phoneE164 = formatPhoneToE164(phone)
      const reservation = await reservationsService.createReservation({
        restaurant_id: restaurant.id,
        guest_name: name.trim(),
        guest_phone: phoneE164,
        guest_email: email.trim() || undefined,
        reservation_date: date,
        reservation_time: time,
        party_size: partySize,
        special_requests: notes.trim() || undefined,
      })
      onSuccess(reservation)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t.errSubmit)
    } finally { setSubmitting(false) }
  }

  const selectedDate = date ? new Date(date + 'T00:00:00') : null
  const displayDate = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2,'0')}/${String(selectedDate.getMonth()+1).padStart(2,'0')}/${selectedDate.getFullYear()}`
    : ''

  const selectedMonthLabel = `${calMonth.getFullYear()}  ${months[calMonth.getMonth()]}`
  const cells = calDays()

  return (
    <div className="w-full">
      {step === 1 ? (
        <div className="space-y-6">

          {/* ── Slicer de pessoas ── */}
          <div>
            <p className="label-field mb-3 flex items-center gap-1.5">
              <Users size={14} className="text-bordeaux-600" />
              * {t.people}
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxParty }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPartySize(n)}
                  className={`h-10 min-w-[2.5rem] rounded-lg border px-3 text-sm font-medium transition-all
                    ${partySize === n
                      ? 'border-bordeaux-600 bg-bordeaux-600 text-white shadow-sm'
                      : 'border-ink-900/15 text-ink-700 hover:border-bordeaux-400 hover:bg-bordeaux-50'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {errors.partySize && <p className="error-text mt-1">{errors.partySize}</p>}
          </div>

          {/* ── Calendário ── */}
          <div>
            <p className="label-field mb-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-bordeaux-600" />
              * Data
            </p>

            {/* Input trigger */}
            <button
              type="button"
              onClick={() => setShowCal(v => !v)}
              className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all
                ${showCal ? 'border-bordeaux-600 ring-1 ring-bordeaux-300' : 'border-ink-900/15 hover:border-bordeaux-400'}
                ${date ? 'text-ink-900 font-medium' : 'text-ink-400'}
              `}
            >
              <span>{date ? displayDate : t.chooseDate}</span>
              <Calendar size={16} className="text-ink-400 shrink-0" />
            </button>
            {errors.date && <p className="error-text mt-1">{errors.date}</p>}

            {/* Calendar dropdown */}
            {showCal && (
              <div className="mt-2 rounded-2xl border border-ink-900/10 bg-white shadow-lg overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-ink-900/8">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setCalMonth(m => new Date(m.getFullYear() - 1, m.getMonth(), 1))} className="rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-ink-700 text-xs">‹‹</button>
                    <button type="button" onClick={prevMonth} className="rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-ink-700">‹</button>
                  </div>
                  <span className="text-sm font-semibold text-ink-800 tracking-wide">{selectedMonthLabel}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={nextMonth} className="rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-ink-700">›</button>
                    <button type="button" onClick={() => setCalMonth(new Date(calMonth.getFullYear() + 1, calMonth.getMonth(), 1))} className="rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-ink-700 text-xs">››</button>
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 px-3 pt-3">
                  {days.map((d, i) => (
                    <div key={i} className={`text-center text-[11px] font-bold pb-2 ${i === 0 ? 'text-rust-600' : 'text-ink-500'}`}>{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const ds = toDateStr(d)
                    const isPast = d <= today
                    const isSelected = ds === date
                    const isSun = d.getDay() === 0
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isPast}
                        onClick={() => selectDate(d)}
                        className={`
                          relative flex flex-col items-center justify-center rounded-full w-9 h-9 mx-auto text-sm font-medium transition-all
                          ${isSelected ? 'bg-bordeaux-600 text-white shadow' : ''}
                          ${!isSelected && !isPast ? `hover:bg-bordeaux-50 hover:text-bordeaux-700 ${isSun ? 'text-rust-600' : 'text-ink-800'}` : ''}
                          ${isPast ? 'text-ink-300 cursor-not-allowed' : ''}
                        `}
                      >
                        {d.getDate()}
                        {/* availability dot — shown only for future dates */}
                        {!isPast && (
                          <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-ink-800'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend + today button */}
                <div className="border-t border-ink-900/8 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-ink-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ink-800 inline-block" />{t.available}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ink-300 inline-block" />{t.unavailable}</span>
                  </div>
                  <button
                    type="button"
                    onClick={goToday}
                    className="rounded-lg bg-bordeaux-600 px-3 py-1 text-xs font-semibold text-white hover:bg-bordeaux-700 transition-colors"
                  >
                    {t.today}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Horário (dropdown) ── */}
          <div>
            <p className="label-field mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-bordeaux-600" />
              * {t.time}
            </p>
            {!date || date <= todayStr ? (
              <div className="w-full rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-400 bg-sand-50">
                {t.chooseDate}
              </div>
            ) : !partySize ? (
              <div className="w-full rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-400 bg-sand-50">
                {t.errParty}
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-ink-600 px-4 py-3 rounded-xl border border-ink-900/10">
                <Loader2 size={14} className="animate-spin text-bordeaux-600" /> {t.loading}
              </div>
            ) : slots.length === 0 ? (
              <div className="w-full rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-500 bg-sand-50">
                {t.noSlots}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className={`w-full appearance-none rounded-xl border px-4 py-3 pr-10 text-sm transition-all bg-white
                    ${time ? 'border-bordeaux-600 text-ink-900 font-medium' : 'border-ink-900/15 text-ink-400'}
                    focus:outline-none focus:border-bordeaux-600 focus:ring-1 focus:ring-bordeaux-300
                  `}
                >
                  <option value="">{t.chooseTime}</option>
                  {slots.map(slot => (
                    <option key={slot.time} value={slot.time} disabled={!slot.is_available}>
                      {formatTime(slot.time)}{!slot.is_available ? ` — ${t.unavailable}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ink-400 pointer-events-none" />
              </div>
            )}
            {errors.time && <p className="error-text mt-1">{errors.time}</p>}
          </div>

          <button
            type="button"
            onClick={() => { if (validateStep1()) setStep(2) }}
            className="btn-primary w-full justify-center"
          >
            {t.advance}
          </button>
        </div>

      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resumo */}
          <div className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-ink-700 flex flex-wrap gap-x-3 gap-y-1">
            <span className="font-semibold">{partySize} {partySize === 1 ? t.person : t.persons}</span>
            <span className="text-ink-400">·</span>
            <span>{displayDate}</span>
            <span className="text-ink-400">·</span>
            <span className="font-semibold">{formatTime(time)}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label-field">{t.name} *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder={t.namePh}
                autoComplete="name"
              />
              {errors.name && <p className="error-text mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="label-field">{t.whatsapp} *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input-field"
                placeholder={t.phonePh}
                autoComplete="tel"
              />
              {errors.phone && <p className="error-text mt-0.5">{errors.phone}</p>}
            </div>
            <div>
              <label className="label-field">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder={t.emailPh}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-field">{t.notes}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input-field min-h-[72px] resize-none"
                placeholder={t.notesPh}
              />
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg bg-rust-500/10 px-4 py-3 flex gap-3 items-start">
              <AlertCircle size={16} className="text-rust-600 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-rust-600">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
