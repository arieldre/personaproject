import { test, expect } from '@playwright/test'

// Blocked: Google OAuth not configured → login broken → no test session
// Unblock: set GOOGLE_CLIENT_ID/SECRET, configure test user, set TEST_EMAIL/TEST_PASSWORD
const BLOCKED = !process.env.TEST_EMAIL

test.describe('Admin Jobs', () => {
  test.skip(BLOCKED, 'Blocked until Google OAuth and test user are configured')

  test('shows empty state when no jobs exist', async ({ page }) => {
    await page.goto('/admin/jobs')
    await expect(page.getByText('No jobs yet')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/app/admin-jobs-empty.png' })
  })

  test('triggers ping job and polls to completion', async ({ page }) => {
    await page.goto('/admin/jobs')
    await page.getByTestId('trigger-ping').click()

    // Job row appears
    await expect(page.getByTestId('job-row').first()).toBeVisible()

    // Polls until complete (Inngest dev server must be running)
    await expect(page.getByText('complete')).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: 'e2e/screenshots/app/admin-jobs-complete.png' })
  })

  test('non-admin user cannot reach admin jobs page', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    await page.goto('/admin/jobs')
    await expect(page).toHaveURL(/login/)
    await ctx.close()
  })
})

test.describe('Cross-tenant isolation', () => {
  test.skip(BLOCKED, 'Blocked until Google OAuth and test user are configured')

  test('company A jobs not visible to company B', async ({ page }) => {
    // TODO: seed two companies, verify Drizzle companyId filter prevents cross-tenant reads
    // This test documents the requirement — implementation in Phase 4 when seed helpers exist
    test.fixme()
  })
})
