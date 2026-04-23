import { Resend } from 'resend'

const FROM = 'Persona Platform <noreply@persona-platform.com>'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string
  resetUrl: string
}) {
  const resend = getResend()
  if (!resend) {
    console.log(`[email:dev] password reset → ${resetUrl}`)
    return
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Persona Platform password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111">Reset your password</h2>
        <p style="color:#555">Click the link below to reset your password. It expires in 1 hour.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;margin:16px 0">
          Reset password
        </a>
        <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendInvitationEmail({
  to,
  inviterName,
  companyName,
  inviteUrl,
  expiresAt,
}: {
  to: string
  inviterName: string
  companyName: string
  inviteUrl: string
  expiresAt: Date
}) {
  const resend = getResend()
  if (!resend) {
    console.log(`[email:dev] invitation → ${inviteUrl}`)
    return
  }

  const expiryDate = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited to ${companyName} on Persona Platform`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111">You've been invited</h2>
        <p style="color:#555">${inviterName} has invited you to join ${companyName} on Persona Platform.</p>
        <a href="${inviteUrl}"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;margin:16px 0">
          Accept Invitation
        </a>
        <p style="color:#999;font-size:12px">This invitation expires on ${expiryDate}. If you didn't expect this, you can ignore it.</p>
      </div>
    `,
  })
}
