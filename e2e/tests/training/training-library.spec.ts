import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Ensure screenshot directory exists
const screenshotDir = path.join(process.cwd(), 'e2e/screenshots/training')
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true })
}

function ssPath(name: string) {
  return path.join(screenshotDir, name)
}

// Longer timeout for this full-flow test (grading can take up to 3 min)
test.setTimeout(240_000)

test('Training library — full flow with grading', async ({ page }) => {
  // ── Step 1: Navigate to /training ──────────────────────────────────────────
  await page.goto('/training')
  await page.waitForLoadState('networkidle')

  await page.screenshot({ path: ssPath('training-library-home.png'), fullPage: true })
  console.log('[screenshot] training-library-home.png')

  // Verify page loaded
  await expect(page.getByText('Training Library')).toBeVisible()

  // ── Step 2: Click the first difficulty button on the first persona card ────
  // Each card has scenario-link-{difficulty} buttons. Click the first one found.
  const firstDifficultyLink = page.locator('[data-testid^="scenario-link-"]').first()
  await expect(firstDifficultyLink).toBeVisible({ timeout: 10000 })

  // Wait for navigation to the scenario page (URL changes from /training to /training/...)
  await Promise.all([
    page.waitForURL((url) => url.toString().includes('/training/'), { timeout: 15000 }),
    firstDifficultyLink.click(),
  ])
  await page.waitForLoadState('networkidle')

  await page.screenshot({ path: ssPath('training-scenario-setup.png'), fullPage: true })
  console.log('[screenshot] training-scenario-setup.png')

  // ── Step 3: Start the session ─────────────────────────────────────────────
  // For default personas, "Start Session" button is available immediately
  const startBtn = page.getByTestId('start-session-btn')
  await expect(startBtn).toBeVisible({ timeout: 10000 })
  await expect(startBtn).toBeEnabled()

  await startBtn.click()

  // Wait for chat input to appear (confirms we're in 'active' state)
  const chatInput = page.locator('input[placeholder="Type your response…"]')
  await expect(chatInput).toBeVisible({ timeout: 10000 })

  await page.screenshot({ path: ssPath('training-chat-active.png'), fullPage: true })
  console.log('[screenshot] training-chat-active.png')

  // ── Step 4: Send first message ────────────────────────────────────────────
  async function sendMessage(text: string) {
    await chatInput.fill(text)
    const sendBtn = page.getByRole('button', { name: 'Send', exact: true })
    await sendBtn.click()
    // Wait for sending indicator to disappear (AI responding)
    await page.waitForFunction(
      () => !document.querySelector('.animate-bounce'),
      { timeout: 45_000 },
    )
    // Extra small wait to ensure DOM settles after streamed response
    await page.waitForTimeout(500)
  }

  await sendMessage("Hi, I need to discuss John's performance review. He's been missing deadlines for 3 months and I want to address this properly.")

  await page.screenshot({ path: ssPath('training-chat-response.png'), fullPage: true })
  console.log('[screenshot] training-chat-response.png')

  // ── Step 5: Continue conversation (need 3+ user turns to enable End & Grade) ──
  await sendMessage(
    "I have documented three specific instances: missed the Q1 report by 5 days, " +
    "shipped the product update 2 weeks late, and hasn't submitted the weekly status updates. " +
    "What's the proper process for a formal performance conversation?"
  )

  await sendMessage(
    "I want to be fair to John — he's had some personal challenges recently. " +
    "How do I balance documenting the performance issues while being empathetic about his situation?"
  )

  await sendMessage(
    "What should I include in the written summary after our meeting, " +
    "and what specific timelines are typical for a performance improvement plan?"
  )

  // ── Step 6: End & Grade ───────────────────────────────────────────────────
  const endGradeBtn = page.getByTestId('end-session-btn')
  await expect(endGradeBtn).toBeVisible({ timeout: 5000 })
  await expect(endGradeBtn).toBeEnabled({ timeout: 5000 })

  await endGradeBtn.click()

  // Grading spinner should appear
  await expect(page.getByText('Grading your conversation')).toBeVisible({ timeout: 10000 })
  console.log('[grading] Waiting for grading to complete (up to 3 min)...')

  // ── Step 7: Wait for results (poll up to 3 minutes) ───────────────────────
  // The component polls /api/training/job/{jobId} every 3s internally.
  // We wait for the results screen to appear.
  await expect(page.getByTestId('overall-score')).toBeVisible({ timeout: 180_000 })

  await page.screenshot({ path: ssPath('training-results.png'), fullPage: true })
  console.log('[screenshot] training-results.png')

  // ── Step 8: Assertions ────────────────────────────────────────────────────
  // Letter grade exists
  const gradeEl = page.locator('.text-4xl.font-bold.tabular-nums')
  await expect(gradeEl).toBeVisible()
  const gradeText = await gradeEl.textContent()
  console.log('[result] Letter grade:', gradeText)

  // Overall score exists
  const scoreEl = page.getByTestId('overall-score')
  const scoreText = await scoreEl.textContent()
  console.log('[result] Overall score:', scoreText)

  // At least 1 dimension score bar
  const scoreBars = page.locator('.bg-neutral-800.rounded-full')
  const barCount = await scoreBars.count()
  expect(barCount).toBeGreaterThanOrEqual(1)
  console.log('[result] Dimension bars found:', barCount)

  // Overall feedback text
  const feedbackEl = page.getByText('Feedback').first()
  await expect(feedbackEl).toBeVisible()
  console.log('[result] Overall feedback section visible')

  // Log a summary for the report
  console.log('[summary] grade=' + gradeText + ', score=' + scoreText + ', bars=' + barCount)
})
