'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { restaurantsService } from '@/services/restaurants'
import { formatDate, formatPercent } from '@/utils/formatting'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AnalyticsSummary, Restaurant } from '@/types'

export default function RestaurantAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([restaurantsService.getRestaurant(id), restaurantsService.getAnalytics(id)])
      .then(([r, a]) => { setRestaurant(r); setSummary(a) }).finally(() => setLoading(false))
  }, [id])
  if (loading) return <LoadingSpinner label="Carregando…" />
  if (!restaurant || !summary) return <p className="error-text">Não encontrado.</p>
  const chartData = summary.reservations_by_day.map((d) => ({ date: formatDate(d.date).slice(0, 5), reservas: d.count }))
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{restaurant.name}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: String(summary.total_reservations) },
          { label: 'Confirmadas', value: String(summary.confirmed_reservations) },
          { label: 'Canceladas', value: String(summary.cancelled_reservations) },
          { label: 'Ocupação', value: formatPercent(summary.occupancy_rate * 100) },
        ].map((c) => <div key={c.label} className="card p-5"><p className="text-2xl font-semibold">{c.value}</p><p className="text-sm text-ink-600">{c.label}</p></div>)}
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Reservas por dia</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,27,22,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#766E63' }} />
              <YAxis tick={{ fontSize: 12, fill: '#766E63' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reservas" fill="#6B1E2F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
