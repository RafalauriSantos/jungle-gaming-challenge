import { expect, test, type Page } from '@playwright/test'
import { ANA, signIn } from './support'

// nft-004 "Cosmic Bloom #412" (Ethereum, 1.61): tiers 1/1 (1 left), 1/10 (9), 1/50 (21).
// nft-001 "Emerald Ape #001" is sold out in every tier. nft-003 "Neon Vessel #275" is on Polygon.
async function mock(page: Page, expr: string) {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`)
}

const api = (page: Page, path: string, init: { method?: string; body?: unknown } = {}) =>
  page.evaluate(
    async ([p, i]) => {
      const token = (JSON.parse(localStorage.getItem('kurio.session')!) as { session: { token: string } }).session.token
      const res = await fetch(`/api${p}`, { method: i.method ?? 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: i.body ? JSON.stringify(i.body) : undefined })
      return { status: res.status, body: await res.json().catch(() => null) }
    },
    [path, init] as const,
  )

test('DET-1#1 DET-1#2: a detail opens by URL and a missing one says so', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #001' })).toBeVisible()
  await page.goto('/nfts/nope')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('DET-2#1 DET-2#2: each edition shows its status, and choosing one shows its stock', async ({ page }) => {
  await page.goto('/nfts/nft-004')
  await expect(page.getByRole('radio', { name: 'Edição 1/1', exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Edição 1/10' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Edição 1/50' })).toBeVisible()
  await expect(page.getByText('ABERTA', { exact: true })).toBeVisible()
  await expect(page.getByText('Restam 1 de 1.')).toBeVisible()
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await expect(page.getByText('Restam 9 de 10.')).toBeVisible()
  await expect(page.getByText('#0412')).toBeVisible()
})

test('DET-3#1: a sold-out edition is marked and cannot be bought', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('radio', { name: 'Edição 1/10, esgotada' })).toBeVisible()
  await expect(page.getByText('ESGOTADA', { exact: true })).toBeVisible()
  await expect(page.getByText('Esta edição está esgotada.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'COMPRAR' })).toBeDisabled()
})

test('DET-4#1 DET-4#2 DET-4#3: the quantity stops at the stock and the server refuses more', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled() // at 1
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled() // tier 1/1 has one
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled()
  const refused = await api(page, '/cart/items', { method: 'POST', body: { nftId: 'nft-004', editionId: 'nft-004:1-1', quantity: 2 } })
  expect(refused).toMatchObject({ status: 409, body: { code: 'availability_conflict', details: { available: 1 } } })
})

test('CART-2#1 CART-4#2 CART-4#3: invalid and expired codes say why and give no discount; removing a code restores the total', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  const summary = page.getByRole('region', { name: 'Resumo da carteira' })
  await expect(summary.getByText('3.236 ETH')).toBeVisible()

  // An empty field answers the click too, instead of doing nothing.
  await summary.getByRole('button', { name: 'Aplicar' }).click()
  await expect(summary.getByRole('alert').filter({ hasText: 'Digite o código promocional.' })).toBeVisible()
  await summary.getByRole('textbox', { name: 'Código promocional' }).fill('x')
  await expect(summary.getByText('Digite o código promocional.')).toHaveCount(0)

  for (const [code, message] of [['NOPE', 'Código promocional inválido.'], ['EXPIRADO', 'Este código promocional expirou.']] as const) {
    await summary.getByRole('textbox', { name: 'Código promocional' }).fill(code)
    await summary.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary.getByRole('alert').filter({ hasText: message })).toBeVisible()
    await expect(summary.getByText('3.236 ETH')).toBeVisible() // no discount
    await summary.getByRole('button', { name: 'Remover código' }).click()
  }
  await summary.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
  await summary.getByRole('button', { name: 'Aplicar' }).click()
  await expect(summary.getByText('2.914 ETH')).toBeVisible()
  await summary.getByRole('button', { name: 'Remover código' }).click()
  await expect(summary.getByText('3.236 ETH')).toBeVisible()

  // The cart is on the server: it is still there after a reload.
  await page.reload()
  await expect(page.getByText('Cosmic Bloom #412')).toBeVisible()
})

test('CART-7#1: an NFT of another network shows the conflict and offers to empty the cart', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL('/carrinho')

  await page.goto('/nfts/nft-003')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'outra rede' })).toBeVisible()
  await page.getByRole('button', { name: 'Esvaziar carrinho e adicionar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado ao carrinho.' })).toBeVisible()
  await page.goto('/carrinho')
  const items = page.getByLabel('Itens do carrinho', { exact: true })
  await expect(items.getByText('Neon Vessel #275')).toBeVisible()
  await expect(items.getByText('Cosmic Bloom #412')).toHaveCount(0)
})

async function toPayment(page: Page) {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
}

test('CHK-1#1: fields of a one-off wallet are validated before the review', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, 'The one-off wallet is drawn on the desktop frame only (D-04)')
  await toPayment(page)
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).check()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Campo obrigatório.').first()).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Revise seu pedido' })).toHaveCount(0)
})

test('CHK-2#1 CHK-2#2 CHK-2#3: only same-network wallets can be picked; a refusal can be retried; disconnecting returns to the choice', async ({ page }) => {
  await toPayment(page)
  // Ana's secondary wallet is on Polygon and the cart is on Ethereum. Desktop picks from a list, mobile from cards (D-04).
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    await page.getByRole('combobox', { name: 'Carteira salva' }).click()
    await expect(page.getByRole('option', { name: /Reserva/ })).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByRole('option', { name: /Principal/ })).not.toHaveAttribute('aria-disabled', 'true')
    await page.keyboard.press('Escape')
  } else {
    await expect(page.getByRole('radio', { name: /Reserva/ })).toBeDisabled()
    await expect(page.getByRole('radio', { name: /Principal/ })).toBeEnabled()
  }

  await mock(page, "setScenario('wallet-refused')")
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada' })).toBeVisible()

  await mock(page, "setScenario('success')")
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()

  await page.getByRole('button', { name: 'Desconectar' }).click()
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeDisabled() // no provider chosen again yet
  await expect(page.getByRole('radio', { name: 'MetaMask' })).not.toBeChecked()
})

test('MOCK-S11#1 MOCK-S12#1: the coupon scenarios make every code invalid or expired', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  const summary = page.getByRole('region', { name: 'Resumo da carteira' })
  for (const [scenario, message] of [['coupon-invalid', 'Código promocional inválido.'], ['coupon-expired', 'Este código promocional expirou.']] as const) {
    await mock(page, `setScenario('${scenario}')`)
    await summary.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
    await summary.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary.getByRole('alert').filter({ hasText: message })).toBeVisible()
    await summary.getByRole('button', { name: 'Remover código' }).click()
  }
})

test('RT-1#1 API-6#1: one price event changes the catalog, the detail and the cart without a reload', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByRole('region', { name: 'Resumo da carteira' }).getByText('1.61 ETH')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Resumo da carteira' }).getByText('1.626 ETH')).toBeVisible() // 1.61 + the fee

  await mock(page, "updateNft('nft-004', { price: '2' })")
  await expect(page.getByRole('region', { name: 'Resumo da carteira' }).getByText('2.016 ETH')).toBeVisible() // 2 + the fee

  // Same page session, other screens: the detail and the catalog already carry the new price.
  await page.getByRole('link', { name: 'Continuar explorando' }).click()
  await expect(page.locator('a[href="/nfts/nft-004"]').first()).toContainText('2.00 ETH')
  await page.locator('a[href="/nfts/nft-004"]').first().click()
  await expect(page.getByText('2.00 ETH').first()).toBeVisible()
  await mock(page, "updateNft('nft-004', { price: '2.5' })")
  await expect(page.getByText('2.50 ETH').first()).toBeVisible()
})

test('AUTH-12#1 AUTH-12#2 AUTH-12#3: another user cannot read an order, whatever the page does', async ({ page }) => {
  // Ana buys; Bruno then asks for her order.
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)

  await page.evaluate(() => localStorage.removeItem('kurio.session'))
  await signIn(page, { email: 'bruno@kurio.test', password: 'Colecionar#2027', username: 'bruno' })

  // The API refuses, with the page guard out of the way.
  expect(await api(page, '/orders/ord_000001')).toMatchObject({ status: 403, body: { code: 'forbidden' } })
  // Bruno's own data is his: an empty cart and no wallets, while Ana's exist.
  expect((await api(page, '/cart')).body).toMatchObject({ items: [] })
  expect((await api(page, '/wallets')).body).toEqual({ primary: null, secondary: null })
  // And the page says so.
  await page.goto('/pedido/ord_000001')
  await expect(page.getByRole('heading', { name: 'Você não tem acesso a este pedido' })).toBeVisible()
})

async function visitorBuys(page: Page, nftId: string, tier = 'Edição 1/10') {
  await page.goto(`/nfts/${nftId}`)
  await page.getByRole('radio', { name: tier }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho/)
}
const SIGN_IN = '/entrar?redirect=/carrinho'

test('CART-3#1: items a visitor adds appear in the cart after signing in', async ({ page }) => {
  await visitorBuys(page, 'nft-004')
  await signIn(page, ANA, SIGN_IN)
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByLabel('Itens do carrinho', { exact: true }).getByText('Cosmic Bloom #412')).toBeVisible()
})

test('CART-3#2: the visitor cart is handed over once and is gone after that', async ({ page }) => {
  await visitorBuys(page, 'nft-004')
  await signIn(page, ANA, SIGN_IN)
  await expect(page.getByLabel('Itens do carrinho', { exact: true }).getByText('Cosmic Bloom #412')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('kurio.visitor.cart'))).toBeNull()
  await page.reload()
  await expect(page.getByLabel('Itens do carrinho', { exact: true }).getByText('Cosmic Bloom #412')).toHaveCount(1)
  await expect(page.getByRole('main').getByText('Total da linha')).toHaveCount(1)
})

test('CART-3#3: another user who signs in does not receive a cart someone else claimed', async ({ page }) => {
  await visitorBuys(page, 'nft-004')
  await page.evaluate(() => {
    const cart = JSON.parse(localStorage.getItem('kurio.visitor.cart')!)
    localStorage.setItem('kurio.visitor.cart', JSON.stringify({ ...cart, claimedBy: 'u_ana' }))
  })
  await signIn(page, { email: 'bruno@kurio.test', password: 'Colecionar#2027', username: 'bruno' }, SIGN_IN)
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('CART-3#4: a visitor line from another network is skipped and listed', async ({ page }) => {
  await visitorBuys(page, 'nft-004')
  await visitorBuys(page, 'nft-003')
  await signIn(page, ANA, SIGN_IN)
  await expect(page.getByLabel('Itens do carrinho', { exact: true }).getByText('Cosmic Bloom #412')).toBeVisible()
  await expect(page.getByLabel('Itens do carrinho', { exact: true }).getByText('Neon Vessel #275')).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: 'é de outra rede' })).toContainText('Neon Vessel')
})
