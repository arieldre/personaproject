import { test, expect } from '@playwright/test'

// Admin credentials come from global-setup — auth.json is populated before these tests run.
// Non-admin role redirect is skipped: middleware has no role-based guard on /settings/billing
// (only unauthenticated users are redirected, to /login not /dashboard).

test.describe('Billing page', () => {
  test('admin visits /settings/billing and sees trial state with 3 tier cards', async ({ page }) => {
    await page.goto('/settings/billing')

    // Should land on billing, not get bounced to login
    await expect(page).toHaveURL(/\/settings\/billing/)

    // Trial copy visible
    await expect(page.getByTestId('billing-upgrade-section')).toBeVisible()
    await expect(page.getByText('You are on a free trial.')).toBeVisible()

    // All three tier cards present
    await expect(page.getByTestId('billing-tier-starter')).toBeVisible()
    await expect(page.getByTestId('billing-tier-growth')).toBeVisible()
    await expect(page.getByTestId('billing-tier-enterprise')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/app/billing-trial.png' })
  })

  test('starter tier shows "Start subscription" button inside a form', async ({ page }) => {
    await page.goto('/settings/billing')

    const starterCard = page.getByTestId('billing-tier-starter')
    await expect(starterCard).toBeVisible()

    // CTA must be a submit button (inside a form — not a link)
    const cta = page.getByTestId('billing-cta-starter')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('type', 'submit')
    await expect(cta).toHaveText('Start subscription', {})
  })

  test('growth tier shows "Start subscription" button inside a form', async ({ page }) => {
    await page.goto('/settings/billing')

    const growthCard = page.getByTestId('billing-tier-growth')
    await expect(growthCard).toBeVisible()

    const cta = page.getByTestId('billing-cta-growth')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('type', 'submit')
    await expect(cta).toHaveText('Start subscription', {})
  })

  test('enterprise tier shows "Contact sales" link, not a form button', async ({ page }) => {
    await page.goto('/settings/billing')

    const enterpriseCard = page.getByTestId('billing-tier-enterprise')
    await expect(enterpriseCard).toBeVisible()

    // Enterprise CTA is an <a> tag — verify it's not a button
    const cta = page.getByTestId('billing-cta-enterprise')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveText('Contact sales', {})

    // Must be an anchor with a mailto href, not a submit button
    const tagName = await cta.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('a')
    const href = await cta.getAttribute('href')
    expect(href).toMatch(/^mailto:/)
  })

  test('success banner appears when ?success=1 is present', async ({ page }) => {
    await page.goto('/settings/billing?success=1')

    await expect(page.getByTestId('billing-success-banner')).toBeVisible()
    await expect(page.getByText('Subscription activated.')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/app/billing-success.png' })
  })

  test('success banner is absent without ?success=1', async ({ page }) => {
    await page.goto('/settings/billing')
    await expect(page.getByTestId('billing-success-banner')).not.toBeVisible()
  })

  test('non-admin redirect — no role guard yet', async () => {
    // Middleware redirects unauthenticated users to /login — no role-based guard on /settings/billing.
    // Unskip when an admin-only guard is added.
    test.skip(true, 'No role-based guard on /settings/billing — only auth guard')
  })
})
