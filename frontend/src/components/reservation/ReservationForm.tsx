'use client'
import { FormEvent, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { reservationsService } from '@/services/reservations'
import { validateEmail, validateFutureDate, validatePartySize, validatePhone, validateRequired } from '@/utils/validators'
import { formatTime } from '@/utils/formatting'
import { ApiError } from '@/types/api'
import { AvailabilitySlot, Reservation, Restaurant } from '@/types'

interface ReservationFormProps { restaurant: Restaurant; onSuccess: (r: Reservation) => void }

export function ReservationForm({ restaurant, onSuccess }: ReservationFormProps) {
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

  useEffect(() => {
    if (!date || partySize < 1 || validateFutureDate(date)) { setSlots([]); return }
    let active = true
    setLoadingSlots(true); setTime('')
    reservationsService.checkAvailability(restaurant.id, date, partySize)
      .then((r) => { if (active) setSlots(r) })
      .catch(() => { if (active) setSlots([]) })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [date, partySize, restaurant.id])

  function validate() {
    const next = {
      date: validateFutureDate(date), partySize: validatePartySize(partySize, restaurant.max_party_size),
      time: validateRequired(time, 'O horário'), name: validateRequired(name, 'O nome'),
      phone: validatePhone(phone), email: email ? validateEmail(email) : undefined,
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSubmitError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const reservation = await reservationsService.createReservation({
        restaurant_id: restaurant.id, client_name: name, client_phone: phone,
        client_email: email || undefined, date, time, party_size: partySize,
        notes: notes || undefined, source: 'form',
      })
      onSuccess(reservation)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível concluir a reserva.')
    } finally { setSubmitting(false) }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-field">Data</label>
          <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          {errors.date && <p className="error-text">{errors.date}</p>}
        </div>
        <div>
          <label className="label-field">Pessoas</label>
          <input type="number" min={1} max={restaurant.max_party_size} value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} className="input-field" />
          {errors.partySize && <p className="error-text">{errors.partySize}</p>}
        </div>
      </div>
      <div>
        <label className="label-field">Horário</label>
        {loadingSlots && <div className="flex items-center gap-2 text-sm text-ink-600"><Loader2 size={15} className="animate-spin" /> Consultando…</div>}
        {!loadingSlots && date && slots.length === 0 && <p className="text-sm text-ink-600">Nenhum horário disponível.</p>}
        {!loadingSlots && slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((slot) => (
              <button type="button" key={slot.time} disabled={!slot.available} onClick={() => setTime(slot.time)}
                className={`rounded border px-2 py-1.5 text-sm font-medium transition-colors ${time === slot.time ? 'border-bordeaux-600 bg-bordeaux-600 text-sand-50' : slot.available ? 'border-ink-900/15 text-ink-800 hover:border-bordeaux-400' : 'cursor-not-allowed border-ink-900/8 text-ink-400 line-through'}`}>
                {formatTime(slot.time)}
              </button>
            ))}
          </div>
        )}
        {errors.time && <p className="error-text">{errors.time}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Nome completo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Como podemos te chamar" />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>
        <div>
          <label className="label-field">WhatsApp</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="(11) 90000-0000" />
          {errors.phone && <p className="error-text">{errors.phone}</p>}
        </div>
      </div>
      <div>
        <label className="label-field">E-mail (opcional)</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="voce@email.com" />
        {errors.email && <p className="error-text">{errors.email}</p>}
      </div>
      <div>
        <label className="label-field">Observações (opcional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field min-h-[72px] resize-none" placeholder="Aniversário, alergias, preferência de mesa…" />
      </div>
      {submitError && <p className="rounded bg-rust-500/10 px-3 py-2 text-sm font-medium text-rust-600">{submitError}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting && <Loader2 size={16} className="animate-spin" />}Confirmar reserva
      </button>
    </form>
  )
}
