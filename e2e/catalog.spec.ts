import { expect, test } from '@playwright/test'

test('CAT-1#2 CAT-1#3 CAT-2#2: filters, sort and pagination live in the URL and survive history', async ({ page }) => {
  await page.goto('/')
  const cards = page.getByTestId('nft-card')
  await expect(cards).toHaveCount(9)

  await page.getByText('Todos os NFTs').click()
  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)

  // Filter via the sidebar (desktop) or the sheet (mobile).
  const filterButton = page.getByRole('button', { name: 'Abrir filtros' })
  const compact = await filterButton.isVisible()
  if (compact) await filterButton.click()
  const filters = compact ? page.getByRole('dialog') : page.getByRole('complementary', { name: 'Filtros' })
  await filters.locator('label', { hasText: 'Música' }).click()
  await expect(page).toHaveURL(/collection=/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(cards).toHaveCount(6)
  if (compact) await page.keyboard.press('Escape')

  await page.getByLabel('Ordenar por:').selectOption('price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)

  await page.reload()
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('price-desc')
  await page.goBack()
  await expect(page).not.toHaveURL(/sort=/)
})

test('CAT-4#1: empty result offers to clear filters', async ({ page }) => {
  await page.goto('/?q=zzz-nada')
  await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('CAT-1#4: invalid URL params are ignored', async ({ page }) => {
  await page.goto('/?sort=hack&collection=nope&page=-3')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('CAT-1#1: search, collection, sort and page each write their own URL parameter', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)

  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).first().fill('ape')
  await expect(page).toHaveURL(/q=ape/)
  await expect(page.getByTestId('nft-card')).toHaveCount(6)
  await expect(page.getByTestId('nft-card').first()).toContainText('Ape')

  await page.getByLabel('Ordenar por:').selectOption('name')
  await expect(page).toHaveURL(/sort=name/)
  await page.goto('/?q=ape&page=2')
  await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()
  await expect(page).toHaveURL(/page=2/)
})

test('CAT-2#1: collection and network filters combine and narrow the result', async ({ page }) => {
  await page.goto('/')
  const compact = page.viewportSize()!.width < 1024 // the filters live in a drawer below this width
  if (compact) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const filters = compact ? page.getByRole('dialog') : page.getByRole('complementary', { name: 'Filtros' })
  await filters.locator('label', { hasText: 'Música' }).click()
  await expect(page.getByTestId('nft-card')).toHaveCount(6)
  await filters.locator('label', { hasText: 'Ethereum' }).click()
  await expect(page).toHaveURL(/network=/)
  await expect(page.getByTestId('nft-card')).toHaveCount(2)
})

test('CAT-6#1 CAT-6#2: the home page shows the hero, nine NFTs and the sort control, and a card opens its detail', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /^SEJA DONO/ })).toBeVisible()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(page.getByLabel('Ordenar por:')).toBeVisible()
  if (page.viewportSize()!.width >= 1024) await expect(page.getByRole('complementary', { name: 'Filtros' })).toBeVisible()
  const first = page.getByTestId('nft-card').first().getByRole('link')
  const href = await first.getAttribute('href')
  await first.click()
  await expect(page).toHaveURL(href!)
})
