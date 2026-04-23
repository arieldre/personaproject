'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendInvite } from '../actions'

export default function NewInvitationPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'company_admin'>('user')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await sendInvite(email, role)
      router.push('/admin/invitations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-start justify-center pt-24 px-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Invite someone</h1>
          <p className="text-sm text-neutral-400 mt-1">They&apos;ll receive an email with a link to join your team.</p>
        </div>

        <form
          data-testid="invite-form"
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
        >
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm text-neutral-300 font-medium">
              Email address
            </label>
            <input
              id="invite-email"
              data-testid="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-role" className="text-sm text-neutral-300 font-medium">
              Role
            </label>
            <select
              id="invite-role"
              data-testid="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'company_admin')}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition appearance-none"
            >
              <option value="user">User</option>
              <option value="company_admin">Company Admin</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 px-4 bg-white text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}
