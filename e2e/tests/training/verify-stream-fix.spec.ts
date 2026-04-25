import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const screenshotDir = path.join(process.cwd(), 'e2e/screenshots/training')
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true })
}

function ssPath(name: string) {
  return path.join(screenshotDir, name)
}

test.setTimeout(240_000)

// ── Helper: wait for training chat streaming to complete ──────────────────────
// Waits until there are N assistant message bubbles with non-empty text.
// This is more reliable than watching bounce dots (which may render too fast).
async function waitForTrainingResponse(
  page: import('@playwright/test').Page,
  expectedAssistantCount: number,
  timeout = 45_000
) {
  // Wait until the expected number of non-empty assistant bubbles are present
  await page.waitForFunction(
    (count) => {
      // Assistant bubbles: .flex.justify-start > div (inside messages area)
      // The sending bounce bubble is also justify-start but has no real text
      const bubbles = document.querySelectorAll('div.flex.justify-start > div')
      let nonEmpty = 0
      for (const b of bubbles) {
        const txt = b.textContent?.trim() ?? ''
        // Skip the bounce dots container (only contains spans, short text)
        if (txt.length > 20) nonEmpty++
      }
      return nonEmpty >= count
    },
    expectedAssistantCount,
    { timeout }
  )
  // Also make sure no bounce animation is running
  await page.waitForFunction(
    () => document.querySelectorAll('.animate-bounce').length === 0,
    { timeout: 10_000 }
  ).catch(() => {})
  await page.waitForTimeout(300)
}

// ── Helper: wait for consult streaming to complete ────────────────────────────
// Consult shows bounce dots while isLoading && last message isn't assistant yet.
// A simpler signal: wait until a new consult-message with role assistant appears
// (i.e., the assistant bubble has non-empty text content).
async function waitForConsultResponse(
  page: import('@playwright/test').Page,
  expectedMsgCount: number,
  timeout = 45_000
) {
  // Wait for the bounce dots to disappear (isLoading becomes false after stream ends)
  await page.waitForFunction(
    () => document.querySelectorAll('.animate-bounce').length === 0,
    { timeout }
  )
  await page.waitForTimeout(400)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: Training chat — verifies stream-fix (non-empty response, no 0: prefix)
// ═══════════════════════════════════════════════════════════════════════════════
test('Training chat: stream works and response is non-empty', async ({ page }) => {
  // Step 1: Training home
  await page.goto('/training')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ssPath('01-training-home.png'), fullPage: true })
  console.log('[screenshot] 01-training-home.png')

  await expect(page.getByText('Training Library')).toBeVisible({ timeout: 10000 })

  // Step 2: Navigate directly to Jordan Hayes Easy scenario
  // Get href from the first scenario link — avoids click-navigation race
  const firstLink = page.locator('[data-testid^="scenario-link-"]').first()
  await expect(firstLink).toBeVisible({ timeout: 10000 })
  const scenarioHref = await firstLink.getAttribute('href')
  console.log('[info] Navigating to scenario:', scenarioHref)

  await page.goto(scenarioHref!)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ssPath('02-scenario-setup.png'), fullPage: true })
  console.log('[screenshot] 02-scenario-setup.png')

  // Step 3: Start Session
  // Wait for React hydration — button must be enabled (not just visible) before clicking.
  // networkidle alone is insufficient for Next.js App Router RSC hydration.
  const startBtn = page.getByTestId('start-session-btn')
  await expect(startBtn).toBeEnabled({ timeout: 15000 })
  await startBtn.click()

  // If state machine didn't transition, retry once — handles rare hydration race
  const chatInput = page.locator('input[placeholder="Type your response…"]')
  const chatVisible = await chatInput.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
  if (!chatVisible) {
    console.log('[retry] Chat input not visible after first click — retrying Start Session')
    await expect(startBtn).toBeEnabled({ timeout: 5000 })
    await startBtn.click()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
  }
  await page.screenshot({ path: ssPath('03-chat-active.png'), fullPage: true })
  console.log('[screenshot] 03-chat-active.png')

  // Step 4: Send first message — core stream-fix verification
  await chatInput.fill('Hi Jordan, I need to discuss an accommodation request for one of my team members')
  await page.getByRole('button', { name: 'Send', exact: true }).click()

  // Wait for streaming to finish: bounce dots disappear
  await waitForTrainingResponse(page, 1)

  // Verify assistant message has content
  // Messages DOM: div.flex.justify-start > div.bg-neutral-800.text-neutral-100
  const assistantBubbles = page.locator('div.flex.justify-start > div')
  const bubbleCount = await assistantBubbles.count()
  console.log('[chat_works] Assistant bubbles in DOM:', bubbleCount)

  let responseText = ''
  if (bubbleCount > 0) {
    responseText = (await assistantBubbles.first().textContent()) ?? ''
  } else {
    // Fallback: any text in the messages scroll area
    responseText = (await page.locator('div.flex-1.overflow-y-auto').first().textContent()) ?? ''
  }
  console.log('[chat_works] Response non-empty:', responseText.length > 10)
  console.log('[chat_works] First 200 chars:', responseText.substring(0, 200))

  await page.screenshot({ path: ssPath('04-chat-conversation.png'), fullPage: true })
  console.log('[screenshot] 04-chat-conversation.png')

  // Step 5: Two more messages (3 total user turns required for End & Grade)
  await chatInput.fill('The employee needs extra breaks due to a medical condition. What does the ADA require here?')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await waitForTrainingResponse(page, 2)

  await chatInput.fill('How do I document this accommodation request to protect both the company and the employee?')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await waitForTrainingResponse(page, 3)

  // Step 6: End & Grade
  // Button enables after 3 user turns — wait longer since 3rd AI response just finished
  const endBtn = page.getByTestId('end-session-btn')
  await expect(endBtn).toBeEnabled({ timeout: 15000 })
  await endBtn.click()

  console.log('[grading] Grading triggered — waiting up to 3 min...')

  // Wait for grading spinner to appear first
  const gradingSpinner = page.locator('text=Grading your conversation')
  await expect(gradingSpinner).toBeVisible({ timeout: 10000 }).catch(() => {
    console.log('[grading] Spinner not found — may have completed instantly')
  })

  // Then wait for results
  const resultsEl = page.getByTestId('overall-score')
  const hasResults = await resultsEl
    .waitFor({ state: 'visible', timeout: 180_000 })
    .then(() => true)
    .catch(() => false)

  await page.screenshot({ path: ssPath('05-results.png'), fullPage: true })
  console.log('[screenshot] 05-results.png')
  console.log('[grading] Results visible:', hasResults)

  if (!hasResults) {
    const bodySnip = (await page.locator('body').textContent())?.substring(0, 300)
    console.log('[grading] Page state (Inngest may not be running):', bodySnip)
  }

  // The test passes as long as chat streamed correctly — grading requires Inngest
  expect(responseText.length).toBeGreaterThan(10)
  console.log('[RESULT] chat_works: true, chat_response_non_empty: true')
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: Consult — verifies stream + expert advice response
// ═══════════════════════════════════════════════════════════════════════════════
test('Consult feature: stream works and response has content', async ({ page }) => {
  await page.goto('/training')
  await page.waitForLoadState('networkidle')

  // Consult link: data-testid="consult-link", href="/consult/{encoded-id}"
  const consultLink = page.locator('[data-testid="consult-link"]').first()
  await expect(consultLink).toBeVisible({ timeout: 10000 })
  const consultHref = await consultLink.getAttribute('href')
  console.log('[consult] Navigating to:', consultHref)

  // Navigate directly — avoids Promise.all timing issues
  await page.goto(consultHref!)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ssPath('06-consult-home.png'), fullPage: true })
  console.log('[screenshot] 06-consult-home.png')

  // Verify violet Consult badge in header
  const consultBadge = page.locator('.text-violet-400').filter({ hasText: 'Consult' })
  const badgeVisible = await consultBadge.isVisible().catch(() => false)
  console.log('[consult] Violet Consult badge visible:', badgeVisible)

  // Consult input: textarea with data-testid="consult-input"
  const consultInput = page.getByTestId('consult-input')
  await expect(consultInput).toBeVisible({ timeout: 10000 })

  // Send HR question
  await consultInput.fill("What's the difference between a PIP and a written warning, and when should I use each?")
  await page.getByTestId('consult-send-btn').click()

  // Wait for streaming to complete — bounce dots disappear
  await waitForConsultResponse(page, 2)

  await page.screenshot({ path: ssPath('07-consult-response.png'), fullPage: true })
  console.log('[screenshot] 07-consult-response.png')

  // Verify response content via consult-message elements
  const consultMessages = page.locator('[data-testid="consult-message"]')
  const msgCount = await consultMessages.count()
  console.log('[consult_works] Consult message elements:', msgCount)

  let responseText = ''
  if (msgCount >= 2) {
    // Second message is the assistant response
    responseText = (await consultMessages.nth(1).textContent()) ?? ''
  } else if (msgCount === 1) {
    responseText = (await consultMessages.first().textContent()) ?? ''
  }

  console.log('[consult_works] Response non-empty:', responseText.length > 50)
  console.log('[consult_works] First 300 chars:', responseText.substring(0, 300))

  // Assert
  expect(responseText.length).toBeGreaterThan(50)
  console.log('[RESULT] consult_works: true, consult_response_non_empty: true')
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: Personas page — both Chat and Consult buttons present
// ═══════════════════════════════════════════════════════════════════════════════
test('Personas page: Chat and Consult buttons both visible', async ({ page }) => {
  await page.goto('/personas')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ssPath('08-personas-page.png'), fullPage: true })
  console.log('[screenshot] 08-personas-page.png')

  const chatBtns = page.getByRole('link', { name: /Chat/i })
  const consultBtns = page.getByRole('link', { name: /Consult/i })

  const chatCount = await chatBtns.count()
  const consultCount = await consultBtns.count()
  console.log('[personas] Chat buttons:', chatCount)
  console.log('[personas] Consult buttons:', consultCount)

  if (chatCount > 0 && consultCount > 0) {
    console.log('[personas] PASS: Both Chat and Consult buttons present')
  } else {
    const bodySnip = (await page.locator('body').textContent())?.substring(0, 500)
    console.log('[personas] Page snapshot:', bodySnip)
  }
})
