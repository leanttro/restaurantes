export function validateRequired(value: string, label = 'Este campo'): string | undefined {
  return value.trim() ? undefined : `${label} é obrigatório.`
}

export function validateEmail(email: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : 'E-mail inválido.'
}

export function validatePhone(phone: string): string | undefined {
  return phone.replace(/\D/g, '').length >= 10 ? undefined : 'WhatsApp inválido (mínimo 10 dígitos).'
}

export function validateFutureDate(date: string): string | undefined {
  if (!date) return 'A data é obrigatória.'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(date + 'T00:00:00') >= today ? undefined : 'A data deve ser hoje ou no futuro.'
}

export function validatePartySize(size: number, max: number): string | undefined {
  if (size < 1) return 'Mínimo 1 pessoa.'
  if (size > max) return `Máximo ${max} pessoas.`
  return undefined
}

export function validateDiscountPercent(value: number): string | undefined {
  if (value < 1 || value > 100) return 'Desconto deve ser entre 1% e 100%.'
  return undefined
}
