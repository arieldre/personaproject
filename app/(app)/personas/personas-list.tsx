'use client'

import { useState, useEffect } from 'react'
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

  // Auto-select first persona on mount
  useEffect(() => {
    if (personas.length > 0 && selectedId === null) {
      setSelectedId(personas[0].id)
    }
  }, [personas, selectedId])

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
    <div
      className="flex flex-col md:flex-row h-[calc(100vh-57px)] overflow-hidden bg-neutral-950"
    >
      <PersonaSidebar
        personas={personas}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div
        data-testid="persona-hero"
        className="flex-1 min-w-0"
      >
        <PersonaHero
          persona={selectedPersona}
          archetypeColor={selectedColor}
          personaIndex={selectedIndex}
        />
      </div>
    </div>
  )
}
