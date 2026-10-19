import { expect, test } from '@playwright/test'
import { signIn } from './support'

// The phone's bottom: the tab bar with its raised button. The desktop has none of it.
test.beforeEach(({ viewport }) => test.skip((viewport?.width ?? 0) >= 768, 'The tab bar exists on the phone only'))

test('UI-1#2: the copyright line stays at the bottom and clear of the tab bar button, on a short page and at the end of a long one', async ({ page }) => {
  await signIn(page)
  for (const path of ['/favoritos', '/']) {
    await page.goto(path)
    const line = page.getByText('© 2026 Kurio. Propriedade digital para todos.')
    const button = page.getByRole('link', { name: 'Explorar lançamentos' })
    // Images load lazily and change the page height, so measure again until the page has settled.
    await expect
      .poll(async () => {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        const [text, raised, height] = await Promise.all([line.boundingBox(), button.boundingBox(), page.evaluate(() => window.innerHeight)])
        if (!text || !raised) return 'not drawn'
        if (text.y + text.height > raised.y) return 'the line is under the raised button'
        return height - (text.y + text.height) <= 160 ? 'ok' : 'the line is not at the bottom of the screen'
      }, { message: path })
      .toBe('ok')
  }
})

test('the controls of the phone screens have a touch target of at least 40 x 40 px, inside the screen', async ({ page }) => {
  for (const path of ['/', '/nfts/nft-004', '/entrar', '/carrinho']) {
    await page.goto(path)
    await expect(page.getByRole('main').or(page.getByRole('heading').first()).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Demo' })).toBeVisible() // mounted after the mock starts; list the controls after it
    const controls = page.locator('a, button, input:not([type=hidden]), [role=radio], [role=checkbox], [role=slider]')
    const small: string[] = []
    for (const control of await controls.all()) {
      if (!(await control.isVisible()) || (await control.isDisabled().catch(() => false))) continue
      await control.scrollIntoViewIfNeeded()
      // What a finger can actually hit: a 40 x 40 square, inside the screen, where every sampled point lands on this control.
      const ok = await control.evaluate((el) => {
        const r = el.getBoundingClientRect()
        if (r.width <= 1 || r.height <= 1 || el.closest('[inert]')) return true
        const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max - 40)
        const xs = [r.left + r.width / 2 - 20, r.left - 2, r.right - 38].map((x) => clamp(x, innerWidth))
        const ys = [r.top + r.height / 2 - 20, r.top - 2, r.bottom - 38].map((y) => clamp(y, innerHeight))
        return xs.some((x) => ys.some((y) => {
          for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            if ((i === 0 || i === 4) && (j === 0 || j === 4)) continue // a round control does not take the corners of its square
            const hit = document.elementFromPoint(x + 1 + i * 9.5, y + 1 + j * 9.5)
            if (!hit || !el.contains(hit)) return false
          }
          return true
        }))
      })
      if (!ok) small.push((await control.getAttribute('aria-label')) ?? (await control.innerText()).trim().slice(0, 30))
    }
    expect(small, path).toEqual([])
  }
})

test('the sign-in page fits the screen, with nothing to scroll', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight }))
  expect(scrollHeight).toBeLessThanOrEqual(innerHeight)
})
