'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, LayoutDashboard, Store, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar, SidebarItem } from '@/components/common/Sidebar'
import { FullPageSpinner } from '@/components/common/LoadingSpinner'

const NAV: SidebarItem[] = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/restaurants', label: 'Restaurantes', icon: Store },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) router.replace('/login')
    else if (user?.role !== 'super_admin') router.replace('/dashboard')
  }, [loading, isAuthenticated, user, router])

  if (loading || !isAuthenticated || user?.role !== 'super_admin') return <FullPageSpinner label="Carregando painel…" />

  return (
    <div className="flex min-h-screen bg-sand-50">
      <Sidebar items={NAV} title="Super admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1">
        <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-ink-900/8 bg-white px-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Menu"><Menu size={22} /></button>
          <span className="font-display font-semibold">MesaReserva</span>
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
