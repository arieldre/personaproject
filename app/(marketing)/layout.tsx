import Link from 'next/link'
import CookieBanner from './_components/CookieBanner'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <nav className="border-b border-neutral-800 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold text-white hover:text-neutral-300 transition-colors"
        >
          Persona
        </Link>
      </nav>
      {children}
      <CookieBanner />
    </div>
  )
}
