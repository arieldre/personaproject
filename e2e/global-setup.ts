import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

export default async function globalSetup() {
  // Skip if auth.json already exists (dev convenience)
  const authPath = path.join(process.cwd(), 'e2e/auth.json')
  if (fs.existsSync(authPath)) return

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(process.env.BASE_URL || 'http://localhost:3000')
  await page.fill('[name="email"]', process.env.TEST_EMAIL || 'test@example.com')
  await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'TestPass123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/)
  await page.context().storageState({ path: authPath })
  await browser.close()
}
