'use client'
import { FormEvent, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { formatDate, formatPercent } from '@/utils/formatting'
import { validateDiscountPercent, validateRequired } from '@/utils/validators'
import { ApiError } from '@/types/api'
import { CreatePromotionPayload, Promotion } from '@/types'

const EMPTY: CreatePromotionPayload = { title: '', description: '', discount_percent: 10, valid_from: '', valid_until: '', conditions: '' }

export function PromotionManager({ restaurantId }: { restaurantId: string }) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreatePromotionPayload>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    restaurantsService.getPromotions(restaurantId).then(setPromotions)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [restaurantId]) // eslint-disable-line

  function validate() {
    const next = {
      title: validateRequired(form.title, 'O título'), discount_percent: validateDiscountPercent(form.discount_percent),
      valid_from: validateRequired(form.valid_from, 'A data de início'), valid_until: validateRequired(form.valid_until, 'A data de término'),
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); if (!validate()) return
    setSaving(true); setError(null)
    try {
      if (editingId) {
        const u = await restaurantsService.updatePromotion(restaurantId, editingId, form)
        setPromotions((p) => p.map((x) => (x.id === editingId ? u : x)))
      } else {
        const c = await restaurantsService.createPromotion(restaurantId, form)
        setPromotions((p) => [c, ...p])
      }
      setFormOpen(false)
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-600">{promotions.length} promoção(ões)</p>
        <button onClick={() => { setEditingId(null); setForm(EMPTY); setFormOpen(true) }} className="btn-primary text-xs"><Plus size={14} /> Nova promoção</button>
      </div>
      {error && <p className="error-text mb-3">{error}</p>}
      {loading && <p className="text-sm text-ink-600">Carregando…</p>}
      <div className="space-y-2.5">
        {promotions.map((p) => (
          <div key={p.id} className="card flex items-start justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-ink-900">{p.title} <span className="text-gold-600">· {formatPercent(p.discount_percent)} off</span></p>
              {p.description && <p className="text-sm text-ink-600">{p.description}</p>}
              <p className="mt-1 text-xs text-ink-400">Válida de {formatDate(p.valid_from)} até {formatDate(p.valid_until)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => { setEditingId(p.id); setForm({ title: p.title, description: p.description||'', discount_percent: p.discount_percent, valid_from: p.valid_from, valid_until: p.valid_until, conditions: p.conditions||'' }); setFormOpen(true) }} className="btn-ghost !p-1.5"><Pencil size={14} /></button>
              <button onClick={async () => { await restaurantsService.deletePromotion(restaurantId, p.id); setPromotions((x) => x.filter((i) => i.id !== p.id)) }} className="btn-ghost !p-1.5 text-rust-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4 p-5">
            <h3 className="font-display text-lg font-semibold">{editingId ? 'Editar' : 'Nova'} promoção</h3>
            <div><label className="label-field">Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />{errors.title && <p className="error-text">{errors.title}</p>}</div>
            <div><label className="label-field">Descrição</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label-field">Desconto %</label><input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} className="input-field" />{errors.discount_percent && <p className="error-text">{errors.discount_percent}</p>}</div>
              <div><label className="label-field">De</label><input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="input-field" /></div>
              <div><label className="label-field">Até</label><input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="label-field">Condições</label><input value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} className="input-field" /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving && <Loader2 size={14} className="animate-spin" />}Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
