'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { ApiError } from '@/types/api'
import { OperatingHour, WEEKDAY_LABELS, WeekDay } from '@/types'

const ORDER: WeekDay[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export function HourManager({ restaurantId }: { restaurantId: string }) {
  const [hours, setHours] = useState<OperatingHour[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    restaurantsService.getHours(restaurantId)
      .then((d) => setHours([...d].sort((a, b) => ORDER.indexOf(a.weekday) - ORDER.indexOf(b.weekday))))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar horários.'))
      .finally(() => setLoading(false))
  }, [restaurantId])

  function update(id: string, patch: Partial<OperatingHour>) {
    setHours((p) => p.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }

  async function persist(h: OperatingHour) {
    setSavingId(h.id); setError(null)
    try {
      const u = await restaurantsService.updateHour(restaurantId, h.id, { is_open: h.is_open, start_time: h.start_time, end_time: h.end_time, max_capacity: h.max_capacity })
      update(h.id, u)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally { setSavingId(null) }
  }

  if (loading) return <p className="text-sm text-ink-600">Carregando horários…</p>

  return (
    <div className="card overflow-hidden">
      {error && <p className="border-b border-ink-900/8 bg-rust-500/5 px-4 py-2 text-sm text-rust-600">{error}</p>}
      <table className="w-full text-sm">
        <thead className="bg-sand-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
          <tr>
            <th className="px-4 py-3">Dia</th><th className="px-4 py-3">Aberto</th>
            <th className="px-4 py-3">Abre</th><th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Capacidade</th><th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/8">
          {hours.map((h) => (
            <tr key={h.id} className={!h.is_open ? 'opacity-50' : ''}>
              <td className="px-4 py-3 font-medium">{WEEKDAY_LABELS[h.weekday]}</td>
              <td className="px-4 py-3"><input type="checkbox" checked={h.is_open} onChange={(e) => update(h.id, { is_open: e.target.checked })} className="h-4 w-4 accent-bordeaux-600" /></td>
              <td className="px-4 py-3"><input type="time" value={h.start_time} disabled={!h.is_open} onChange={(e) => update(h.id, { start_time: e.target.value })} className="input-field !w-32 !py-1.5" /></td>
              <td className="px-4 py-3"><input type="time" value={h.end_time} disabled={!h.is_open} onChange={(e) => update(h.id, { end_time: e.target.value })} className="input-field !w-32 !py-1.5" /></td>
              <td className="px-4 py-3"><input type="number" min={1} value={h.max_capacity} disabled={!h.is_open} onChange={(e) => update(h.id, { max_capacity: Number(e.target.value) })} className="input-field !w-24 !py-1.5" /></td>
              <td className="px-4 py-3">
                <button onClick={() => persist(h)} disabled={savingId === h.id} className="btn-secondary !py-1.5 text-xs">
                  {savingId === h.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}Salvar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
