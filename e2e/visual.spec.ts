import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// TEST-3: baselines of home, detail, cart and payment. Each was committed only after its screen was compared
// with the Figma frame (design-decisions.md §6); they prove that the screens stay as reviewed, not that they match.
async function settle(page: Page) {
  await page.waitForFunction('!!window.__mock && !!navigator.serviceWorker.controller')
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    // Lazy images below the fold would never load on their own: load them all before the full-page shot.
    for (const i of document.images) i.loading = 'eager'
    await Promise.all([...document.images].map((i) => (i.complete ? undefined : new Promise((r) => (i.onload = i.onerror = r)))))
  })
}

// The demo chip is not part of the design. On a phone the tab bar is fixed to the window, so a full-page shot
// would paste it in the middle of the page: phones are compared one window at a time.
const shot = async (page: Page, name: string) => {
  await settle(page)
  await page.addStyleTag({ content: '[aria-controls="mock-panel"]{visibility:hidden}' })
  const desktop = (page.viewportSize()?.width ?? 0) >= 768
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: desktop, animations: 'disabled', maxDiffPixelRatio: 0.02 })
}

test('TEST-3#1 TEST-3#2: home keeps the reviewed look', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  await shot(page, 'home')
})

test('TEST-3#1 TEST-3#2: detail keeps the reviewed look', async ({ page }) => {
  await page.goto('/nfts/nft-004')
  await expect(page.getByRole('radio', { name: 'Edição 1/10' })).toBeVisible()
  await shot(page, 'detail')
})

test('TEST-3#1 TEST-3#2: cart and payment keep the reviewed look', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: /comprar/i }).first().click()
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByText('Total').first()).toBeVisible()
  await shot(page, 'cart')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByText(/Total/).first()).toBeVisible()
  await shot(page, 'payment')
})
