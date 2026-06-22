import Link from 'next/link'
import { MapPin, UtensilsCrossed } from 'lucide-react'
import { Restaurant } from '@/types'

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/${restaurant.slug}`} className="card group overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-sand-200">
        {restaurant.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.cover_image_url} alt={restaurant.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sand-400"><UtensilsCrossed size={32} /></div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-ink-900">{restaurant.name}</h3>
        {restaurant.cuisine_type && <p className="text-sm text-gold-600">{restaurant.cuisine_type}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
          <MapPin size={14} className="shrink-0" /><span className="truncate">{restaurant.city}</span>
        </p>
      </div>
    </Link>
  )
}
