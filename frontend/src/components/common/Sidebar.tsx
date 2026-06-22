'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, LucideIcon, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/utils/formatting'

export interface SidebarItem { href: string; label: string; icon: LucideIcon }

interface SidebarProps { items: SidebarItem[]; title: string; open: boolean; onClose: () => void }

export function Sidebar({ items, title, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-900/40 md:hidden" onClick={onClose} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 text-sand-100 transition-transform md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[var(--header-height)] items-center justify-between px-5">
          <Link href="/" className="font-display text-lg font-bold text-sand-50">MesaReserva</Link>
          <button className="text-sand-200 md:hidden" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-sand-300/60">{title}</p>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={onClose}
                className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-sand-50 text-ink-900' : 'text-sand-200 hover:bg-white/10 hover:text-sand-50'}`}>
                <Icon size={18} />{label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-ink-900">
              {user ? initials(user.name) : '–'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sand-50">{user?.name}</p>
              <p className="truncate text-xs text-sand-300/70">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => logout()} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-sand-200 hover:bg-white/10 hover:text-sand-50">
            <LogOut size={16} />Sair
          </button>
        </div>
      </aside>
    </>
  )
}
