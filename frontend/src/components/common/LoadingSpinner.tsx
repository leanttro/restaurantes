interface LoadingSpinnerProps { size?: 'sm' | 'md' | 'lg'; label?: string; className?: string }
const SIZE_MAP = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' }

export function LoadingSpinner({ size = 'md', label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status">
      <span className={`inline-block animate-spin rounded-full border-bordeaux-200 border-t-bordeaux-600 ${SIZE_MAP[size]}`} />
      {label && <span className="text-xs text-ink-600">{label}</span>}
      <span className="sr-only">Carregando…</span>
    </div>
  )
}

export function FullPageSpinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}
