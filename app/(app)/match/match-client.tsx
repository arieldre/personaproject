'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DIMENSIONS } from '@/lib/vcpq/vector'

interface Employee {
  id: string
  respondentName: string | null
  respondentEmail: string | null
}

interface PersonaMatch {
  persona_id: string
  persona_name: string
  persona_tagline: string | null
  similarity: number
  persona_vector: number[]
}

const PCT_COLOR = (pct: number) =>
  pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-neutral-400'

function DimBars({
  employeeVector,
  personaVector,
}: {
  employeeVector: number[]
  personaVector: number[]
}) {
  return (
    <div className="mt-4 space-y-2">
      {DIMENSIONS.map((dim, i) => {
        const empVal = employeeVector[i] ?? 0
        const perVal = personaVector[i] ?? 0
        const empPct = ((empVal + 1) / 2) * 100
        const perPct = ((perVal + 1) / 2) * 100
        return (
          <div key={dim}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-neutral-500 capitalize">
                {dim.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-neutral-600 tabular-nums">
                {empVal.toFixed(2)} / {perVal.toFixed(2)}
              </span>
            </div>
            <div className="relative h-1.5 bg-neutral-800 rounded-full">
              {/* Employee bar */}
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-blue-500/60"
                style={{ width: `${empPct}%` }}
              />
              {/* Persona marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-purple-400"
                style={{ left: `${perPct}%` }}
              />
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-[10px] text-neutral-500">
          <span className="w-3 h-1.5 rounded-full bg-blue-500/60 inline-block" /> You
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-neutral-500">
          <span className="w-0.5 h-3 bg-purple-400 inline-block" /> Persona
        </span>
      </div>
    </div>
  )
}

function MatchCard({
  match,
  rank,
  employeeVector,
  expanded,
  onToggle,
}: {
  match: PersonaMatch
  rank: number
  employeeVector: number[]
  expanded: boolean
  onToggle: () => void
}) {
  const pct = Math.round(match.similarity * 100)

  return (
    <div
      data-testid={`match-card-${rank}`}
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xs font-medium text-neutral-600 w-5 shrink-0">
            #{rank}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{match.persona_name}</p>
            {match.persona_tagline && (
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                {match.persona_tagline}
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            data-testid={`similarity-${rank}`}
            className={`text-2xl font-bold tabular-nums ${PCT_COLOR(pct)}`}
          >
            {pct}%
          </p>
          <p className="text-[10px] text-neutral-600">match</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/chat/${match.persona_id}`}
          data-testid={`chat-cta-${rank}`}
          className="flex-1 text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
        >
          Chat with {match.persona_name}
        </Link>
        <button
          onClick={onToggle}
          className="px-3 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500 text-xs text-neutral-400 transition-colors"
        >
          {expanded ? 'Less' : 'Traits'}
        </button>
      </div>

      {expanded && (
        <DimBars employeeVector={employeeVector} personaVector={match.persona_vector} />
      )}
    </div>
  )
}

export function MatchClient() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [matches, setMatches] = useState<PersonaMatch[]>([])
  const [employeeVector, setEmployeeVector] = useState<number[]>([])
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch('/api/match')
      .then((r) => r.json())
      .then((data: { responses: Employee[] }) => {
        setEmployees(data.responses ?? [])
        if (data.responses?.[0]) setSelectedId(data.responses[0].id)
      })
      .catch(() => setError('Failed to load employees'))
      .finally(() => setLoadingEmployees(false))
  }, [])

  async function runMatch() {
    if (!selectedId || matching) return
    setMatching(true)
    setError(null)
    setMatches([])
    setExpandedCards({})

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: selectedId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Error ${res.status}`)
      }
      const data = (await res.json()) as {
        matches: PersonaMatch[]
        employeeVector: number[]
      }
      setMatches(data.matches)
      setEmployeeVector(data.employeeVector)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Match failed')
    } finally {
      setMatching(false)
    }
  }

  function toggleCard(rank: number) {
    setExpandedCards((prev) => ({ ...prev, [rank]: !prev[rank] }))
  }

  const selectedEmployee = employees.find((e) => e.id === selectedId)
  const displayName = selectedEmployee?.respondentName ?? selectedEmployee?.respondentEmail ?? 'Employee'

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white mb-1">Employee–Persona Match</h1>
          <p className="text-sm text-neutral-500">
            Select an employee to find which AI personas best represent their personality profile.
          </p>
        </div>

        {/* Employee selector */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6">
          {loadingEmployees ? (
            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <span className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
              Loading employees…
            </div>
          ) : employees.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No employees have completed the survey yet. Share a questionnaire link to collect responses.
            </p>
          ) : (
            <>
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                Select employee
              </label>
              <select
                data-testid="employee-select"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 mb-4"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value)
                  setMatches([])
                  setError(null)
                }}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.respondentName ?? emp.respondentEmail ?? emp.id}
                  </option>
                ))}
              </select>

              <button
                data-testid="find-match-btn"
                onClick={runMatch}
                disabled={matching || !selectedId}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
              >
                {matching ? 'Matching…' : `Find Match for ${displayName}`}
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Matching spinner */}
        {matching && (
          <div className="flex items-center justify-center gap-2 py-12 text-neutral-500 text-sm">
            <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Running cosine similarity match…
          </div>
        )}

        {/* Results */}
        {matches.length > 0 && (
          <>
            <p className="text-xs text-neutral-600 mb-3 uppercase tracking-widest">
              Top {matches.length} matches for {displayName}
            </p>
            <div className="space-y-4">
              {matches.map((match, i) => (
                <MatchCard
                  key={match.persona_id}
                  match={match}
                  rank={i + 1}
                  employeeVector={employeeVector}
                  expanded={!!expandedCards[i + 1]}
                  onToggle={() => toggleCard(i + 1)}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty result */}
        {!matching && matches.length === 0 && !error && selectedId && (
          <p className="text-center text-sm text-neutral-600 py-8">
            No active personas found. Generate personas from the Admin panel first.
          </p>
        )}
      </div>
    </main>
  )
}
