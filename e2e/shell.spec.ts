import { expect, test } from '@playwright/test'
import { searchField, signIn } from './support'

// The desktop header of the Figma: one nav item marked per screen group, the divider only on the "Início" group,
// the cart count, and a search that opens from its icon. The mobile layout has no header (tab bar instead).
test.beforeEach(({ viewport }) => test.skip((viewport?.width ?? 0) < 768, 'The header exists from tablet width up'))

const header = (page: import('@playwright/test').Page) => page.getByRole('banner')
const nav = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Principal' })

test('UI-1#1: the header marks "Início" with a divider on the home group, and "Mercado" without one on market screens', async ({ page }) => {
  await page.goto('/')
  await expect(nav(page).getByRole('link', { name: 'Início' })).toHaveCSS('font-weight', '700')
  await expect(header(page)).toHaveCSS('border-bottom-width', '1px')

  await page.goto('/nfts/nft-004')
  await expect(nav(page).getByText('Mercado')).toHaveCSS('font-weight', '700')
  await expect(nav(page).getByRole('link', { name: 'Início' })).not.toHaveCSS('font-weight', '700')
  await expect(header(page)).toHaveCSS('border-bottom-width', '0px')
})

test('UI-1#1: the cart shows how many NFTs it holds', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(header(page).getByRole('link', { name: 'Carrinho, 2 itens' })).toContainText('2')
})

test('UI-1#1 CAT-1#1: the search icon opens the field, which filters the catalog and closes with Escape', async ({ page }) => {
  await page.goto('/')
  await expect(header(page).getByRole('searchbox')).toHaveCount(0)
  const field = await searchField(page)
  await expect(field).toBeFocused()
  await field.fill('ape')
  await expect(page).toHaveURL(/q=ape/)
  await page.keyboard.press('Escape')
  await expect(header(page).getByRole('searchbox')).toHaveCount(0)
})

test('UI-4#1: Mercado goes to the catalog, and the items that open nothing yet answer the click with one visible "em breve"', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, 'The header nav is the desktop one; the phone has the tab bar')
  const nav = page.getByRole('navigation', { name: 'Principal' })

  // From another screen it lands on the catalog section of the home.
  await page.goto('/nfts/nft-004')
  await nav.getByRole('link', { name: 'Mercado' }).click()
  await expect(page).toHaveURL(/\/#catalogo$/)
  await expect(page.getByRole('region', { name: 'Catálogo' })).toBeInViewport()

  // On the home it scrolls down to the catalog instead of doing nothing.
  await page.evaluate(() => window.scrollTo(0, 0))
  await nav.getByRole('link', { name: 'Mercado' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300)

  for (const item of ['Criadores', 'Aprenda']) {
    await expect(nav.getByRole('button', { name: item })).toHaveAccessibleDescription('Em breve') // announced before the click
    await nav.getByRole('button', { name: item }).click()
    await expect(nav.getByRole('status')).toHaveText(`${item}: em breve`)
    await expect(nav.getByRole('status')).toHaveCount(1) // the previous answer is gone
  }
})
