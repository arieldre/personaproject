#!/usr/bin/env tsx
/**
 * Screenshots demo — logs in and captures key pages.
 * Run after seed-demo.ts: npx tsx scripts/screenshot-demo.ts
 */
import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3000'
const EMAIL = 'admin@acme-demo.com'
const PASSWORD = 'AcmeDemo123!'
const OUT_DIR = path.join(process.cwd(), 'e2e/screenshots/demo')

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  // ── Login page ──────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`)
  await page.screenshot({ path: `${OUT_DIR}/01-login.png`, fullPage: false })
  console.log('✓ 01-login.png')

  // ── Sign in ─────────────────────────────────────────────────────────────────
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASSWORD)
  await page.click('[data-testid="email-submit-btn"]')
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  console.log('✓ Signed in')

  // ── Dashboard ───────────────────────────────────────────────────────────────
  await page.screenshot({ path: `${OUT_DIR}/02-dashboard.png`, fullPage: false })
  console.log('✓ 02-dashboard.png')

  // ── Admin personas ──────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/personas`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${OUT_DIR}/03-admin-personas.png`, fullPage: true })
  console.log('✓ 03-admin-personas.png')

  // ── Persona detail (first one) ──────────────────────────────────────────────
  const firstPersona = page.locator('[data-testid="persona-card"]').first()
  if (await firstPersona.isVisible()) {
    await firstPersona.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${OUT_DIR}/04-persona-detail.png`, fullPage: true })
    console.log('✓ 04-persona-detail.png')
    await page.goBack()
  }

  // ── Admin surveys ───────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/surveys`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${OUT_DIR}/05-admin-surveys.png`, fullPage: false })
  console.log('✓ 05-admin-surveys.png')

  // ── Match page ──────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/match`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${OUT_DIR}/06-match-empty.png`, fullPage: false })
  console.log('✓ 06-match-empty.png')

  // Try selecting first employee and running match
  const select = page.locator('[data-testid="employee-select"]')
  if (await select.isVisible()) {
    // Select first option (not the placeholder)
    const options = await select.locator('option').all()
    if (options.length > 1) {
      const val = await options[1].getAttribute('value')
      if (val) {
        await select.selectOption(val)
        await page.click('[data-testid="find-match-btn"]')
        await page.waitForTimeout(3000) // wait for match results
        await page.screenshot({ path: `${OUT_DIR}/07-match-results.png`, fullPage: true })
        console.log('✓ 07-match-results.png')
      }
    }
  }

  // ── Survey page ─────────────────────────────────────────────────────────────
  const surveyCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const surveyPage = await surveyCtx.newPage()
  await surveyPage.goto(`${BASE_URL}/survey/ACME2026`)
  await surveyPage.waitForLoadState('networkidle')
  await surveyPage.screenshot({ path: `${OUT_DIR}/08-survey-form.png`, fullPage: false })
  console.log('✓ 08-survey-form.png')
  await surveyCtx.close()

  await browser.close()

  console.log(`\nAll screenshots saved to: ${OUT_DIR}`)
}

main().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
