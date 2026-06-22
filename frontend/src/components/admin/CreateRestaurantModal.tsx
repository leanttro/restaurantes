'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/services/api'
import { Restaurant } from '@/types'

interface Props {
  onClose: () => void
  onCreated: (r: Restaurant) => void
}

const FIELDS = [
  { key: 'name',        label: 'Nome do restaurante', required: true,  type: 'text' },
  { key: 'slug',        label: 'Slug (URL)',           required: true,  type: 'text',  hint: 'Ex: meu-restaurante (sem espaços)' },
  { key: 'owner_email', label: 'E-mail do dono',       required: true,  type: 'email', hint: 'Usuário já deve estar cadastrado' },
  { key: 'phone',       label: 'Telefone',             required: false, type: 'text' },
  { key: 'address',     label: 'Endereço',             required: false, type: 'text' },
  { key: 'city',        label: 'Cidade',               required: false, type: 'text' },
  { key: 'description', label: 'Descrição',            required: false, type: 'textarea' },
] as const

type FieldKey = typeof FIELDS[number]['key']

export function CreateRestaurantModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<Record<FieldKey, string>>({
    name: '', slug: '', owner_email: '', phone: '', address: '', city: '', description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setForm((f) => ({ ...f, name: value, slug }))
  }

  async function handleSubmit() {
    setError(null)
    if (!form.name || !form.slug || !form.owner_email) {
      setError('Preencha os campos obrigatórios.')
      return
    }
    setLoading(true)
    try {
      const { owner_email, ...body } = form
      const { data } = await api.post<Restaurant>(
        `/admin/restaurants?owner_email=${encodeURIComponent(owner_email)}`,
        body,
      )
      onCreated(data)
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar restaurante.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-ink-900/8 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">Novo restaurante</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X size={16} /></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {FIELDS.map(({ key, label, required, type, hint }) => (
            <div key={key}>
              <label className="label-field">
                {label} {required && <span className="text-rust-600">*</span>}
              </label>
              {type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="input-field resize-none"
                  placeholder={label}
                />
              ) : (
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    key === 'name'
                      ? handleNameChange(e.target.value)
                      : setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="input-field"
                  placeholder={hint ?? label}
                />
              )}
              {hint && key !== 'name' && (
                <p className="mt-1 text-xs text-ink-400">{hint}</p>
              )}
            </div>
          ))}

          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-900/8 px-6 py-4">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Criando…' : 'Criar restaurante'}
          </button>
        </div>
      </div>
    </div>
  )
}
