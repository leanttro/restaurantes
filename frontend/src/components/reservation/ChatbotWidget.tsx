'use client'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, UtensilsCrossed } from 'lucide-react'
import { useChatbot } from '@/hooks/useChatbot'
import { reservationsService } from '@/services/reservations'
import { formatDateTime } from '@/utils/formatting'
import { ApiError } from '@/types/api'
import { Reservation } from '@/types'

interface ChatbotWidgetProps {
  restaurantId: string; restaurantName?: string; greeting?: string
  onReservationComplete: (reservation: Reservation) => void; onUseFormInstead?: () => void
}

function makeSessionId() { return `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

export function ChatbotWidget({ restaurantId, restaurantName, greeting, onReservationComplete, onUseFormInstead }: ChatbotWidgetProps) {
  const [sessionId] = useState(makeSessionId)
  const { messages, loading, error, reservationDraft, isReadyToConfirm, sendMessage, reset } = useChatbot(restaurantId, sessionId)
  const [input, setInput] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const greetingText = greeting || `Oi! Eu cuido das reservas ${restaurantName ? `do ${restaurantName}` : 'aqui'}. Me diga pra quantas pessoas e quando você gostaria de vir 🍽️`

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, isReadyToConfirm])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput(''); await sendMessage(text)
  }

  async function handleConfirm() {
    if (!reservationDraft) return
    const { date, time, party_size, client_name, client_phone } = reservationDraft
    if (!date || !time || !party_size || !client_name || !client_phone) {
      setConfirmError('Ainda faltam dados — continue a conversa.'); return
    }
    setConfirming(true); setConfirmError(null)
    try {
      const reservation = await reservationsService.createReservation({
        restaurant_id: restaurantId, client_name, client_phone,
        client_email: reservationDraft.client_email, date, time, party_size,
        notes: reservationDraft.notes, source: 'chatbot',
      })
      onReservationComplete(reservation)
    } catch (err) {
      setConfirmError(err instanceof ApiError ? err.message : 'Não foi possível confirmar.')
    } finally { setConfirming(false) }
  }

  return (
    <div className="ticket flex h-[520px] flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 bg-bordeaux-600 px-4 py-3 text-sand-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><MessageCircle size={16} /></span>
        <div>
          <p className="text-sm font-semibold">Assistente de reservas</p>
          <p className="text-xs text-sand-100/80">Powered by IA · respostas em segundos</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sand-50 px-4 py-4">
        <ChatBubble role="assistant" content={greetingText} />
        {messages.map((m) => <ChatBubble key={m.id} role={m.role} content={m.content} />)}
        {loading && (
          <div className="flex items-center gap-1.5 pl-1 text-ink-400">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.3s]" />
          </div>
        )}
        {error && <p className="rounded bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{error}</p>}

        {isReadyToConfirm && reservationDraft && (
          <div className="rounded-lg border border-dashed border-gold-500/50 bg-gold-500/5 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <UtensilsCrossed size={14} />Confira sua reserva
            </p>
            <dl className="space-y-1 font-mono text-xs">
              {reservationDraft.client_name && <Row label="Nome" value={reservationDraft.client_name} />}
              {reservationDraft.party_size && <Row label="Pessoas" value={String(reservationDraft.party_size)} />}
              {reservationDraft.date && reservationDraft.time && <Row label="Quando" value={formatDateTime(reservationDraft.date, reservationDraft.time)} />}
              {reservationDraft.client_phone && <Row label="WhatsApp" value={reservationDraft.client_phone} />}
            </dl>
            {confirmError && <p className="mt-2 text-xs font-medium text-rust-600">{confirmError}</p>}
            <div className="mt-3 flex gap-2 font-sans">
              <button onClick={handleConfirm} disabled={confirming} className="btn-primary flex-1 !py-2 text-xs">
                {confirming && <Loader2 size={13} className="animate-spin" />}Confirmar reserva
              </button>
              <button onClick={reset} disabled={confirming} className="btn-secondary !py-2 text-xs">Recomeçar</button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-900/8 bg-white p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={loading}
          placeholder="Ex: quero reserva pra 4 pessoas hoje às 20h" className="input-field flex-1" />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary !px-3" aria-label="Enviar">
          <Send size={16} />
        </button>
      </form>

      {onUseFormInstead && (
        <button onClick={onUseFormInstead} className="border-t border-ink-900/8 bg-sand-100 py-2 text-center text-xs font-medium text-ink-600 hover:text-bordeaux-600">
          Prefiro preencher um formulário
        </button>
      )}
    </div>
  )
}

function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm leading-relaxed ${isUser ? 'bg-bordeaux-600 text-sand-50' : 'border border-ink-900/8 bg-white text-ink-800'}`}>
        {content}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-600">{label}</dt>
      <dd className="text-right text-ink-900">{value}</dd>
    </div>
  )
}
