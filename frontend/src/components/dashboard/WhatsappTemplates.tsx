'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { whatsappService } from '@/services/whatsapp'
import { ApiError } from '@/types/api'
import { WhatsappTemplate, WhatsappTemplateType } from '@/types'

const TYPE_LABEL: Record<WhatsappTemplateType, string> = {
  confirmation: 'Confirmação de reserva', reminder: 'Lembrete', cancellation: 'Cancelamento',
}
const FAKE: Record<string, string> = { '{client_name}': 'Mariana Souza', '{date}': '21/06/2026', '{time}': '20:00', '{party_size}': '4' }

function renderPreview(content: string) {
  return Object.entries(FAKE).reduce((acc, [k, v]) => acc.split(k).join(v), content)
}

export function WhatsappTemplates({ restaurantId }: { restaurantId: string }) {
  const [templates, setTemplates] = useState<Record<WhatsappTemplateType, string>>({ confirmation: '', reminder: '', cancellation: '' })
  const [loading, setLoading] = useState(true)
  const [savingType, setSavingType] = useState<WhatsappTemplateType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    whatsappService.getTemplates(restaurantId).then((data: WhatsappTemplate[]) => {
      const map = { confirmation: '', reminder: '', cancellation: '' }
      data.forEach((t) => { map[t.type] = t.content })
      setTemplates(map)
    }).catch((e) => setError(e instanceof ApiError ? e.message : 'Erro.')).finally(() => setLoading(false))
  }, [restaurantId])

  async function handleSave(type: WhatsappTemplateType) {
    setSavingType(type); setError(null)
    try { await whatsappService.updateTemplate(restaurantId, type, templates[type]) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Erro.') }
    finally { setSavingType(null) }
  }

  if (loading) return <p className="text-sm text-ink-600">Carregando…</p>

  return (
    <div className="space-y-6">
      {error && <p className="error-text">{error}</p>}
      {(Object.keys(TYPE_LABEL) as WhatsappTemplateType[]).map((type) => (
        <div key={type} className="card grid gap-4 p-5 md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-display text-base font-semibold">{TYPE_LABEL[type]}</h3>
            <p className="mb-2 text-xs text-ink-600">Use: {['{client_name}','{date}','{time}','{party_size}'].map((p) => <code key={p} className="mr-1 rounded bg-sand-200 px-1 font-mono text-[11px]">{p}</code>)}</p>
            <textarea value={templates[type]} onChange={(e) => setTemplates({ ...templates, [type]: e.target.value })} className="input-field min-h-[110px] resize-y" />
            <button onClick={() => handleSave(type)} disabled={savingType === type} className="btn-secondary mt-2 text-xs">
              {savingType === type ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}Salvar
            </button>
          </div>
          <div>
            <p className="label-field">Preview</p>
            <div className="ticket whitespace-pre-wrap p-4 text-sm text-ink-800">
              {renderPreview(templates[type]) || <span className="text-ink-400">Escreva um template para ver o preview.</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
