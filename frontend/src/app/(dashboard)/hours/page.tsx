'use client'
import { useAuth } from '@/hooks/useAuth'
import { HourManager } from '@/components/dashboard/HourManager'
export default function Page() {
  const { user } = useAuth()
  if (!user?.restaurant_id) return null
  return <div><h1 className="mb-5 font-display text-2xl font-semibold text-ink-900">Horários</h1><HourManager restaurantId={user.restaurant_id} /></div>
}
