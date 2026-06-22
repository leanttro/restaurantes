'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { restaurantsService } from '@/services/restaurants'
import { ChatbotWidget } from '@/components/reservation/ChatbotWidget'
import { ReservationForm } from '@/components/reservation/ReservationForm'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Restaurant, Reservation } from '@/types'

export default function RestaurantPage() {
  const { restaurant: slug } = useParams<{ restaurant: string }>()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [useForm, setUseForm] = useState(false)

  useEffect(() => {
    restaurantsService.getRestaurant(slug).then(setRestaurant).finally(() => setLoading(false))
  }, [slug])

  function handleComplete(reservation: Reservation) {
    router.push(`/success?code=${reservation.confirmation_code}`)
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" label="Carregando…" /></div>
  if (!restaurant) return <div className="flex min-h-screen items-center justify-center"><p className="text-ink-600">Restaurante não encontrado.</p></div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-900">{restaurant.name}</h1>
        {restaurant.cuisine_type && <p className="text-gold-600">{restaurant.cuisine_type} · {restaurant.city}</p>}
        {restaurant.description && <p className="mt-3 text-ink-600">{restaurant.description}</p>}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">Faça sua reserva</h2>
          {!useForm ? (
            <ChatbotWidget restaurantId={restaurant.id} restaurantName={restaurant.name} onReservationComplete={handleComplete} onUseFormInstead={() => setUseForm(true)} />
          ) : (
            <>
              <ReservationForm restaurant={restaurant} onSuccess={handleComplete} />
              <button onClick={() => setUseForm(false)} className="mt-3 text-xs text-ink-600 hover:text-bordeaux-600">← Usar assistente de IA</button>
            </>
          )}
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">Informações</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="font-medium text-ink-900">Endereço</dt><dd className="text-ink-600">{restaurant.address}</dd></div>
              <div><dt className="font-medium text-ink-900">Telefone</dt><dd className="text-ink-600">{restaurant.phone}</dd></div>
              <div><dt className="font-medium text-ink-900">Máx. por mesa</dt><dd className="text-ink-600">{restaurant.max_party_size} pessoas</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
