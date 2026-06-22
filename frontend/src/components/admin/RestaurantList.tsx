'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Power, Search } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { formatDate } from '@/utils/formatting'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ApiError } from '@/types/api'
import { Restaurant, RestaurantStatus } from '@/types'

const STATUS_LABEL: Record<RestaurantStatus, string> = { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' }
const STATUS_CLASS: Record<RestaurantStatus, string> = { active: 'status-pill--confirmed', inactive: 'status-pill--cancelled', pending: 'status-pill--pending' }

export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RestaurantStatus | 'all'>('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      restaurantsService.getRestaurants({ search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 })
        .then((r) => setRestaurants(r.items))
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Erro.'))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  async function toggleStatus(r: Restaurant) {
    const next = r.status === 'active' ? 'inactive' : 'active'
    const u = await restaurantsService.setStatus(r.id, next)
    setRestaurants((p) => p.map((x) => (x.id === r.id ? u : x)))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome…" className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RestaurantStatus | 'all')} className="input-field !w-auto">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {loading && <LoadingSpinner label="Carregando…" />}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
              <tr><th className="px-4 py-3">Restaurante</th><th className="px-4 py-3">Cidade</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Desde</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-ink-900/8">
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-ink-600">{r.city}</td>
                  <td className="px-4 py-3"><span className={`status-pill ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/restaurants/${r.id}/analytics`} className="btn-ghost !py-1.5 text-xs">Analytics</Link>
                      <button onClick={() => toggleStatus(r)} className="btn-ghost !py-1.5 text-xs" title={r.status === 'active' ? 'Desativar' : 'Ativar'}><Power size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-600">Nenhum restaurante encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
