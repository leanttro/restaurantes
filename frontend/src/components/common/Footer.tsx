export function Footer() {
  return (
    <footer className="border-t border-ink-900/8 bg-sand-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink-600 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} MesaReserva. Todos os direitos reservados.</p>
        <div className="flex gap-5">
          <a href="#" className="hover:text-ink-900">Termos</a>
          <a href="#" className="hover:text-ink-900">Privacidade</a>
          <a href="#" className="hover:text-ink-900">Suporte</a>
        </div>
      </div>
    </footer>
  )
}
