import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// nft-004 is "Cosmic Bloom #412" on Ethereum: 1.61 ETH, tier 1/10 has stock. Ana's principal wallet is on Ethereum.
const NFT = '/nfts/nft-004'
const NAME = 'Cosmic Bloom #412'

async function mock<T>(page: Page, expr: string): Promise<T> {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`) as Promise<T>
}

async function addTwoToCart(page: Page) {
  await page.goto(NFT)
  await page.getByRole('radio', { name: /Edição 1\/10/ }).click()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL('/carrinho')
}

async function payWith(page: Page, provider = 'MetaMask') {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await page.getByRole('radio', { name: provider }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(`Carteira conectada: ${provider}.`)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
}

test('ORD-3#1 ORD-3#2 ORD-3#3 ORD-6#1 ORD-6#2 RT-2#1 ED-1#1 CART-5#1 CART-4#1 CHK-1#2 MON-3#2 MOCK-2#1 MOCK-S01#1 MOCK-S16#1: a purchase from the detail to a confirmed receipt, driven by the simulation', async ({ page }) => {
  await signIn(page)
  const orderRequests: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/orders') orderRequests.push(r.postData() ?? '')
  })
  await page.goto(NFT)
  await expect(page.getByText('#0412')).toBeVisible() // the token id is the NFT number padded to 4, from here to the receipt
  await addTwoToCart(page)
  await expect(page.getByText('ID do token: #0412')).toBeVisible()

  // The quote's four values, exactly as the API computed them.
  await expect(page.getByText(NAME)).toBeVisible()
  const summary = page.getByRole('region', { name: 'Resumo da carteira' })
  await expect(summary.getByText('3.22 ETH')).toBeVisible()
  await expect(summary.getByText('0.016 ETH')).toBeVisible()
  await expect(summary.getByText('3.236 ETH')).toBeVisible()

  // A coupon lowers the total; the discount is 10% of the subtotal.
  await summary.getByLabel('Código promocional').fill('KURIO10')
  await summary.getByRole('button', { name: 'Aplicar' }).click()
  await expect(summary.getByText('Código aplicado.')).toBeVisible()
  await expect(summary.getByText('2.914 ETH')).toBeVisible()

  await payWith(page)
  // The review shows what is about to be sent: items, totals, wallet and network.
  const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(review.getByText(NAME)).toBeVisible()
  await expect(review.getByText('ID do token: #0412', { exact: false })).toBeVisible()
  await expect(review.getByText('2.914 ETH')).toBeVisible()
  await expect(review.getByText(/MetaMask · Rede Ethereum · Principal/)).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()

  // Created is not confirmed: the pending screen shows first, and no receipt.
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  await expect(page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' })).toBeVisible()
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)

  // It settles on its own and the socket tells the page, faster than the 3 s poll would.
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 2500 })
  await expect(page.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/)).toBeVisible()
  await expect(page.getByText('#0412')).toBeVisible()
  await expect(page.getByText('2.914 ETH').first()).toBeVisible()
  expect(await mock<string[]>(page, 'sentEvents()')).toContain('order.ord_000001.v2')
  await expect(page.getByRole('button', { name: 'Ver no Etherscan' })).toBeDisabled() // the explorer link is simulated, so inert

  // Only the quote, the wallet and the provider were sent: the total was computed by the API, not the page.
  expect(orderRequests).toHaveLength(1)
  expect(Object.keys(JSON.parse(orderRequests[0]!)).sort()).toEqual(['provider', 'quoteId', 'wallet'])

  // The purchase took stock from the catalog: tier 1/10 had 9, two were bought.
  await page.goto(NFT)
  await page.getByRole('radio', { name: /Edição 1\/10/ }).click()
  await expect(page.getByText('Restam 7 de 10.')).toBeVisible()

  // The purchased items left the cart.
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('ORD-3#1 ORD-4#1 ORD-11#1 MOCK-S17#1: a refused payment keeps the cart and can be tried again as a new attempt', async ({ page }) => {
  await signIn(page)
  await page.goto('/?scenario=payment-refused')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  await addTwoToCart(page)
  await payWith(page)
  await page.getByRole('button', { name: 'Enviar pedido' }).click()

  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 6000 })
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)

  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByText(NAME)).toBeVisible()

  // A new attempt: back to payment, and an order is created again (a new key, not a replay of the refusal).
  await payWith(page)
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_000002$/)
})

test('CHK-5#1 CHK-5#2: repeated clicks and a direct second call create one order', async ({ page }) => {
  await signIn(page)
  await addTwoToCart(page)
  await payWith(page)
  await page.getByRole('button', { name: 'Enviar pedido' }).click({ clickCount: 5, delay: 0 })
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  expect(await mock<number>(page, 'orders()')).toBe(1)

  // The same call made straight to the API, with the page's own key, returns the same order.
  const again = await page.evaluate(async () => {
    const token = (JSON.parse(localStorage.getItem('kurio.session')!) as { session: { token: string } }).session.token
    const attempt = JSON.parse(localStorage.getItem('kurio.u_ana.attempt')!) as { key: string }
    const first = await fetch('/api/orders/ord_000001', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    const body = JSON.stringify({ quoteId: first.quote.id, wallet: { walletId: 'wal_seed_ana_1' }, provider: 'metamask' })
    const res = await fetch('/api/orders', { method: 'POST', body, headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': attempt.key, 'Content-Type': 'application/json' } })
    return { status: res.status, id: (await res.json()).id }
  })
  expect(again).toEqual({ status: 200, id: 'ord_000001' })
  expect(await mock<number>(page, 'orders()')).toBe(1)
})

test('MOCK-9#1 CART-6#3 RT-8#1: a price change while paying blocks the checkout until the new total is confirmed', async ({ page }) => {
  await signIn(page)
  await addTwoToCart(page)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  const review = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(review).toBeEnabled()

  await mock<void>(page, "updateNft('nft-004', { price: '2' })")
  // The REST answer and the event carry the same version and value.
  const sent = (await mock<string[]>(page, 'sentEvents()')).filter((id) => id.startsWith('nft.nft-004.')).at(-1)!
  const rest = await page.evaluate(() => fetch('/api/nfts/nft-004').then((r) => r.json()))
  expect(sent).toBe(`nft.nft-004.v${rest.version}`)
  expect(rest.price).toBe('2')

  await expect(page.getByRole('alert').filter({ hasText: 'A cotação mudou' })).toBeVisible()
  await expect(review).toBeDisabled()
  await page.getByRole('button', { name: 'Confirmar nova cotação' }).click()
  await expect(review).toBeEnabled()
  await expect(page.getByText('4.016 ETH')).toBeVisible() // 2 x 2.0 + 0.016
})

test('ORD-2#1: a pending order is still there after a reload', async ({ page }) => {
  await signIn(page)
  await addTwoToCart(page)
  await payWith(page)
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Aguardando a confirmação|Seus NFTs agora estão/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 6000 })
  expect(await mock<number>(page, 'orders()')).toBe(1)
})
