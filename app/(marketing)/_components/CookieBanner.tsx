'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'cookie_consent'

export default function CookieBanner() {
  // Start hidden — set to true only after mount confirms no stored consent
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) !== 'accepted') {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-neutral-900 border-t border-neutral-700 px-6 py-4 text-sm text-neutral-300"
      role="dialog"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
    >
      <p>
        We use cookies for analytics and authentication. By continuing you accept our{' '}
        <Link href="/privacy" className="underline hover:text-white transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        onClick={accept}
        className="shrink-0 rounded-md bg-white px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200 transition-colors"
        data-testid="cookie-banner-accept"
      >
        Accept
      </button>
    </div>
  )
}
