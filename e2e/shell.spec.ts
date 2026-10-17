import { expect, test } from '@playwright/test'
import { searchField, signIn } from './support'

// The desktop header of the Figma: one nav item marked per screen group, the divider only on the "Início" group,
// the cart count, and a search that opens from its icon. The mobile layout has no header (tab bar instead).
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'The header exists from tablet width up'))

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
