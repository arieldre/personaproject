'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/personas', label: 'Personas' },
  { href: '/match', label: 'Match' },
  { href: '/training', label: 'Training' },
]

interface Props {
  isAdmin: boolean
}

export function NavLinks({ isAdmin }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  return (
    <div className="flex items-center gap-4">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={`text-sm transition-colors ${
            isActive(href)
              ? 'text-white font-medium'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin/personas"
          aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
          className={`text-sm transition-colors ${
            pathname.startsWith('/admin')
              ? 'text-white font-medium'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Admin
        </Link>
      )}
    </div>
  )
}
