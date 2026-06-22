'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { restaurantsService } from '@/services/restaurants'
import { Restaurant } from '@/types'
import { ApiError } from '@/types/api'

interface EditRestaurantModalProps {
  restaurant: Restaurant
  onClose: () => void
  onUpdated: (restaurant: Restaurant) => void
}

export function EditRestaurantModal({ restaurant, onClose, onUpdated }: EditRestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    slug: restaurant?.slug || '',
    city: restaurant?.city || '',
    address: restaurant?.address || '',
    phone: restaurant?.phone || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updated = await restaurantsService.updateRestaurant(restaurant.id, formData)
      onUpdated(updated)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao atualizar restaurante.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-400 hover:text-ink-600"
        >
          <X size={20} />
        </button>

        <h2 className="mb-4 text-lg font-semibold">Editar restaurante</h2>

        {error && <p className="error-text mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Nome *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="label-text">Slug *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Cidade *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">Telefone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-text">Endereço</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
