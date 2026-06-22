'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { RestaurantCard } from '@/components/reservation/RestaurantCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Restaurant } from '@/types'

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      restaurantsService.getRestaurants({ search: search || undefined, limit: 20 })
        .then((r) => setRestaurants(r.items))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div>
      <section className="bg-bordeaux-600 px-4 py-20 text-center text-sand-50">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Reserve sua mesa com IA</h1>
        <p className="mt-3 text-sand-100/80">Encontre restaurantes e faça reservas em segundos.</p>
        <div className="relative mx-auto mt-8 max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar restaurante ou culinária…"
            className="w-full rounded-lg border-0 py-4 pl-12 pr-4 text-ink-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? <LoadingSpinner label="Carregando restaurantes…" /> : (
          <>
            <p className="mb-6 text-sm text-ink-600">{restaurants.length} restaurante(s) encontrado(s)</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
            {restaurants.length === 0 && <p className="text-center text-ink-600">Nenhum restaurante encontrado.</p>}
          </>
        )}
      </section>
    </div>
  )
}
