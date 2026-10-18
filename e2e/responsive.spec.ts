import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// The widths of UI-2, plus what 200% zoom leaves of a 1440 desktop and of a 640 window, the 320 reflow width, and the widths in between where fixed columns used to overflow (a landscape tablet at 1024, a small laptop at 1100 and 1180).
const WIDTHS = [390, 768, 1440, 720, 320, 600, 1024, 1100, 1180, 1920] as const

async function expectFits(page: Page, width: number, path: string) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(path)
  await expect(page.getByRole('heading').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over, `${path} at ${width}px overflows by ${over}px`).toBeLessThanOrEqual(0)
  // No lost content: the main area is on screen and the footer text is still in the page.
  await expect(page.getByRole('main').or(page.getByRole('dialog')).first()).toBeVisible()
  await expect(page.getByText('© 2026 Kurio')).toBeAttached()
}

test.describe('UI-2#1 A11Y-7#1: public screens fit every width and zoom level', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, 'Resizes the window itself; the desktop project runs it once')
  for (const path of ['/', '/nfts/nft-004', '/entrar', '/cadastrar', '/rota-que-nao-existe']) {
    test(path, async ({ page }) => {
      for (const width of WIDTHS) await expectFits(page, width, path)
    })
  }
})

test.describe('UI-2#1 A11Y-7#1: private screens fit every width and zoom level', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, 'Resizes the window itself; the desktop project runs it once')
  for (const path of ['/perfil', '/carteiras', '/favoritos', '/carrinho', '/pagamento']) {
    test(path, async ({ page }) => {
      await signIn(page)
      await page.goto('/nfts/nft-004')
      await page.getByRole('radio', { name: 'Edição 1/10' }).click()
      await page.getByRole('button', { name: /comprar/i }).first().click()
      await expect(page).toHaveURL('/carrinho')
      for (const width of WIDTHS) await expectFits(page, width, path)
    })
  }
})
