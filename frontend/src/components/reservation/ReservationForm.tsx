'use client'
import { FormEvent, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
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
    today: 'Hoje', selectDate: 'Selecione uma data acima', success: 'Reserva confirmada!',
    successMsg: 'Você receberá um e-mail de confirmação com detalhes. Obrigado!',
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
    today: 'Today', selectDate: 'Select a date above', success: 'Reservation confirmed!',
    successMsg: 'You will receive a confirmation email with details. Thank you!',
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
    today: 'Hoy', selectDate: 'Selecciona una fecha arriba', success: 'Reserva confirmada!',
    successMsg: 'Recibirás un correo con los detalles de tu reserva. ¡Gracias!',
  },
}

const MONTH_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_FULL_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_FULL_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

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

const DAY_SHORT_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DAY_SHORT_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_SHORT_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

interface Props {
  restaurant: Restaurant
  onSuccess: (r: Reservation) => void
  lang?: Lang
}

export function ReservationForm({ restaurant, onSuccess, lang = 'pt' }: Props) {
  const t = T[lang]
  const monthFull = lang === 'en' ? MONTH_FULL_EN : lang === 'es' ? MONTH_FULL_ES : MONTH_FULL_PT
  const dayShort = lang === 'en' ? DAY_SHORT_EN : lang === 'es' ? DAY_SHORT_ES : DAY_SHORT_PT

  const maxParty = restaurant.max_party_size ?? 20
  const todayStr = new Date().toISOString().slice(0,10)

  const [step, setStep] = useState<1|2>(1)
  const [date, setDate] = useState('')
  const [partySize, setPartySize] = useState(0)
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

  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0,0,0,0)
    return d
  })

  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    const today = new Date(); today.setHours(0,0,0,0)
    if (d < today) setWeekStart(today)
    else setWeekStart(d)
  }
  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

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
    ? `${selectedDate.getDate()} de ${monthFull[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`
    : ''

  const calLabel = `${monthFull[weekStart.getMonth()]} ${weekStart.getFullYear()}`
  const today = new Date(); today.setHours(0,0,0,0)

  return (
    <div className="w-full">
      {step === 1 ? (
        <div className="space-y-6">

          {/* ── Slicer de pessoas ────────────────────────── */}
          <div>
            <p className="label-field mb-3">* {t.people}</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({length: maxParty}, (_, i) => i + 1).map(n => (
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

          {/* ── Calendário semanal (slicer de datas) ────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label-field">{calLabel}</p>
              <div className="flex gap-1">
                <button type="button" onClick={prevWeek} className="rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-ink-700">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={nextWeek} className="rounded p-1 text-ink-400 hover:bg-sand-100 hover:text-ink-700">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const ds = toDateStr(d)
                const isPast = d <= today
                const isSelected = ds === date
                const dayNum = d.getDay()
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isPast}
                    onClick={() => { setDate(ds); setTime('') }}
                    className={`flex flex-col items-center rounded-xl py-2 px-1 transition-all
                      ${isSelected ? 'bg-bordeaux-600 text-white shadow-sm' : ''}
                      ${!isSelected && !isPast ? 'border border-ink-900/10 text-ink-700 hover:border-bordeaux-400 hover:bg-bordeaux-50' : ''}
                      ${isPast ? 'text-ink-400/40 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? 'text-white/80' : isPast ? 'text-ink-400/40' : 'text-ink-400'}`}>
                      {dayShort[dayNum]}
                    </span>
                    <span className="mt-0.5 text-base font-bold leading-none">{d.getDate()}</span>
                    <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/70' : isPast ? 'text-ink-400/40' : 'text-ink-400'}`}>
                      {MONTH_PT[d.getMonth()]}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.date && <p className="error-text mt-1">{errors.date}</p>}
          </div>

          {/* ── Slicer de horários ───────────────────────── */}
          <div>
            <p className="label-field mb-3">* {t.time}</p>
            {!date ? (
              <p className="text-xs text-ink-400">{t.selectDate}</p>
            ) : !partySize ? (
              <p className="text-xs text-ink-400">{t.errParty}</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <Loader2 size={14} className="animate-spin" /> {t.loading}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-ink-500">{t.noSlots}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.is_available}
                    onClick={() => setTime(slot.time)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all
                      ${time === slot.time
                        ? 'border-bordeaux-600 bg-bordeaux-600 text-white shadow-sm'
                        : slot.is_available
                          ? 'border-ink-900/15 text-ink-700 hover:border-bordeaux-400 hover:bg-bordeaux-50'
                          : 'cursor-not-allowed border-ink-900/8 text-ink-400/50 line-through'
                      }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
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
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder={t.namePh} />
              {errors.name && <p className="error-text mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="label-field">{t.whatsapp} *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder={t.phonePh} />
              {errors.phone && <p className="error-text mt-0.5">{errors.phone}</p>}
              <p className="text-xs text-ink-400 mt-1">Será convertido automaticamente para WhatsApp</p>
            </div>
            <div>
              <label className="label-field">{t.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder={t.emailPh} />
            </div>
            <div>
              <label className="label-field">{t.notes}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field min-h-[72px] resize-none" placeholder={t.notesPh} />
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg bg-rust-500/10 px-4 py-3 flex gap-3 items-start">
              <AlertCircle size={16} className="text-rust-600 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-rust-600">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">{t.back}</button>
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
