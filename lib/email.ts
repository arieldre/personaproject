import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Persona Platform <noreply@persona-platform.com>'

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string
  resetUrl: string
}) {
  if (!process.env.RESEND_API_KEY) {
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
