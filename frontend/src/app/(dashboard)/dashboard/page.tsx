'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarCheck2, PlusCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { restaurantsService } from '@/services/restaurants'
import { formatDate } from '@/utils/formatting'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AnalyticsSummary } from '@/types'

export default function DashboardHomePage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id || ''
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) return
    restaurantsService.getAnalytics(restaurantId).then(setSummary).finally(() => setLoading(false))
  }, [restaurantId])

  if (loading) return <LoadingSpinner label="Carregando painel…" />

  const chartData = (summary?.reservations_by_day || []).map((d) => ({ date: formatDate(d.date).slice(0, 5), reservas: d.count }))

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-semibold text-ink-900">Olá, {user?.full_name?.split(' ')[0]} 👋</h1></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-bordeaux-600/10 text-bordeaux-600"><CalendarCheck2 size={16} /></div><p className="text-2xl font-semibold">{summary?.total_reservations ?? 0}</p><p className="text-sm text-ink-600">Total de reservas</p></div>
        <div className="card p-5"><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-sage-500/10 text-sage-600"><CalendarCheck2 size={16} /></div><p className="text-2xl font-semibold">{summary?.confirmed_reservations ?? 0}</p><p className="text-sm text-ink-600">Confirmadas</p></div>
        <div className="card p-5"><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/10 text-gold-600"><CalendarCheck2 size={16} /></div><p className="text-2xl font-semibold">{Math.round((summary?.occupancy_rate ?? 0) * 100)}%</p><p className="text-sm text-ink-600">Taxa de ocupação</p></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/promotions" className="btn-secondary text-xs"><PlusCircle size={14} /> Nova promoção</Link>
        <Link href="/dashboard/reservations" className="btn-secondary text-xs"><CalendarCheck2 size={14} /> Ver reservas</Link>
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Reservas — últimos 7 dias</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,27,22,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#766E63' }} />
              <YAxis tick={{ fontSize: 12, fill: '#766E63' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="reservas" fill="#C99A2E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
