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
