'use client'
import { useEffect, useState } from 'react'
import { Check, MessageSquarePlus, X } from 'lucide-react'
import { reservationsService } from '@/services/reservations'
import { formatDateTime, formatPhone, formatRelativeDay } from '@/utils/formatting'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ApiError } from '@/types/api'
import { Reservation, ReservationStatus } from '@/types'

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'Pendente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Concluída', no_show: 'Não compareceu',
}
const STATUS_CLASS: Record<ReservationStatus, string> = {
  pending: 'status-pill--pending', confirmed: 'status-pill--confirmed',
  cancelled: 'status-pill--cancelled', completed: 'status-pill--confirmed', no_show: 'status-pill--cancelled',
}

export function ReservationList({ restaurantId }: { restaurantId: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  async function load() {
    setLoading(true); setError(null)
    try {
      const result = await reservationsService.getReservations(restaurantId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        date: dateFilter || undefined, limit: 50,
      })
      setReservations(result.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar reservas.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [restaurantId, statusFilter, dateFilter]) // eslint-disable-line

  async function handleConfirm(id: string) {
    const u = await reservationsService.confirmReservation(id)
    setReservations((p) => p.map((r) => (r.id === id ? u : r)))
  }
  async function handleCancel(id: string) {
    const u = await reservationsService.cancelReservation(id)
    setReservations((p) => p.map((r) => (r.id === id ? u : r)))
  }
  async function handleSaveNote(id: string) {
    const u = await reservationsService.addNote(id, noteDraft)
    setReservations((p) => p.map((r) => (r.id === id ? u : r)))
    setNoteOpenId(null); setNoteDraft('')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'all')} className="input-field !w-auto">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field !w-auto" />
        {dateFilter && <button className="btn-ghost text-xs" onClick={() => setDateFilter('')}>Limpar data</button>}
      </div>
      {loading && <LoadingSpinner label="Carregando reservas…" />}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && reservations.length === 0 && (
        <p className="rounded border border-dashed border-ink-900/15 px-4 py-8 text-center text-sm text-ink-600">Nenhuma reserva encontrada.</p>
      )}
      <div className="space-y-2.5">
        {reservations.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">{r.client_name} · {r.party_size} pessoa{r.party_size > 1 ? 's' : ''}</p>
                <p className="text-sm text-ink-600">{formatRelativeDay(r.date)} · {formatDateTime(r.date, r.time)} · {formatPhone(r.client_phone)}</p>
                {r.notes && <p className="mt-1 text-xs italic text-ink-600">"{r.notes}"</p>}
              </div>
              <span className={`status-pill ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-900/8 pt-3">
              {r.status === 'pending' && <button onClick={() => handleConfirm(r.id)} className="btn-secondary !py-1.5 text-xs"><Check size={13} /> Confirmar</button>}
              {r.status !== 'cancelled' && r.status !== 'completed' && (
                <button onClick={() => handleCancel(r.id)} className="btn-secondary !py-1.5 text-xs text-rust-600"><X size={13} /> Cancelar</button>
              )}
              <button onClick={() => { setNoteOpenId(r.id); setNoteDraft(r.notes || '') }} className="btn-ghost !py-1.5 text-xs"><MessageSquarePlus size={13} /> Nota</button>
            </div>
            {noteOpenId === r.id && (
              <div className="mt-3 flex gap-2">
                <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} className="input-field flex-1" placeholder="Observação interna…" />
                <button onClick={() => handleSaveNote(r.id)} className="btn-primary !py-2 text-xs">Salvar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
