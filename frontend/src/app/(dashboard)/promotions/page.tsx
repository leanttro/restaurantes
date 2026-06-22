'use client'
import { useAuth } from '@/hooks/useAuth'
import { PromotionManager } from '@/components/dashboard/PromotionManager'
export default function Page() {
  const { user } = useAuth()
  if (!user?.restaurant_id) return null
  return <div><h1 className="mb-5 font-display text-2xl font-semibold text-ink-900">Promoções</h1><PromotionManager restaurantId={user.restaurant_id} /></div>
}
