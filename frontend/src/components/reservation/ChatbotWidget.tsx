'use client'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, UtensilsCrossed } from 'lucide-react'
import { useChatbot } from '@/hooks/useChatbot'
import { reservationsService } from '@/services/reservations'
import { ApiError } from '@/types/api'
import { Reservation } from '@/types'

type Lang = 'pt' | 'en' | 'es'

const T: Record<Lang, Record<string, string>> = {
  pt: {
    title: 'Assistente de reservas',
    powered: 'Powered by IA · respostas em segundos',
    placeholder: 'Ex: quero reserva pra 4 pessoas hoje às 20h',
    checkReservation: 'Confira sua reserva',
    labelName: 'Nome', labelPeople: 'Pessoas', labelWhen: 'Quando', labelPhone: 'WhatsApp',
    confirm: 'Confirmar reserva', restart: 'Recomeçar',
    missingData: 'Ainda faltam dados — continue a conversa.',
    confirmError: 'Não foi possível confirmar.',
    useForm: 'Prefiro preencher um formulário',
  },
  en: {
    title: 'Reservation assistant',
    powered: 'Powered by AI · replies in seconds',
    placeholder: 'E.g.: table for 4 people tonight at 8pm',
    checkReservation: 'Review your reservation',
    labelName: 'Name', labelPeople: 'People', labelWhen: 'When', labelPhone: 'WhatsApp',
    confirm: 'Confirm reservation', restart: 'Start over',
    missingData: 'Still missing details — keep chatting.',
    confirmError: 'Could not confirm the reservation.',
    useForm: 'I prefer to fill a form',
  },
  es: {
    title: 'Asistente de reservas',
    powered: 'Impulsado por IA · respuestas en segundos',
    placeholder: 'Ej: mesa para 4 personas esta noche a las 20h',
    checkReservation: 'Revisa tu reserva',
    labelName: 'Nombre', labelPeople: 'Personas', labelWhen: 'Cuándo', labelPhone: 'WhatsApp',
    confirm: 'Confirmar reserva', restart: 'Empezar de nuevo',
    missingData: 'Faltan datos — sigue la conversación.',
    confirmError: 'No se pudo confirmar la reserva.',
    useForm: 'Prefiero rellenar un formulario',
  },
}

function formatDateTime(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time}`)
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return `${date} ${time}`
  }
}

function makeSessionId() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface Props {
  restaurantId: string
  restaurantName?: string
  greeting?: string
  lang?: Lang
  onReservationComplete: (reservation: Reservation) => void
  onUseFormInstead?: () => void
}

export function ChatbotWidget({
  restaurantId,
  restaurantName,
  greeting,
  lang = 'pt',
  onReservationComplete,
  onUseFormInstead,
}: Props) {
  const [sessionId] = useState(makeSessionId)
  const { messages, loading, error, reservationDraft, isReadyToConfirm, sendMessage, reset } =
    useChatbot(restaurantId, sessionId)
  const [input, setInput] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = T[lang]

  const greetingText =
    greeting ||
    (lang === 'en'
      ? `Hi! I handle reservations ${restaurantName ? `at ${restaurantName}` : 'here'}. Tell me how many people and when you'd like to come 🍽️`
      : lang === 'es'
      ? `¡Hola! Me encargo de las reservas ${restaurantName ? `en ${restaurantName}` : 'aquí'}. Dime para cuántas personas y cuándo te gustaría venir 🍽️`
      : `Oi! Eu cuido das reservas ${restaurantName ? `do ${restaurantName}` : 'aqui'}. Me diga pra quantas pessoas e quando você gostaria de vir 🍽️`)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, isReadyToConfirm])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  async function handleConfirm() {
    if (!reservationDraft) return
    const { reservation_date, reservation_time, party_size, guest_name, guest_phone } = reservationDraft as any
    if (!reservation_date || !reservation_time || !party_size || !guest_name || !guest_phone) {
      setConfirmError(t.missingData)
      return
    }
    setConfirming(true)
    setConfirmError(null)
    try {
      const reservation = await reservationsService.createReservation({
        restaurant_id: restaurantId,
        guest_name,
        guest_phone,
        guest_email: (reservationDraft as any).guest_email,
        reservation_date,
        reservation_time,
        party_size,
        special_requests: (reservationDraft as any).special_requests,
        source: 'chatbot',
      })
      onReservationComplete(reservation)
    } catch (err) {
      setConfirmError(err instanceof ApiError ? err.message : t.confirmError)
    } finally {
      setConfirming(false)
    }
  }

  const draft = reservationDraft as any

  return (
    <div className="ticket flex h-[520px] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 bg-bordeaux-600 px-4 py-3 text-sand-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <MessageCircle size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold">{t.title}</p>
          <p className="text-xs text-sand-100/80">{t.powered}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sand-50 px-4 py-4">
        <ChatBubble role="assistant" content={greetingText} />
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 pl-1 text-ink-400">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.3s]" />
          </div>
        )}
        {error && (
          <p className="rounded bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{error}</p>
        )}

        {isReadyToConfirm && draft && (
          <div className="rounded-lg border border-dashed border-gold-500/50 bg-gold-500/5 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <UtensilsCrossed size={14} />
              {t.checkReservation}
            </p>
            <dl className="space-y-1 font-mono text-xs">
              {draft.guest_name && <Row label={t.labelName} value={draft.guest_name} />}
              {draft.party_size && <Row label={t.labelPeople} value={String(draft.party_size)} />}
              {draft.reservation_date && draft.reservation_time && (
                <Row label={t.labelWhen} value={formatDateTime(draft.reservation_date, draft.reservation_time)} />
              )}
              {draft.guest_phone && <Row label={t.labelPhone} value={draft.guest_phone} />}
            </dl>
            {confirmError && (
              <p className="mt-2 text-xs font-medium text-rust-600">{confirmError}</p>
            )}
            <div className="mt-3 flex gap-2 font-sans">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="btn-primary flex-1 !py-2 text-xs"
              >
                {confirming && <Loader2 size={13} className="animate-spin" />}
                {t.confirm}
              </button>
              <button onClick={reset} disabled={confirming} className="btn-secondary !py-2 text-xs">
                {t.restart}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-ink-900/8 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={t.placeholder}
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary !px-3"
          aria-label="Enviar"
        >
          <Send size={16} />
        </button>
      </form>

      {onUseFormInstead && (
        <button
          onClick={onUseFormInstead}
          className="border-t border-ink-900/8 bg-sand-100 py-2 text-center text-xs font-medium text-ink-600 hover:text-bordeaux-600"
        >
          {t.useForm}
        </button>
      )}
    </div>
  )
}

function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-bordeaux-600 text-sand-50'
            : 'border border-ink-900/8 bg-white text-ink-800'
        }`}
      >
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
