'use client'
import { useState } from 'react'
import { X, Image, Link } from 'lucide-react'
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
    description: restaurant?.description || '',
    cuisine_type: restaurant?.cuisine_type || '',
    max_party_size: restaurant?.max_party_size ?? '',
    whatsapp_number: restaurant?.whatsapp_number || '',
    logo_url: restaurant?.logo_url || '',
    cover_image_url: restaurant?.cover_image_url || '',
    banner1_image_url: restaurant?.banner1_image_url || '',
    banner1_link_url: restaurant?.banner1_link_url || '',
    banner2_image_url: restaurant?.banner2_image_url || '',
    banner2_link_url: restaurant?.banner2_link_url || '',
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
      const payload = {
        ...formData,
        max_party_size: formData.max_party_size ? Number(formData.max_party_size) : undefined,
      }
      const updated = await restaurantsService.updateRestaurant(restaurant.id, payload)
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar restaurante.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-ticket">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-900/8 bg-white px-6 py-4">
          <h2 className="font-display text-lg font-semibold">Editar restaurante</h2>
          <button onClick={onClose} className="rounded p-1 text-ink-400 hover:text-ink-600">
            <X size={20} />
          </button>
        </div>

        {error && <p className="mx-6 mt-4 error-text">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          {/* Dados básicos */}
          <Section title="Dados básicos">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *">
                <input name="name" value={formData.name} onChange={handleChange} required className="input-field" />
              </Field>
              <Field label="Slug *">
                <input name="slug" value={formData.slug} onChange={handleChange} required className="input-field" />
              </Field>
            </div>
            <Field label="Descrição">
              <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="input-field resize-none" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de cozinha">
                <input name="cuisine_type" value={formData.cuisine_type} onChange={handleChange} className="input-field" placeholder="Italiana, Japonesa…" />
              </Field>
              <Field label="Máx. pessoas/mesa">
                <input type="number" name="max_party_size" value={formData.max_party_size} onChange={handleChange} min={1} className="input-field" />
              </Field>
            </div>
          </Section>

          {/* Contato & Localização */}
          <Section title="Contato & localização">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade *">
                <input name="city" value={formData.city} onChange={handleChange} required className="input-field" />
              </Field>
              <Field label="Telefone">
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" />
              </Field>
            </div>
            <Field label="Endereço">
              <input name="address" value={formData.address} onChange={handleChange} className="input-field" />
            </Field>
            <Field label="WhatsApp">
              <input name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="input-field" placeholder="5511900000000" />
            </Field>
          </Section>

          {/* Imagens */}
          <Section title="Imagens">
            <Field label="Logo (URL Cloudinary)" icon={<Image size={13} />}>
              <input name="logo_url" value={formData.logo_url} onChange={handleChange} className="input-field" placeholder="https://res.cloudinary.com/…" />
              {formData.logo_url && (
                <img src={formData.logo_url} alt="logo preview" className="mt-1.5 h-12 w-12 rounded-lg object-cover border border-ink-900/10" />
              )}
            </Field>
            <Field label="Foto de capa (URL Cloudinary)" icon={<Image size={13} />}>
              <input name="cover_image_url" value={formData.cover_image_url} onChange={handleChange} className="input-field" placeholder="https://res.cloudinary.com/…" />
              {formData.cover_image_url && (
                <img src={formData.cover_image_url} alt="capa preview" className="mt-1.5 h-20 w-full rounded-lg object-cover border border-ink-900/10" />
              )}
            </Field>
          </Section>

          {/* Banners */}
          <Section title="Banners clicáveis">
            <p className="text-xs text-ink-400 -mt-2">Aparecem no painel lateral da página pública. Cole a URL da imagem e o link de destino ao clicar.</p>
            <Field label="Banner 1 — foto (URL Cloudinary)" icon={<Image size={13} />}>
              <input name="banner1_image_url" value={formData.banner1_image_url} onChange={handleChange} className="input-field" placeholder="https://res.cloudinary.com/…" />
              {formData.banner1_image_url && (
                <img src={formData.banner1_image_url} alt="banner1 preview" className="mt-1.5 h-16 w-full rounded-lg object-cover border border-ink-900/10" />
              )}
            </Field>
            <Field label="Banner 1 — link de destino" icon={<Link size={13} />}>
              <input name="banner1_link_url" value={formData.banner1_link_url} onChange={handleChange} className="input-field" placeholder="https://…" />
            </Field>
            <Field label="Banner 2 — foto (URL Cloudinary)" icon={<Image size={13} />}>
              <input name="banner2_image_url" value={formData.banner2_image_url} onChange={handleChange} className="input-field" placeholder="https://res.cloudinary.com/…" />
              {formData.banner2_image_url && (
                <img src={formData.banner2_image_url} alt="banner2 preview" className="mt-1.5 h-16 w-full rounded-lg object-cover border border-ink-900/10" />
              )}
            </Field>
            <Field label="Banner 2 — link de destino" icon={<Link size={13} />}>
              <input name="banner2_link_url" value={formData.banner2_link_url} onChange={handleChange} className="input-field" placeholder="https://…" />
            </Field>
          </Section>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-600">
        {icon}{label}
      </label>
      {children}
    </div>
  )
}
