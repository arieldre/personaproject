import { ARCHETYPE_MAP, type ArchetypeColor } from './archetypes'

interface DimensionBarsProps {
  vector: number[]
  archetypeColor: ArchetypeColor
}

// 14 VCPQ dimensions in canonical order
const DIMENSIONS: { key: string; label: string }[] = [
  { key: 'innovation',       label: 'Innovation' },
  { key: 'diligence',        label: 'Diligence' },
  { key: 'social_energy',    label: 'Social Energy' },
  { key: 'agreeableness',    label: 'Agreeableness' },
  { key: 'directness',       label: 'Directness' },
  { key: 'verbosity',        label: 'Verbosity' },
  { key: 'formality',        label: 'Formality' },
  { key: 'jargon_density',   label: 'Jargon Use' },
  { key: 'deference',        label: 'Deference' },
  { key: 'autonomy',         label: 'Autonomy' },
  { key: 'sycophancy',       label: 'Agreeableness (Social)' },
  { key: 'conflict_mode',    label: 'Conflict Mode' },
  { key: 'decision_basis',   label: 'Decision Basis' },
  { key: 'stress_resilience', label: 'Stress Resilience' },
]

const GROUPS: { label: string; indices: number[] }[] = [
  { label: 'Communication', indices: [5, 6, 7] },        // verbosity, formality, jargon_density
  { label: 'Social',        indices: [2, 3, 8] },        // social_energy, agreeableness, deference
  { label: 'Work',          indices: [0, 1, 9] },        // innovation, diligence, autonomy
  { label: 'Behavior',      indices: [4, 10, 11, 12, 13] }, // directness, sycophancy, conflict_mode, decision_basis, stress_resilience
]

export default function DimensionBars({ vector, archetypeColor }: DimensionBarsProps) {
  const { barFill } = ARCHETYPE_MAP[archetypeColor]

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">
            {group.label}
          </p>
          <div className="space-y-3">
            {group.indices.map((dimIndex) => {
              const dim = DIMENSIONS[dimIndex]
              const raw = vector[dimIndex] ?? 0
              const pct = Math.round((raw + 1) / 2 * 100)

              return (
                <div key={dim.key} data-testid={`dim-bar-${dim.key}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-neutral-400">{dim.label}</span>
                    <span className="text-xs text-neutral-500">{pct}%</span>
                  </div>
                  {/* Track */}
                  <div className="w-full h-1.5 rounded-full bg-neutral-700">
                    {/* Fill */}
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${dim.label}: ${pct}%`}
                      className={`h-full rounded-full transition-[width] duration-500 ease-out ${barFill}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
