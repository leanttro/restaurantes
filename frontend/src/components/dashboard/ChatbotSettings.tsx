'use client'
import { FormEvent, useEffect, useState } from 'react'
import { Loader2, Save, Send } from 'lucide-react'
import { chatbotService } from '@/services/chatbot'
import { ApiError } from '@/types/api'
import { ChatbotSettings as T } from '@/types'

export function ChatbotSettings({ restaurantId }: { restaurantId: string }) {
  const [settings, setSettings] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [testReply, setTestReply] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    chatbotService.getSettings(restaurantId).then(setSettings)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Erro.'))
      .finally(() => setLoading(false))
  }, [restaurantId])

  async function handleSave(e: FormEvent) {
    e.preventDefault(); if (!settings) return
    setSaving(true); setError(null); setSaved(false)
    try { const u = await chatbotService.updateSettings(restaurantId, settings); setSettings(u); setSaved(true) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Erro.') }
    finally { setSaving(false) }
  }

  async function handleTest() {
    if (!testMsg.trim()) return
    setTesting(true); setTestReply(null)
    try { const { reply } = await chatbotService.testMessage(restaurantId, testMsg); setTestReply(reply) }
    catch (e) { setTestReply(e instanceof ApiError ? `Erro: ${e.message}` : 'Indisponível.') }
    finally { setTesting(false) }
  }

  if (loading) return <p className="text-sm text-ink-600">Carregando…</p>
  if (!settings) return <p className="error-text">{error}</p>

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSave} className="card space-y-5 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Comportamento do bot</h3>
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input type="checkbox" checked={settings.is_enabled} onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })} className="h-4 w-4 accent-bordeaux-600" />Ativo
          </label>
        </div>
        <div>
          <label className="label-field">Temperatura ({settings.temperature.toFixed(1)})</label>
          <input type="range" min={0.1} max={1} step={0.1} value={settings.temperature} onChange={(e) => setSettings({ ...settings, temperature: Number(e.target.value) })} className="w-full accent-bordeaux-600" />
          <div className="flex justify-between text-xs text-ink-400"><span>Mais previsível</span><span>Mais criativo</span></div>
        </div>
        <div><label className="label-field">Saudação</label><textarea value={settings.greeting_message} onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })} className="input-field min-h-[60px] resize-none" /></div>
        <div><label className="label-field">Prompt de sistema</label><textarea value={settings.system_prompt} onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })} className="input-field min-h-[140px] resize-y font-mono text-xs" /></div>
        {error && <p className="error-text">{error}</p>}
        {saved && <p className="text-sm font-medium text-sage-600">Salvo!</p>}
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Salvar</button>
      </form>
      <div className="card space-y-3 p-5">
        <h3 className="font-display text-lg font-semibold">Testar o bot</h3>
        <div className="flex gap-2">
          <input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} placeholder="Quero reserva pra 2 pessoas sábado à noite" className="input-field flex-1" />
          <button onClick={handleTest} disabled={testing} className="btn-secondary !px-3">{testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}</button>
        </div>
        {testReply && <div className="rounded border border-ink-900/8 bg-sand-100 p-3 text-sm text-ink-800">{testReply}</div>}
      </div>
    </div>
  )
}
