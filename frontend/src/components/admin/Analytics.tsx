'use client'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarCheck, Percent, Store, TrendingUp } from 'lucide-react'
import { formatCurrencyBRL, formatDate } from '@/utils/formatting'
import { SuperAdminSummary } from '@/types'

export function Analytics({ summary }: { summary: SuperAdminSummary }) {
  const chartData = summary.reservations_by_day.map((d) => ({ date: formatDate(d.date).slice(0, 5), reservas: d.count }))
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Store} label="Restaurantes" value={String(summary.total_restaurants)} />
        <StatCard icon={CalendarCheck} label="Total de reservas" value={String(summary.total_reservations)} />
        <StatCard icon={TrendingUp} label="Receita estimada" value={formatCurrencyBRL(summary.revenue_estimate)} />
        <StatCard icon={Percent} label="Restaurantes ativos" value={String(summary.active_restaurants)} />
      </div>
      <div className="card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Reservas por dia</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,27,22,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#766E63' }} />
              <YAxis tick={{ fontSize: 12, fill: '#766E63' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="reservas" fill="#6B1E2F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-bordeaux-600/10 text-bordeaux-600"><Icon size={16} /></div>
      <p className="text-2xl font-semibold text-ink-900">{value}</p>
      <p className="text-sm text-ink-600">{label}</p>
    </div>
  )
}
