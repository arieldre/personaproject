'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    // Sync state with whatever the inline script already applied
    setIsLight(document.documentElement.classList.contains('light'))
  }, [])

  const toggle = () => {
    const next = !isLight
    if (next) {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    try { localStorage.setItem('theme', next ? 'light' : 'dark') } catch {}
    setIsLight(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      className="text-neutral-400 hover:text-white transition-colors text-base leading-none"
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  )
}
