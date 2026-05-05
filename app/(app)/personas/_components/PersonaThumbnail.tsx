import { ARCHETYPE_MAP, type ArchetypeColor } from './archetypes'
import type { PersonaCard } from '../personas-list'

interface PersonaThumbnailProps {
  persona: PersonaCard
  archetypeColor: ArchetypeColor
  isSelected: boolean
  onSelect: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function getOverviewText(summary: unknown): string {
  if (!summary || typeof summary !== 'object') return ''
  const s = summary as Record<string, unknown>
  const overview = typeof s.overview === 'string' ? s.overview : ''
  return overview.slice(0, 80)
}

export default function PersonaThumbnail({
  persona,
  archetypeColor,
  isSelected,
  onSelect,
}: PersonaThumbnailProps) {
  const colors = ARCHETYPE_MAP[archetypeColor]
  const initials = getInitials(persona.name)
  const overview = getOverviewText(persona.summary)

  const containerClass = [
    'w-full cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-neutral-950',
    colors.ringColor,
    isSelected
      ? `border-l-[3px] ${colors.borderAccent} bg-neutral-800/80`
      : 'border border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-800/60',
  ].join(' ')

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`persona-thumb-${persona.id}`}
      className={containerClass}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="px-4 py-3 min-h-[72px] flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${colors.avatarBg} ${colors.avatarText}`}
        >
          {initials}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-semibold text-white leading-snug truncate">{persona.name}</p>
            {persona.clusterSize != null && (
              <span className="text-xs text-neutral-500 shrink-0 mt-0.5">{persona.clusterSize}</span>
            )}
          </div>
          {persona.tagline && (
            <p className="text-[12px] text-neutral-400 leading-snug truncate mt-0.5">{persona.tagline}</p>
          )}
          {overview && (
            <p className="text-[12px] text-neutral-500 leading-snug mt-0.5 line-clamp-2">{overview}</p>
          )}
        </div>
      </div>
    </div>
  )
}
