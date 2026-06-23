'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { reservationsService } from '@/services/reservations'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Reservation } from '@/types'

function formatDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') } catch { return d }
}

function SuccessContent() {
  const params = useSearchParams()
  const code = params.get('code') || ''
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code) {
      reservationsService.getReservationByCode(code)
        .then(setReservation)
        .catch(() => {}) // sem reserva ainda tá ok, só mostra o código
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [code])

  if (loading) return <LoadingSpinner label="Carregando…" />

  const name = reservation?.guest_name || reservation?.client_name || '—'
  const date = reservation?.reservation_date || reservation?.date
  const time = reservation?.reservation_time || reservation?.time

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle size={56} className="mx-auto mb-4 text-sage-500" />
      <h1 className="font-display text-3xl font-bold text-ink-900">Reserva confirmada!</h1>
      <p className="mt-2 text-ink-600">
        Código: <span className="font-mono font-semibold text-ink-900">{code}</span>
      </p>
      {reservation && (
        <div className="mt-6 card p-5 text-left space-y-2 text-sm">
          <p><span className="font-medium">Nome:</span> {name}</p>
          <p><span className="font-medium">Quando:</span> {formatDate(date)} {time ?? ''}</p>
          <p><span className="font-medium">Pessoas:</span> {reservation.party_size}</p>
        </div>
      )}
      <Link href="/" className="btn-primary mt-8 inline-flex">Fazer outra reserva</Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Carregando…" />}>
      <SuccessContent />
    </Suspense>
  )
}
