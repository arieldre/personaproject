import path from 'path'
import fs from 'fs'

export default async function globalSetup() {
  const authPath = path.join(process.cwd(), 'e2e/auth.json')
  const baseURL = process.env.BASE_URL || 'http://localhost:3001'
  const email = process.env.TEST_EMAIL || 'admin@acme-demo.com'
  const password = process.env.TEST_PASSWORD || 'AcmeDemo123!'

  // Hit Better Auth API directly — faster than browser UI login.
  // Must include Origin header; without it the server returns 403.
  const res = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseURL,
      'Referer': `${baseURL}/login`,
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    throw new Error(`Auth API returned ${res.status}: ${await res.text()}`)
  }

  // Node 24 native fetch merges Set-Cookie headers — use getSetCookie if available
  let cookieStrings: string[] = []
  if (typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function') {
    cookieStrings = (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
  } else {
    const raw = res.headers.get('set-cookie')
    if (raw) cookieStrings = [raw]
  }

  if (cookieStrings.length === 0) {
    throw new Error('No Set-Cookie header in auth response')
  }

  // Parse cookie strings into Playwright format
  const parsedCookies = cookieStrings.map((cookieStr) => {
    const parts = cookieStr.split(';').map((p) => p.trim())
    const [nameVal, ...attrs] = parts
    const eqIdx = nameVal.indexOf('=')
    const name = nameVal.substring(0, eqIdx)
    const value = nameVal.substring(eqIdx + 1)
    const pathAttr = attrs.find((a) => a.toLowerCase().startsWith('path='))
    const cookiePath = pathAttr ? pathAttr.split('=')[1] : '/'
    return {
      name,
      value,
      domain: 'localhost',
      path: cookiePath,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const,
    }
  })

  fs.writeFileSync(authPath, JSON.stringify({ cookies: parsedCookies, origins: [] }, null, 2))
}
