import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main className="min-h-screen">{children}</main><Footer /></>
}
