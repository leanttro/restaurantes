'use client'
import { useCallback, useRef, useState } from 'react'
import { chatbotService } from '@/services/chatbot'
import { ApiError } from '@/types/api'
import { ChatMessage, CreateReservationPayload } from '@/types'

export function useChatbot(restaurantId: string, clientPhone: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservationDraft, setReservationDraft] = useState<Partial<CreateReservationPayload> | null>(null)
  const [isReadyToConfirm, setIsReadyToConfirm] = useState(false)
  const conversationIdRef = useRef<string | undefined>(undefined)

  const pushMessage = (role: ChatMessage['role'], content: string) => {
    setMessages((prev) => [...prev, { id: `${role}-${Date.now()}`, role, content, created_at: new Date().toISOString() }])
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    setError(null); pushMessage('user', text); setLoading(true)
    try {
      const response = await chatbotService.sendMessage({
        restaurant_id: restaurantId, client_phone: clientPhone,
        message: text, conversation_id: conversationIdRef.current,
      })
      conversationIdRef.current = response.conversation_id
      pushMessage('assistant', response.reply)
      if (response.reservation_draft) setReservationDraft(response.reservation_draft)
      setIsReadyToConfirm(response.is_ready_to_confirm)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Assistente indisponível. Tente o formulário.')
    } finally { setLoading(false) }
  }, [restaurantId, clientPhone])

  const reset = useCallback(() => {
    setMessages([]); setReservationDraft(null); setIsReadyToConfirm(false); setError(null)
    conversationIdRef.current = undefined
  }, [])

  return { messages, loading, error, reservationDraft, isReadyToConfirm, sendMessage, reset }
}
