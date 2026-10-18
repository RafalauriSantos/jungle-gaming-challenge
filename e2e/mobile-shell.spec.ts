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

test('the controls of the phone screens have a touch target of at least 40 x 40 px', async ({ page }) => {
  for (const path of ['/', '/nfts/nft-004', '/entrar', '/carrinho']) {
    await page.goto(path)
    await expect(page.getByRole('main').or(page.getByRole('heading').first()).first()).toBeVisible()
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a, button, input:not([type=hidden]), [role=radio], [role=checkbox], [role=slider]')]
        .filter((e) => {
          const r = e.getBoundingClientRect()
          if (r.width <= 1 || r.height <= 1 || e.matches(':disabled') || e.closest('[inert]') || getComputedStyle(e).visibility === 'hidden') return false
          const after = getComputedStyle(e, '::after')
          const reach = (box: number, extra: string) => Math.max(box, parseFloat(extra) || 0)
          return reach(r.width, after.width) < 40 || reach(r.height, after.height) < 40
        })
        .map((e) => `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 30)}"`),
    )
    expect(small, path).toEqual([])
  }
})
