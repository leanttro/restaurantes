'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { ApiError } from '@/types/api'
import { AvailableHour, DAY_LABELS } from '@/types'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

interface DraftHour {
  day_of_week: number
  start_time: string
  end_time: string
  interval_minutes: number
  max_capacity: number
}

const DEFAULT_DRAFT: DraftHour = {
  day_of_week: 0,
  start_time: '12:00',
  end_time: '23:00',
  interval_minutes: 30,
  max_capacity: 40,
}

export function HourManager({ restaurantId }: { restaurantId: string }) {
  const [hours, setHours] = useState<AvailableHour[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<DraftHour>({ ...DEFAULT_DRAFT })
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    load()
  }, [restaurantId])

  async function load() {
    setLoading(true)
    try {
      const data = await restaurantsService.getHours(restaurantId)
      setHours([...data].sort((a, b) => a.day_of_week - b.day_of_week))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar horários.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    setAdding(true)
    setError(null)
    try {
      const created = await restaurantsService.createHour(restaurantId, {
        ...draft,
        is_active: true,
      })
      setHours((prev) =>
        [...prev, created].sort((a, b) => a.day_of_week - b.day_of_week)
      )
      setShowForm(false)
      setDraft({ ...DEFAULT_DRAFT })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao adicionar horário.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(hour: AvailableHour) {
    setDeletingId(hour.id)
    setError(null)
    try {
      await restaurantsService.deleteHour(restaurantId, hour.id)
      setHours((prev) => prev.filter((h) => h.id !== hour.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover horário.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <p className="text-sm text-ink-600">Carregando horários…</p>

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{error}</p>
      )}

      {/* Lista de horários existentes */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
            <tr>
              <th className="px-4 py-3">Dia</th>
              <th className="px-4 py-3">Abre</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Intervalo</th>
              <th className="px-4 py-3">Capacidade</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/8">
            {hours.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-500">
                  Nenhum horário cadastrado. Adicione um abaixo.
                </td>
              </tr>
            )}
            {hours.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-3 font-medium">{DAY_LABELS[h.day_of_week]}</td>
                <td className="px-4 py-3">{h.start_time}</td>
                <td className="px-4 py-3">{h.end_time}</td>
                <td className="px-4 py-3">{h.interval_minutes} min</td>
                <td className="px-4 py-3">{h.max_capacity} pessoas</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(h)}
                    disabled={deletingId === h.id}
                    className="btn-secondary !py-1.5 text-xs text-rust-600 hover:border-rust-300 hover:bg-rust-50"
                  >
                    {deletingId === h.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulário de adição */}
      {showForm ? (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-ink-900 text-sm">Novo horário</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field">Dia da semana</label>
              <select
                value={draft.day_of_week}
                onChange={(e) => setDraft((d) => ({ ...d, day_of_week: Number(e.target.value) }))}
                className="input-field"
              >
                {ALL_DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Abertura</label>
              <input
                type="time"
                value={draft.start_time}
                onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Fechamento</label>
              <input
                type="time"
                value={draft.end_time}
                onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Intervalo (min)</label>
              <input
                type="number"
                min={15}
                max={120}
                step={15}
                value={draft.interval_minutes}
                onChange={(e) => setDraft((d) => ({ ...d, interval_minutes: Number(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Capacidade máx.</label>
              <input
                type="number"
                min={1}
                value={draft.max_capacity}
                onChange={(e) => setDraft((d) => ({ ...d, max_capacity: Number(e.target.value) }))}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding} className="btn-primary !py-2 text-sm">
              {adding && <Loader2 size={14} className="animate-spin" />}
              Salvar horário
            </button>
            <button
              onClick={() => { setShowForm(false); setDraft({ ...DEFAULT_DRAFT }) }}
              className="btn-secondary !py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Plus size={15} /> Adicionar horário
        </button>
      )}
    </div>
  )
}
