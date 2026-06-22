'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const dashboardHref = user?.role === 'super_admin' ? '/admin' : '/dashboard'

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/8 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold text-bordeaux-600">MesaReserva</Link>
        <nav className="hidden items-center gap-1 md:flex">
          {!isAuthenticated && <>
            <Link href="/" className="btn-ghost">Buscar restaurante</Link>
            <Link href="/login" className="btn-ghost">Sou restaurante</Link>
          </>}
          {isAuthenticated && <Link href={dashboardHref} className="btn-primary">Ir para o painel</Link>}
        </nav>
        <button className="rounded p-2 text-ink-800 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-ink-900/8 bg-sand-50 px-4 py-3 md:hidden">
          {!isAuthenticated && <>
            <Link href="/" className="rounded px-3 py-2 text-sm font-medium text-ink-800" onClick={() => setOpen(false)}>Buscar restaurante</Link>
            <Link href="/login" className="rounded px-3 py-2 text-sm font-medium text-ink-800" onClick={() => setOpen(false)}>Sou restaurante</Link>
          </>}
          {isAuthenticated && <Link href={dashboardHref} className="rounded px-3 py-2 text-sm font-semibold text-bordeaux-600" onClick={() => setOpen(false)}>Ir para o painel</Link>}
        </nav>
      )}
    </header>
  )
}
