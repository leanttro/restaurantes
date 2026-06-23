'use client'
import { FormEvent, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
  },
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
  const [date, setDate] = useState('')
  const [partySize, setPartySize] = useState(2)
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

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!date || date <= today) { setSlots([]); return }
    let active = true
    setLoadingSlots(true); setTime('')
    reservationsService
      .checkAvailability(restaurant.id, date, partySize)
      .then((s) => { if (active) setSlots(s) })
      .catch(() => { if (active) setSlots([]) })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [date, partySize, restaurant.id])

  function validate() {
    const e: Record<string, string | undefined> = {}
    if (!date || date <= today) e.date = t.errDate
    if (partySize < 1 || (restaurant.max_party_size && partySize > restaurant.max_party_size))
      e.partySize = t.errParty
    if (!time) e.time = t.errTime
    if (!name.trim()) e.name = t.errName
    if (!phone.trim() || phone.trim().length < 8) e.phone = t.errPhone
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-field">{t.date}</label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
          {errors.date && <p className="error-text">{errors.date}</p>}
        </div>
        <div>
          <label className="label-field">{t.people}</label>
          <input
            type="number"
            min={1}
            max={restaurant.max_party_size ?? 20}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="input-field"
          />
          {errors.partySize && <p className="error-text">{errors.partySize}</p>}
        </div>
      </div>

      <div>
        <label className="label-field">{t.time}</label>
        {loadingSlots && (
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <Loader2 size={15} className="animate-spin" /> {t.loading}
          </div>
        )}
        {!loadingSlots && date && slots.length === 0 && (
          <p className="text-sm text-ink-600">{t.noSlots}</p>
        )}
        {!loadingSlots && slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot.time}
                disabled={!slot.is_available}
                onClick={() => setTime(slot.time)}
                className={`rounded border px-2 py-1.5 text-sm font-medium transition-colors ${
                  time === slot.time
                    ? 'border-bordeaux-600 bg-bordeaux-600 text-sand-50'
                    : slot.is_available
                    ? 'border-ink-900/15 text-ink-800 hover:border-bordeaux-400'
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">{t.name}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder={t.namePh}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>
        <div>
          <label className="label-field">{t.whatsapp}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            placeholder={t.phonePh}
          />
          {errors.phone && <p className="error-text">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label className="label-field">{t.email}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder={t.emailPh}
        />
      </div>

      <div>
        <label className="label-field">{t.notes}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field min-h-[72px] resize-none"
          placeholder={t.notesPh}
        />
      </div>

      {submitError && (
        <p className="rounded bg-rust-500/10 px-3 py-2 text-sm font-medium text-rust-600">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {t.confirm}
      </button>
    </form>
  )
}
