import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// The cart frames differ on purpose: desktop is a table with a side summary and suggestions, mobile is item cards over a summary sheet.
const desktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768

async function withOneItem(page: Page) {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL('/carrinho')
}

test('UI-1#1: the desktop cart is the table, the wallet summary and the collectors-also-saw suggestions', async ({ page }) => {
  test.skip(!desktop(page), 'Desktop frame')
  await withOneItem(page)

  await expect(page.getByRole('navigation', { name: 'Você está em' })).toHaveText('Início / Mercado / Carrinho')
  const items = page.getByLabel('Itens do carrinho', { exact: true })
  await expect(items.getByText('ID do token: #0412')).toBeVisible()
  await expect(items.getByText('Edição: 1/10')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resumo da carteira' })).toBeVisible()
  await expect(page.getByLabel('Código promocional')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Continuar explorando' })).toHaveAttribute('href', '/')

  const related = page.getByRole('region', { name: 'Colecionadores também viram' })
  await expect(related.getByRole('link')).toHaveCount(5)
  await expect(related.getByText('Cosmic Bloom #412')).toHaveCount(0) // what is in the cart is not suggested
  const first = await related.getByRole('link').first().textContent()
  await related.getByRole('button', { name: /página 2 de 2/ }).click()
  expect(await related.getByRole('link').first().textContent()).not.toBe(first)
})

test('UI-1#1: the mobile cart is item cards over a summary sheet, without the token id or suggestions', async ({ page }) => {
  test.skip(desktop(page), 'Mobile frame')
  await withOneItem(page)

  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  const items = page.getByLabel('Itens do carrinho', { exact: true })
  await expect(items.getByText('Edição: 1/10')).toBeVisible()
  await expect(items.getByText('ID do token')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Colecionadores também viram' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toBeVisible()
})
