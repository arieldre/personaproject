import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // Google OAuth only — Microsoft dropped per product decision
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Email/password for password reset flow only — primary auth is Google OAuth
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 4,
    sendResetPassword: async ({ user: u, url }) => {
      const { sendPasswordResetEmail } = await import('@/lib/email')
      await sendPasswordResetEmail({ to: u.email, resetUrl: url })
    },
  },

  session: {
    // 7-day sessions; refresh on each request via middleware
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24, // refresh if >1 day old
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5-min client cache
    },
  },

  // Inject company_id + role into session for JWT-claim RLS
  // These fields are read from the user record in our `user` table
  user: {
    additionalFields: {
      companyId: {
        type: 'string',
        nullable: true,
        fieldName: 'companyId',
      },
      role: {
        type: 'string',
        defaultValue: 'user',
        fieldName: 'role',
      },
      isActive: {
        type: 'boolean',
        defaultValue: true,
        fieldName: 'isActive',
      },
    },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user
