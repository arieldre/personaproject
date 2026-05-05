import { createAvatar } from '@dicebear/core'
import { personas } from '@dicebear/collection'
import type { Options } from '@dicebear/personas'

// Archetype → DiceBear background color (muted dark tones)
const ARCHETYPE_BG: Record<string, string[]> = {
  blue:    ['1e40af'],
  violet:  ['5b21b6'],
  emerald: ['065f46'],
  amber:   ['92400e'],
  rose:    ['9f1239'],
  cyan:    ['164e63'],
}

const DEFAULT_BG = ['1e293b']

// Hair styles split by gender presentation — all are valid personas collection values
const FEMALE_HAIR: Options['hair'] = ['long', 'pigtails', 'bobCut', 'curly', 'curlyBun', 'bobBangs', 'bunUndercut', 'extraLong', 'straightBun']
const MALE_HAIR: Options['hair']   = ['sideShave', 'shortCombover', 'curlyHighTop', 'buzzcut', 'fade', 'bald', 'balding', 'mohawk', 'shortComboverChops']

interface AvatarDemographics {
  gender?: string
  ageRange?: string
  typicalRole?: string
}

function parseDemographics(summary: unknown): AvatarDemographics {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return {}
  const s = summary as Record<string, unknown>
  const d = s.demographics as Record<string, unknown> | undefined
  if (!d || typeof d !== 'object') return {}
  return {
    gender: typeof d.gender === 'string' ? d.gender : undefined,
    ageRange: typeof d.ageRange === 'string' ? d.ageRange : undefined,
    typicalRole: typeof d.typicalRole === 'string' ? d.typicalRole : undefined,
  }
}

// Extract leading digits from ageRange like "35-45" or "50s" → approximate age
function parseAge(ageRange?: string): number | null {
  if (!ageRange) return null
  const match = ageRange.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

export function getAvatarDataUri(
  name: string,
  summary?: unknown,
  archetypeColor?: string
): string {
  const demo = parseDemographics(summary)
  const age = parseAge(demo.ageRange)
  const gender = demo.gender?.trim().toLowerCase()

  // Truncate each component separately so no single field dominates the seed
  const seed = [
    name.substring(0, 40),
    demo.ageRange ?? '',
    (demo.typicalRole ?? '').substring(0, 40),
  ].filter(Boolean).join('|')

  const bgColor = archetypeColor ? (ARCHETYPE_BG[archetypeColor] ?? DEFAULT_BG) : DEFAULT_BG

  // Gender → constrain hair to gendered styles; suppress facial hair for female
  const hair = gender === 'female' ? FEMALE_HAIR : gender === 'male' ? MALE_HAIR : undefined
  const facialHairProbability = gender === 'female' ? 0 : gender === 'male' ? 40 : 20

  // Age → eyes: glasses appear as persona gets older
  const eyes: Options['eyes'] =
    age !== null && age >= 55 ? ['open', 'glasses', 'sunglasses'] :
    age !== null && age >= 35 ? ['open', 'happy', 'wink', 'glasses'] :
    ['open', 'happy', 'wink', 'sleep']

  try {
    return createAvatar(personas, {
      seed,
      backgroundColor: bgColor,
      facialHairProbability,
      eyes,
      ...(hair ? { hair } : {}),
    }).toDataUri()
  } catch {
    return createAvatar(personas, { seed: name, backgroundColor: DEFAULT_BG }).toDataUri()
  }
}
