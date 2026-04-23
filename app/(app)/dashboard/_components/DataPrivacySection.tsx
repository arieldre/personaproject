'use client'

import { useState } from 'react'

export default function DataPrivacySection() {
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState<{ deletedAt: string; purgeAt: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account?\n\n' +
        'Your data will be retained for 30 days and then permanently purged. ' +
        'You will be signed out immediately.',
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed (${res.status})`)
      }
      const data = (await res.json()) as { ok: boolean; deletedAt: string; purgeAt: string }
      setDeleted(data)
      // Redirect to login after a short pause so the user sees the confirmation
      setTimeout(() => { window.location.href = '/login' }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section
      data-testid="data-privacy-section"
      className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-8"
    >
      <h2 className="text-lg font-semibold mb-1">Data &amp; Privacy</h2>
      <p className="text-neutral-400 text-sm mb-6">
        You own your data. Export a full copy or request account deletion at any time.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Export — simple link, browser triggers download via Content-Disposition */}
        <a
          data-testid="export-data-button"
          href="/api/user/export"
          download="persona-data-export.json"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
        >
          Export my data
        </a>

        {deleted ? (
          <p className="text-sm text-green-400 self-center">
            Account scheduled for deletion. Purge date:{' '}
            {new Date(deleted.purgeAt).toLocaleDateString()}. Redirecting…
          </p>
        ) : (
          <button
            data-testid="delete-account-button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-lg border border-red-800 bg-transparent px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        )}
      </div>

      {error && (
        <p data-testid="delete-error" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  )
}
