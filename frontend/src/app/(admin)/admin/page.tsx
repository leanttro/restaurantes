'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Store } from 'lucide-react'
import { api } from '@/services/api'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatCurrencyBRL } from '@/utils/formatting'
import { SuperAdminSummary } from '@/types'

export default function AdminHomePage() {
  const [summary, setSummary] = useState<SuperAdminSummary | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get<SuperAdminSummary>('/admin/analytics').then(({ data }) => setSummary(data)).finally(() => setLoading(false)) }, [])
  if (loading) return <LoadingSpinner label="Carregando…" />
  if (!summary) return <p className="error-text">Erro ao carregar métricas.</p>
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Visão geral da plataforma</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Restaurantes ativos', value: `${summary.active_restaurants} / ${summary.total_restaurants}` },
          { label: 'Total de reservas', value: String(summary.total_reservations) },
          { label: 'Receita estimada', value: formatCurrencyBRL(summary.revenue_estimate) },
          { label: 'Média reservas/dia', value: String(Math.round(summary.reservations_by_day.reduce((s, d) => s + d.count, 0) / Math.max(summary.reservations_by_day.length, 1))) },
        ].map((c) => (
          <div key={c.label} className="card p-5"><p className="text-2xl font-semibold text-ink-900">{c.value}</p><p className="text-sm text-ink-600">{c.label}</p></div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/admin/restaurants" className="btn-secondary text-xs"><Store size={14} /> Ver restaurantes</Link>
        <Link href="/admin/analytics" className="btn-secondary text-xs"><BarChart3 size={14} /> Analytics completo</Link>
      </div>
    </div>
  )
}
