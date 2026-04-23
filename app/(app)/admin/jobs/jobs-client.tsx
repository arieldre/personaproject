'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition, useState } from 'react'
import { triggerPing } from './actions'

interface Job {
  id: string
  type: string
  status: string
  createdAt: Date
  completedAt: Date | null
}

const MAX_POLL_ATTEMPTS = 40 // ~2 minutes at 3s interval

export function JobsClient({ jobs, hasRunning }: { jobs: Job[]; hasRunning: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pollError, setPollError] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCount = useRef(0)

  // P1: poll every 3s while running, cap at MAX_POLL_ATTEMPTS to prevent infinite loop
  useEffect(() => {
    if (!hasRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      pollCount.current = 0
      return
    }
    setPollError(false)
    intervalRef.current = setInterval(() => {
      if (pollCount.current >= MAX_POLL_ATTEMPTS) {
        clearInterval(intervalRef.current!)
        setPollError(true)
        return
      }
      pollCount.current++
      try {
        startTransition(() => router.refresh())
      } catch {
        clearInterval(intervalRef.current!)
        setPollError(true)
      }
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [hasRunning, router])

  async function handleTrigger() {
    try {
      await triggerPing()
      startTransition(() => router.refresh())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger job')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Background Jobs</h1>
          <p className="text-sm text-neutral-400 mt-1">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          data-testid="trigger-ping"
          onClick={handleTrigger}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-white text-neutral-950 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Triggering…' : 'Trigger Ping'}
        </button>
      </div>

      {pollError && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
          Status sync stopped after 2 minutes. Refresh the page to check job status.
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-12 text-center">
          <p className="text-neutral-500 text-sm">No jobs yet. Click &quot;Trigger Ping&quot; to test the queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              data-testid="job-row"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <p className="font-medium text-sm font-mono">{job.type}</p>
                <p className="text-xs text-neutral-500 font-mono truncate">{job.id}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <StatusBadge status={job.status} />
                <p className="text-xs text-neutral-500">
                  {job.completedAt
                    ? `done ${formatAge(job.completedAt)}`
                    : formatAge(job.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued:   'bg-yellow-500/10 text-yellow-400',
    running:  'bg-blue-500/10 text-blue-400',
    complete: 'bg-green-500/10 text-green-400',
    failed:   'bg-red-500/10 text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-neutral-700 text-neutral-400'}`}>
      {status}
    </span>
  )
}

function formatAge(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
