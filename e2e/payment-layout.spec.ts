import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// The payment frames differ on purpose (D-04): desktop is a form and a summary, mobile is wallet cards and a total.
const desktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768

async function toPayment(page: Page) {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
}

test('UI-1#1 CHK-1#2: the desktop payment is the collector form beside the order summary, and the note travels with the order', async ({ page }) => {
  test.skip(!desktop(page), 'Desktop frame')
  const bodies: string[] = []
  page.on('request', (r) => r.method() === 'POST' && new URL(r.url()).pathname === '/api/orders' && bodies.push(r.postData() ?? ''))
  await toPayment(page)

  await expect(page.getByRole('navigation', { name: 'Você está em' })).toHaveText('Início / Mercado / Pagamento')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  for (const label of ['Nome de exibição', 'Rede', 'Endereço da carteira', 'Tipo de carteira', 'E-mail', 'Nome do perfil', 'Código de indicação', 'Nome ENS']) {
    await expect(page.getByLabel(label, { exact: false }).first()).toBeVisible()
  }
  const summary = page.getByRole('complementary', { name: 'Resumo do pedido' })
  await expect(summary.getByText('ID do token: #0412')).toBeVisible()
  await expect(summary.getByRole('link', { name: 'Aplique aqui' })).toHaveAttribute('href', '/carrinho')

  await page.getByLabel('Observação do colecionador (opcional)').fill('Entregar na carteira principal.')
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('dialog', { name: 'Revise seu pedido' }).getByText('Observação: Entregar na carteira principal.')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_/)
  expect(JSON.parse(bodies[0]!).note).toBe('Entregar na carteira principal.')
})

test('UI-1#1: the mobile payment is the wallet cards, the wallet apps and the total, with no form and no item list', async ({ page }) => {
  test.skip(desktop(page), 'Mobile frame')
  await toPayment(page)

  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trocar carteira' })).toHaveAttribute('href', '/carteiras')
  await expect(page.getByRole('radio', { name: /Principal/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /WalletConnect|MetaMask|Coinbase/ })).toHaveCount(3)
  await expect(page.getByRole('radiogroup', { name: 'Carteira e rede' }).locator('label')).toHaveText([/WalletConnect/, /MetaMask/, /Coinbase Wallet/])
  await expect(page.getByText('Total:')).toBeVisible()
  await expect(page.getByText('Seus NFTs')).toHaveCount(0)
  await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveCount(0)
})
