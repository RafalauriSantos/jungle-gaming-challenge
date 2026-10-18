import { expect, test } from '@playwright/test'
import { signIn } from './support'

// The phone's bottom: the tab bar with its raised button. The desktop has none of it.
test.beforeEach(({ viewport }) => test.skip((viewport?.width ?? 0) >= 768, 'The tab bar exists on the phone only'))

test('UI-1#2: the copyright line stays at the bottom and clear of the tab bar button, on a short page and at the end of a long one', async ({ page }) => {
  await signIn(page)
  for (const path of ['/favoritos', '/']) {
    await page.goto(path)
    const line = page.getByText('© 2026 Kurio. Propriedade digital para todos.')
    await line.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const button = page.getByRole('link', { name: 'Explorar lançamentos' })
    const [text, raised, height] = await Promise.all([line.boundingBox(), button.boundingBox(), page.evaluate(() => window.innerHeight)])
    expect(text!.y + text!.height, `${path}: the line ends above the raised button`).toBeLessThanOrEqual(raised!.y)
    expect(height - (text!.y + text!.height), `${path}: the line is at the bottom of the screen`).toBeLessThanOrEqual(160)
  }
})

test('the sign-in page fits the screen, with nothing to scroll', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight }))
  expect(scrollHeight).toBeLessThanOrEqual(innerHeight)
})
