export const ARCHETYPE_COLORS = ['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan'] as const
export type ArchetypeColor = typeof ARCHETYPE_COLORS[number]

export function getArchetypeColor(index: number): ArchetypeColor {
  return ARCHETYPE_COLORS[index % ARCHETYPE_COLORS.length]
}

// ALL class strings must appear as literals here — Tailwind v4 static scanning
export const ARCHETYPE_MAP: Record<ArchetypeColor, {
  avatarBg: string
  avatarText: string
  borderAccent: string
  barFill: string
  textAccent: string
  ringColor: string
  badgeBg: string
  badgeText: string
  chipBg: string   // strength/quality chip: bg + border + text
}> = {
  blue:    { avatarBg: 'bg-blue-500/15',    avatarText: 'text-blue-400',    borderAccent: 'border-l-blue-500',    barFill: 'bg-blue-500/70',    textAccent: 'text-blue-400',    ringColor: 'ring-blue-500',    badgeBg: 'bg-blue-500/15',    badgeText: 'text-blue-300',    chipBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
  violet:  { avatarBg: 'bg-violet-500/15',  avatarText: 'text-violet-400',  borderAccent: 'border-l-violet-500',  barFill: 'bg-violet-500/70',  textAccent: 'text-violet-400',  ringColor: 'ring-violet-500',  badgeBg: 'bg-violet-500/15',  badgeText: 'text-violet-300',  chipBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300' },
  emerald: { avatarBg: 'bg-emerald-500/15', avatarText: 'text-emerald-400', borderAccent: 'border-l-emerald-500', barFill: 'bg-emerald-500/70', textAccent: 'text-emerald-400', ringColor: 'ring-emerald-500', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-300', chipBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  amber:   { avatarBg: 'bg-amber-500/15',   avatarText: 'text-amber-400',   borderAccent: 'border-l-amber-500',   barFill: 'bg-amber-500/70',   textAccent: 'text-amber-400',   ringColor: 'ring-amber-500',   badgeBg: 'bg-amber-500/15',   badgeText: 'text-amber-300',   chipBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  rose:    { avatarBg: 'bg-rose-500/15',    avatarText: 'text-rose-400',    borderAccent: 'border-l-rose-500',    barFill: 'bg-rose-500/70',    textAccent: 'text-rose-400',    ringColor: 'ring-rose-500',    badgeBg: 'bg-rose-500/15',    badgeText: 'text-rose-300',    chipBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
  cyan:    { avatarBg: 'bg-cyan-500/15',    avatarText: 'text-cyan-400',    borderAccent: 'border-l-cyan-500',    barFill: 'bg-cyan-500/70',    textAccent: 'text-cyan-400',    ringColor: 'ring-cyan-500',    badgeBg: 'bg-cyan-500/15',    badgeText: 'text-cyan-300',    chipBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' },
}
