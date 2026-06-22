'use client'
import { useEffect, useState } from 'react'
import { Analytics } from '@/components/admin/Analytics'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { api } from '@/services/api'
import { SuperAdminSummary } from '@/types'
export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<SuperAdminSummary | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get<SuperAdminSummary>('/admin/analytics').then(({ data }) => setSummary(data)).finally(() => setLoading(false)) }, [])
  return <div><h1 className="mb-5 font-display text-2xl font-semibold text-ink-900">Analytics da plataforma</h1>{loading && <LoadingSpinner />}{!loading && summary && <Analytics summary={summary} />}</div>
}
