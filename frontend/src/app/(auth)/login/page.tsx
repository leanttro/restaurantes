'use client'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false)
  const { login, error } = useAuth(); const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true)
    try { const user = await login({ email, password }); router.push(user.role === 'super_admin' ? '/admin' : '/dashboard') }
    catch { /* erro já no context */ } finally { setLoading(false) }
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Entrar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="label-field">E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required /></div>
        <div><label className="label-field">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required /></div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading && <Loader2 size={16} className="animate-spin" />}Entrar</button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-600">Não tem conta? <Link href="/register" className="text-bordeaux-600 hover:underline">Cadastrar</Link></p>
    </div>
  )
}
