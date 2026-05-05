'use client'

import { useState, useEffect, useCallback } from 'react'
import PersonaSidebar from './_components/PersonaSidebar'
import PersonaHero from './_components/PersonaHero'
import { getArchetypeColor } from './_components/archetypes'

export interface PersonaCard {
  id: string
  name: string
  tagline: string | null
  clusterSize: number | null
  domainContext: string | null
  summary: unknown
  personalityVector: number[] | null
}

export default function PersonasList({ personas }: { personas: PersonaCard[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const closeModal = useCallback(() => setSelectedId(null), [])

  // ESC to close
  useEffect(() => {
    if (!selectedId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [selectedId, closeModal])

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId])

  if (personas.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-neutral-950">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-16 text-center max-w-md">
          <p className="text-neutral-500 text-sm">
            No personas yet — your admin will generate them from survey responses.
          </p>
        </div>
      </div>
    )
  }

  const selectedIndex = personas.findIndex((p) => p.id === selectedId)
  const selectedPersona = selectedIndex >= 0 ? personas[selectedIndex] : null
  const selectedColor = selectedIndex >= 0 ? getArchetypeColor(selectedIndex) : null

  return (
    <>
      {/* ── Main layout (sidebar always visible) ── */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-57px)] overflow-hidden bg-neutral-950">
        <PersonaSidebar
          personas={personas}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Right pane: prompt when nothing selected */}
        <div className="flex-1 hidden md:flex items-center justify-center text-neutral-600 text-sm">
          {!selectedId && 'Click a persona to open their profile'}
        </div>
      </div>

      {/* ── Centered modal overlay ── */}
      {selectedPersona && selectedColor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedPersona.name} profile`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal card */}
          <div
            data-testid="persona-hero"
            className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-700/60 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PersonaHero
              persona={selectedPersona}
              archetypeColor={selectedColor}
              personaIndex={selectedIndex}
              onClose={closeModal}
            />
          </div>
        </div>
      )}
    </>
  )
}
