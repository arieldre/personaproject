'use client'

import Link from 'next/link'
import { ARCHETYPE_MAP, type ArchetypeColor } from './archetypes'
import DimensionBars from './DimensionBars'
import type { PersonaCard } from '../personas-list'

interface PersonaHeroProps {
  persona: PersonaCard | null
  archetypeColor: ArchetypeColor | null
  // personaIndex reserved for future use (archetype badge, etc.)
  personaIndex?: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

// Type-narrowed helpers for the jsonb summary field
interface PersonaSummary {
  overview?: string
  demographics?: {
    ageRange?: string
    yearsExperience?: string
    seniorityLevel?: string
    typicalRole?: string
    background?: string
  }
  personality?: {
    communicationStyle?: string
    workStyle?: string
    decisionMaking?: string
  }
  motivators?: string[]
  stressors?: string[]
  interactionTips?: string[]
}

function parseSummary(raw: unknown): PersonaSummary | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as PersonaSummary
}

function splitToChips(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/ \/ | , |, /)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Simple inline SVGs — avoids external icon library
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 shrink-0">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const LayersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 shrink-0">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 shrink-0">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)
const GradCapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 shrink-0">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const PeopleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const ConsultIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const CursorIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600">
    <path d="M5 3l14 9-7 1-4 7z"/>
  </svg>
)

const SECTION_LABEL = 'text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-4'
const CARD = 'rounded-xl bg-neutral-800/40 border border-neutral-700/50 p-5'
const CHIP = 'inline-flex px-3 py-1 rounded-full text-xs font-medium bg-neutral-700/60 text-neutral-200 border border-neutral-600/40'

export default function PersonaHero({ persona, archetypeColor }: PersonaHeroProps) {
  if (!persona || !archetypeColor) {
    return (
      <div
        data-testid="persona-empty-state"
        className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-57px)] text-center px-8"
      >
        <CursorIcon />
        <p className="mt-4 text-sm text-neutral-500">Select a persona to explore their profile</p>
      </div>
    )
  }

  const colors = ARCHETYPE_MAP[archetypeColor]
  const initials = getInitials(persona.name)
  const summary = parseSummary(persona.summary)
  const demographics = summary?.demographics
  const personality = summary?.personality
  const motivators = summary?.motivators
  const stressors = summary?.stressors
  const interactionTips = summary?.interactionTips
  const hasVector = Array.isArray(persona.personalityVector) && persona.personalityVector.length >= 14

  return (
    <div
      className="flex-1 overflow-y-auto h-[calc(100vh-57px)] px-8 py-8 space-y-8"
      aria-live="polite"
    >
      {/* ── Section 1: Header ── */}
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div
          className={`w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-xl font-semibold ${colors.avatarBg} ${colors.avatarText}`}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-semibold text-white leading-tight">{persona.name}</h1>
          {persona.tagline && (
            <p className="text-sm text-neutral-400 italic mt-1">{persona.tagline}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {persona.clusterSize != null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
                <PeopleIcon />
                {persona.clusterSize} employees
              </span>
            )}
            {persona.domainContext && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400">
                {persona.domainContext}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Demographics ── */}
      {demographics && (
        <div className={CARD}>
          <p className={SECTION_LABEL}>Background</p>
          <div className="grid grid-cols-2 gap-4">
            {demographics.ageRange && (
              <div className="flex items-start gap-2">
                <CalendarIcon />
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Age Range</p>
                  <p className="text-[14px] text-white mt-0.5">{demographics.ageRange}</p>
                </div>
              </div>
            )}
            {demographics.yearsExperience && (
              <div className="flex items-start gap-2">
                <ClockIcon />
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Experience</p>
                  <p className="text-[14px] text-white mt-0.5">{demographics.yearsExperience}</p>
                </div>
              </div>
            )}
            {demographics.seniorityLevel && (
              <div className="flex items-start gap-2">
                <LayersIcon />
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Seniority</p>
                  <p className="text-[14px] text-white mt-0.5">{demographics.seniorityLevel}</p>
                </div>
              </div>
            )}
            {demographics.typicalRole && (
              <div className="flex items-start gap-2">
                <BriefcaseIcon />
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Typical Role</p>
                  <p className="text-[14px] text-white mt-0.5">{demographics.typicalRole}</p>
                </div>
              </div>
            )}
            {demographics.background && (
              <div className="col-span-2 flex items-start gap-2">
                <GradCapIcon />
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Background</p>
                  <p className="text-[14px] text-white mt-0.5">{demographics.background}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 3: Personality ── */}
      {personality && (
        <div className={CARD}>
          <p className={SECTION_LABEL}>Personality</p>
          <div className="space-y-4">
            {personality.communicationStyle && (
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Communication Style</p>
                <div className="flex flex-wrap gap-2">
                  {splitToChips(personality.communicationStyle).map((chip) => (
                    <span key={chip} className={CHIP}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
            {personality.workStyle && (
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Work Style</p>
                <div className="flex flex-wrap gap-2">
                  {splitToChips(personality.workStyle).map((chip) => (
                    <span key={chip} className={CHIP}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
            {personality.decisionMaking && (
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Decision Making</p>
                <div className="flex flex-wrap gap-2">
                  {splitToChips(personality.decisionMaking).map((chip) => (
                    <span key={chip} className={CHIP}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 4: Motivators + Stressors ── */}
      {((motivators && motivators.length > 0) || (stressors && stressors.length > 0)) && (
        <div className="grid grid-cols-2 gap-4">
          {motivators && motivators.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400/70 mb-2">Motivators</p>
              <div className="flex flex-wrap gap-2">
                {motivators.map((m) => (
                  <span key={m} className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {stressors && stressors.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/70 mb-2">Stressors</p>
              <div className="flex flex-wrap gap-2">
                {stressors.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 5: Dimension bars ── */}
      {hasVector && (
        <div>
          <p className={`${SECTION_LABEL} mb-6`}>Personality Dimensions</p>
          <DimensionBars
            key={persona.id}
            vector={persona.personalityVector as number[]}
            archetypeColor={archetypeColor}
          />
        </div>
      )}

      {/* ── Section 6: Interaction tips ── */}
      {interactionTips && interactionTips.length > 0 && (
        <div>
          <p className={SECTION_LABEL}>Working with {persona.name}</p>
          <div className="space-y-3">
            {interactionTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 7: CTA buttons ── */}
      <div className="flex gap-3 pt-2">
        <Link
          href={'/chat/' + encodeURIComponent(persona.id)}
          data-testid="persona-chat-link"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          <ChatIcon />
          Chat with {persona.name}
        </Link>
        <Link
          href={'/consult/' + encodeURIComponent(persona.id)}
          data-testid="persona-consult-link"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          <ConsultIcon />
          Consult {persona.name}
        </Link>
      </div>
    </div>
  )
}
