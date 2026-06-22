'use client'
import { useEffect, useState } from 'react'
import { Loader2, QrCode, Smartphone, Unplug } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { whatsappService } from '@/services/whatsapp'
import { WhatsappTemplates } from '@/components/dashboard/WhatsappTemplates'
import { WhatsappStatus } from '@/types'

export default function WhatsappPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id || ''
  const [status, setStatus] = useState<WhatsappStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  function loadStatus() { whatsappService.getStatus(restaurantId).then(setStatus).finally(() => setLoading(false)) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (restaurantId) loadStatus() }, [restaurantId])

  if (!restaurantId) return null
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-5 font-display text-2xl font-semibold text-ink-900">WhatsApp</h1>
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          {loading && <Loader2 className="animate-spin text-ink-400" />}
          {!loading && status?.status === 'connected' && (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-500/10 text-sage-600"><Smartphone size={24} /></span>
              <p className="status-pill status-pill--confirmed">Conectado · {status.phone_number}</p>
              <button onClick={async () => { await whatsappService.disconnect(restaurantId); loadStatus() }} className="btn-secondary text-xs text-rust-600"><Unplug size={13} /> Desconectar</button>
            </>
          )}
          {!loading && status?.status !== 'connected' && (
            <>
              {status?.qr_code
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={`data:image/png;base64,${status.qr_code}`} alt="QR Code" className="h-48 w-48 rounded border border-ink-900/8" />
                : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900/5 text-ink-600"><QrCode size={24} /></span>}
              <p className="status-pill status-pill--cancelled">Desconectado</p>
              <button onClick={async () => { setConnecting(true); try { const r = await whatsappService.connect(restaurantId); setStatus(r) } finally { setConnecting(false) } }} disabled={connecting} className="btn-primary">
                {connecting && <Loader2 size={15} className="animate-spin" />}Conectar WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
      <div><h2 className="mb-5 font-display text-xl font-semibold text-ink-900">Templates</h2><WhatsappTemplates restaurantId={restaurantId} /></div>
    </div>
  )
}
