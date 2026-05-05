import { createAvatar } from '@dicebear/core'
import { personas } from '@dicebear/collection'

// Archetype colors → DiceBear background color (muted tones that work on dark UI)
const ARCHETYPE_BG: Record<string, string[]> = {
  blue:    ['1e40af'],
  violet:  ['5b21b6'],
  emerald: ['065f46'],
  amber:   ['92400e'],
  rose:    ['9f1239'],
  cyan:    ['164e63'],
}

interface AvatarDemographics {
  gender?: string
  ageRange?: string
  typicalRole?: string
}

function parseDemographics(summary: unknown): AvatarDemographics {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return {}
  const s = summary as Record<string, unknown>
  const d = (s.demographics ?? s.summary) as Record<string, unknown> | undefined
  if (!d || typeof d !== 'object') return {}
  return {
    gender: typeof d.gender === 'string' ? d.gender : undefined,
    ageRange: typeof d.ageRange === 'string' ? d.ageRange : undefined,
    typicalRole: typeof d.typicalRole === 'string' ? d.typicalRole : undefined,
  }
}

export function getAvatarDataUri(
  name: string,
  summary?: unknown,
  archetypeColor?: string
): string {
  const demo = parseDemographics(summary)
  // Compose seed from character traits so each demographically different persona gets a unique avatar
  const seedParts = [name, demo.gender ?? '', demo.ageRange ?? '', demo.typicalRole ?? '']
  const seed = seedParts.filter(Boolean).join('|')

  const bgColor = archetypeColor ? (ARCHETYPE_BG[archetypeColor] ?? ['1e293b']) : ['1e293b']

  return createAvatar(personas, {
    seed,
    backgroundColor: bgColor,
  }).toDataUri()
}
