'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ARCHETYPE_MAP, type ArchetypeColor } from './archetypes'
import { getAvatarDataUri } from './avatar'
import DimensionBars from './DimensionBars'
import type { PersonaCard } from '../personas-list'

interface PersonaHeroProps {
  persona: PersonaCard | null
  archetypeColor: ArchetypeColor | null
  personaIndex?: number
  onClose?: () => void
}

interface PersonaSummary {
  overview?: string
  strengths?: string[]
  growthAreas?: string[]
  demographics?: {
    gender?: string
    ageRange?: string
    familySituation?: string
    location?: string
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

// Handles common LLM separator formats: / , ; | • · "and"
function splitToChips(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/\s*[\/,;|•·]\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 60)
}

// SVG icons — aria-hidden on all (decorative)
const XIcon = () => (
  <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const PeopleIcon = () => (
  <svg aria-hidden="true" focusable="false" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ChatIcon = () => (
  <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const ConsultIcon = () => (
  <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const StarIcon = () => (
  <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const CursorIcon = () => (
  <svg aria-hidden="true" focusable="false" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600">
    <path d="M5 3l14 9-7 1-4 7z"/>
  </svg>
)

// Stat cell for the demographics grid
function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="text-[13px] text-white leading-snug">{value}</p>
    </div>
  )
}

const CHIP = 'inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-700/60 text-neutral-200 border border-neutral-600/40'

export default function PersonaHero({ persona, archetypeColor, onClose }: PersonaHeroProps) {
  if (!persona || !archetypeColor) {
    return (
      <div data-testid="persona-empty-state" className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
        <CursorIcon />
        <p className="mt-4 text-sm text-neutral-500">Select a persona to explore their profile</p>
      </div>
    )
  }

  const colors = ARCHETYPE_MAP[archetypeColor]
  const avatarSrc = getAvatarDataUri(persona.name, persona.summary, archetypeColor)
  const summary = parseSummary(persona.summary)
  const d = summary?.demographics
  const p = summary?.personality
  const motivators = summary?.motivators ?? []
  const stressors = summary?.stressors ?? []
  const tips = summary?.interactionTips ?? []
  const strengths = summary?.strengths ?? []
  const hasVector = Array.isArray(persona.personalityVector) &&
    persona.personalityVector.length >= 14 &&
    persona.personalityVector.every((v) => typeof v === 'number' && Number.isFinite(v))

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className={`relative flex items-start gap-5 px-8 pt-8 pb-6 border-b border-neutral-800/60 bg-gradient-to-b from-neutral-900 to-transparent`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close persona profile"
            className="absolute top-5 right-5 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-600"
          >
            <XIcon />
          </button>
        )}

        {/* Avatar */}
        <div className={`w-20 h-20 rounded-2xl shrink-0 overflow-hidden ring-2 ring-offset-2 ring-offset-neutral-950 ${colors.ringColor}`}>
          <Image src={avatarSrc} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized />
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <h2 className="text-[26px] font-bold text-white leading-tight">{persona.name}</h2>
          {persona.tagline && (
            <p className="text-sm text-neutral-400 italic mt-1 leading-relaxed">{persona.tagline}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {persona.clusterSize != null && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.badgeBg ?? 'bg-neutral-800'} ${colors.badgeText ?? 'text-neutral-300'}`}>
                <PeopleIcon />
                {persona.clusterSize} employees
              </span>
            )}
            {d?.typicalRole && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400">
                {d.typicalRole}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* Overview */}
        {summary?.overview && (
          <p className="text-sm text-neutral-300 leading-relaxed">{summary.overview}</p>
        )}

        {/* ── Character snapshot (demographics) ── */}
        {d && (
          <div className="rounded-xl bg-neutral-800/40 border border-neutral-700/40 overflow-hidden">
            <div className="px-5 pt-4 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Character Snapshot</p>
            </div>

            {/* Primary row: gender · age · location */}
            {(d.gender || d.ageRange || d.location) && (
              <div className="grid grid-cols-3 gap-px bg-neutral-700/30 mt-3">
                {d.gender && (
                  <div className="bg-neutral-900/60 px-4 py-3">
                    <StatCell label="Gender" value={d.gender.charAt(0).toUpperCase() + d.gender.slice(1)} />
                  </div>
                )}
                {d.ageRange && (
                  <div className="bg-neutral-900/60 px-4 py-3">
                    <StatCell label="Age" value={d.ageRange} />
                  </div>
                )}
                {d.location && (
                  <div className="bg-neutral-900/60 px-4 py-3">
                    <StatCell label="Location" value={d.location} />
                  </div>
                )}
              </div>
            )}

            {/* Family + seniority row */}
            <div className="px-5 pt-3 pb-4 space-y-2.5">
              {d.familySituation && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-xs">👨‍👩‍👧</span>
                  <span className="text-[13px] text-neutral-300">{d.familySituation}</span>
                </div>
              )}
              {(d.seniorityLevel || d.yearsExperience) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {d.seniorityLevel && (
                    <span className="text-[12px] text-neutral-400 bg-neutral-800 px-2.5 py-0.5 rounded-full">{d.seniorityLevel}</span>
                  )}
                  {d.yearsExperience && (
                    <span className="text-[12px] text-neutral-500">{d.yearsExperience} experience</span>
                  )}
                </div>
              )}
              {d.background && (
                <p className="text-[12px] text-neutral-500 leading-relaxed">{d.background}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Top Qualities ── */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={colors.textAccent ?? 'text-amber-400'}>
                <StarIcon />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Top Qualities</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.slice(0, 5).map((s, i) => (
                <span
                  key={`strength-${i}-${s.slice(0, 12)}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${colors.chipBg ?? 'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Personality ── */}
        {p && (p.communicationStyle || p.workStyle || p.decisionMaking) && (
          <div className="rounded-xl bg-neutral-800/40 border border-neutral-700/40 p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Personality</p>
            {p.communicationStyle && (
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Communication</p>
                <div className="flex flex-wrap gap-2">
                  {splitToChips(p.communicationStyle).map((chip, i) => (
                    <span key={`comm-${i}-${chip.slice(0, 8)}`} className={CHIP}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
            {p.workStyle && (
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Work Style</p>
                <div className="flex flex-wrap gap-2">
                  {splitToChips(p.workStyle).map((chip, i) => (
                    <span key={`work-${i}-${chip.slice(0, 8)}`} className={CHIP}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
            {p.decisionMaking && (
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Decision Making</p>
                <div className="flex flex-wrap gap-2">
                  {splitToChips(p.decisionMaking).map((chip, i) => (
                    <span key={`dec-${i}-${chip.slice(0, 8)}`} className={CHIP}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Motivators + Stressors ── */}
        {(motivators.length > 0 || stressors.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {motivators.length > 0 && (
              <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-500/80 mb-3">Energized by</p>
                <div className="space-y-2">
                  {motivators.map((m, i) => (
                    <div key={`mot-${i}-${m.slice(0, 12)}`} className="flex items-start gap-2">
                      <span className="text-emerald-500 text-xs mt-0.5">✓</span>
                      <span className="text-[13px] text-emerald-200/80 leading-snug">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stressors.length > 0 && (
              <div className="rounded-xl bg-amber-950/30 border border-amber-800/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/80 mb-3">Drained by</p>
                <div className="space-y-2">
                  {stressors.map((s, i) => (
                    <div key={`str-${i}-${s.slice(0, 12)}`} className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs mt-0.5">!</span>
                      <span className="text-[13px] text-amber-200/80 leading-snug">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Personality dimensions ── */}
        {hasVector && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-5">Personality Dimensions</p>
            <DimensionBars
              key={persona.id}
              vector={persona.personalityVector as number[]}
              archetypeColor={archetypeColor}
            />
          </div>
        )}

        {/* ── Interaction tips ── */}
        {tips.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">Working with {persona.name}</p>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={`tip-${i}-${tip.slice(0, 16)}`} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex gap-3 pt-2 pb-2">
          <Link
            href={'/chat/' + encodeURIComponent(persona.id)}
            data-testid="persona-chat-link"
            aria-label={`Chat with ${persona.name}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            <ChatIcon />
            Chat with {persona.name}
          </Link>
          <Link
            href={'/consult/' + encodeURIComponent(persona.id)}
            data-testid="persona-consult-link"
            aria-label={`Consult ${persona.name}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            <ConsultIcon />
            Consult {persona.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
