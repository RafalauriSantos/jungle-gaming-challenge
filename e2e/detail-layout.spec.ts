import { expect, test, type Page } from '@playwright/test'

// The detail frames differ on purpose: desktop is a gallery beside the details, with the description and more from the
// collection below; mobile is the artwork over a details sheet with a fixed buy bar.
const desktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768

test('UI-1#1 DET-2#1: the desktop detail shows the rating, the edition pills, the token lines, the share links and the description', async ({ page }) => {
  test.skip(!desktop(page), 'Desktop frame')
  await page.goto('/nfts/nft-004')
  await expect(page.getByRole('navigation', { name: 'Você está em' })).toHaveText('Início / Mercado')
  await expect(page.getByRole('heading', { level: 1, name: 'Cosmic Bloom #412' })).toBeVisible()
  await expect(page.getByText(/\d+ avaliações de colecionadores/)).toBeVisible()
  await expect(page.getByText('Sobre este NFT:')).toBeVisible()
  await expect(page.getByRole('radio', { name: /Edição/ })).toHaveCount(3)
  await expect(page.getByText('ID do token:')).toBeVisible()
  await expect(page.getByText('Coleção: Kurio Blooms')).toBeVisible()
  await expect(page.getByText('Atributos:')).toBeVisible()

  const share = page.getByText('Compartilhar este NFT:').locator('..')
  await expect(share.getByRole('link', { name: 'Compartilhar no LinkedIn' })).toHaveAttribute('href', /linkedin\.com.*nfts%2Fnft-004/)
  await expect(share.getByRole('link', { name: 'Compartilhar no E-mail' })).toHaveAttribute('href', /^mailto:\?subject=/)
  await expect(share.getByRole('link', { name: 'Compartilhar no Twitter' })).toHaveAttribute('href', /twitter\.com\/intent\/tweet/)

  const description = page.getByRole('region', { name: 'Descrição do NFT' })
  await expect(description.getByRole('heading', { name: 'Detalhes do NFT' })).toBeVisible()
  await expect(description.getByText(/Avaliações de colecionadores \(\d+\)/)).toHaveAttribute('aria-disabled', 'true')
  await expect(description.locator('p.font-bold')).toHaveText(['Rede:', 'Contrato:', 'Direitos autorais:'])
  await expect(page.getByRole('region', { name: 'Mais desta coleção' }).getByRole('link').first()).toBeVisible()
})

test('UI-1#1 DET-2#1: the mobile detail is the artwork over a details sheet, with the buy bar fixed at the bottom', async ({ page }) => {
  test.skip(desktop(page), 'Mobile frame')
  await page.goto('/nfts/nft-004')
  await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Favoritar/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Cosmic Bloom #412' })).toBeVisible()
  await expect(page.getByText(/^Nota/)).toBeVisible()
  await expect(page.getByText('Qtd.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar NFT' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Descrição do NFT' })).toHaveCount(0)
  await expect(page.getByText('Compartilhar este NFT:')).toHaveCount(0)
  const bar = await page.getByRole('button', { name: 'Comprar NFT' }).boundingBox()
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
})
