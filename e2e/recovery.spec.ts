import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// nft-004 "Cosmic Bloom #412" on Ethereum; Ana's principal wallet is on Ethereum too.
async function mock<T = unknown>(page: Page, expr: string): Promise<T> {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`) as Promise<T>
}

async function placeOrder(page: Page) {
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
}

test('ORD-9#1 ORD-9#2 ORD-9#3 ORD-9#4 MOCK-S15#1 API-9#1: a lost answer is recovered with the same key, and one order exists', async ({ page }) => {
  await signIn(page)
  await page.goto('/?scenario=order-timeout')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  await placeOrder(page)

  // The order was created, the answer was lost, and the page is checking instead of offering a new try.
  await expect(page.getByText(/Verificando seu pedido/)).toBeVisible()
  expect(await mock<number>(page, 'orders()')).toBe(1)

  // The resend carries the same key and returns that order.
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/, { timeout: 8000 })
  expect(await mock<number>(page, 'orders()')).toBe(1)
})

test('ORD-2#2 ORD-2#3 ORD-2#4: a pending order is found again, even without local data, and never leads to a second one', async ({ page }) => {
  await page.clock.install()
  await signIn(page)
  await page.goto('/')
  await mock(page, 'setSettleDelay(600000)') // keeps the order pending
  await placeOrder(page)
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  await expect(page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' })).toBeVisible()

  // Going to payment again opens that order.
  await page.goto('/pagamento')
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  expect(await mock<number>(page, 'orders()')).toBe(1)

  // With everything the browser stored about the attempt gone, the server still knows.
  await page.evaluate(() => {
    localStorage.removeItem('kurio.u_ana.attempt')
    sessionStorage.clear()
  })
  await page.goto('/pagamento')
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)

  // After a minute without an answer the page says so and offers a refresh, nothing that buys again.
  // The minute is counted by the page, so the page must be on screen, and counting, before the clock moves.
  await expect(page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' })).toBeVisible()
  await page.clock.fastForward(61_000)
  await expect(page.getByText('Ainda estamos processando.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Atualizar' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Confirmar compra|Enviar pedido|Tentar novamente/ })).toHaveCount(0)
  expect(await mock<number>(page, 'orders()')).toBe(1)
})
