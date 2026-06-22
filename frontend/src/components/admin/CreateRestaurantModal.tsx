'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { ApiError } from '@/types/api'
import { Restaurant } from '@/types'

interface Props {
  onClose: () => void
  onCreated: (r: Restaurant) => void
}

// hint?: string on every member so destructuring `hint` is always valid
const FIELDS: readonly {
  key: string
  label: string
  required: boolean
  type: string
  hint?: string
}[] = [
  { key: 'name',        label: 'Nome do restaurante', required: true,  type: 'text' },
  { key: 'slug',        label: 'Slug (URL)',           required: true,  type: 'text', hint: 'Ex: meu-restaurante (sem espaços)' },
  { key: 'city',        label: 'Cidade',               required: true,  type: 'text' },
  { key: 'address',     label: 'Endereço',             required: false, type: 'text' },
  { key: 'phone',       label: 'Telefone',             required: false, type: 'text' },
  { key: 'email',       label: 'E-mail',               required: false, type: 'email' },
  { key: 'description', label: 'Descrição',            required: false, type: 'textarea' },
]

type FormData = Record<string, string>

export function CreateRestaurantModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const restaurant = await restaurantsService.createRestaurant(form)
      onCreated(restaurant)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao criar restaurante.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-ink-900">Novo restaurante</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 px-6 py-5">
          {FIELDS.map(({ key, label, required, type, hint }) => (
            <div key={key}>
              <label className="label-field">
                {label} {required && <span className="text-rust-600">*</span>}
              </label>
              {type === 'textarea' ? (
                <textarea
                  value={form[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="input-field min-h-[80px]"
                  rows={3}
                />
              ) : (
                <input
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="input-field"
                />
              )}
              {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
            </div>
          ))}
        </div>

        {error && <p className="px-6 pb-2 text-sm text-rust-600">{error}</p>}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="btn-ghost" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Criando…' : 'Criar restaurante'}
          </button>
        </div>
      </div>
    </div>
  )
}
