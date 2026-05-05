'use client'

import { getArchetypeColor } from './archetypes'
import PersonaThumbnail from './PersonaThumbnail'
import type { PersonaCard } from '../personas-list'

interface PersonaSidebarProps {
  personas: PersonaCard[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function PersonaSidebar({ personas, selectedId, onSelect }: PersonaSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        data-testid="persona-sidebar"
        className="hidden md:flex flex-col w-[280px] shrink-0 border-r border-neutral-800 bg-neutral-950 overflow-y-auto h-[calc(100vh-57px)]"
      >
        <div className="px-4 pt-6 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
            Personas
          </p>
        </div>
        <div className="flex flex-col gap-2 px-0">
          {personas.map((p, i) => (
            <PersonaThumbnail
              key={p.id}
              persona={p}
              archetypeColor={getArchetypeColor(i)}
              isSelected={selectedId === p.id}
              onSelect={() => onSelect(p.id)}
            />
          ))}
        </div>
      </aside>

      {/* Mobile horizontal scroll */}
      <div
        data-testid="persona-sidebar"
        className="flex md:hidden flex-row overflow-x-auto gap-2 pb-2 border-b border-neutral-800 px-4 py-3"
      >
        {personas.map((p) => {
          const isSelected = selectedId === p.id
          const initials = p.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0].toUpperCase())
            .join('')

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={[
                'whitespace-nowrap px-3 py-1.5 rounded-lg text-sm shrink-0 transition-colors duration-150',
                isSelected
                  ? 'bg-neutral-700 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white',
              ].join(' ')}
            >
              {initials} · {p.name.split(' ')[0]}
            </button>
          )
        })}
      </div>
    </>
  )
}
