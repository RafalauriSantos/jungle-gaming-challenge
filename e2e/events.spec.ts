import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// nft-004 "Cosmic Bloom #412" (Ethereum, 1.61). Ana's principal wallet is on Ethereum.
async function mock<T = unknown>(page: Page, expr: string): Promise<T> {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`) as Promise<T>
}

async function toCart(page: Page) {
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL('/carrinho')
}

async function toReview(page: Page) {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
}

const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' })

test('RT-4#1 RT-4#2 CART-6#1 CART-6#2: a duplicate event changes nothing and an old one does not undo a newer state', async ({ page }) => {
  await signIn(page)
  await toCart(page)
  await expect(summary(page).getByText('1.626 ETH')).toBeVisible() // the price the user has seen
  await mock(page, "updateNft('nft-004', { price: '2' })")
  await expect(summary(page).getByText('2.016 ETH')).toBeVisible()
  const notice = page.getByRole('main').getByRole('status').filter({ hasText: 'mudou' })
  await expect(notice).toHaveCount(1)
  // The live region is written 50 ms after the visible notice (see `announce`). Wait for the first message to land,
  // or a slow runner starts counting before it and sees it twice.
  await expect(page.getByTestId('announcer')).toContainText('2.00 ETH')
  // From here on, count every message the app announces to assistive technology.
  await page.evaluate(() => {
    const w = window as unknown as { __announced: string[] }
    w.__announced = []
    new MutationObserver(() => {
      const text = document.querySelector('[data-testid=announcer]')!.textContent
      if (text) w.__announced.push(text)
    }).observe(document.querySelector('[data-testid=announcer]')!, { childList: true, characterData: true, subtree: true })
  })

  const last = (await mock<string[]>(page, 'sentEvents()')).at(-1)!
  await mock(page, `resend('${last}')`) // a duplicate
  await mock(page, "emitOldNft('nft-004')") // version 1, long superseded
  // Events arrive in order, so once this newer one shows, the two before it have been handled.
  await mock(page, "updateNft('nft-004', { price: '2.5' })")
  await expect(summary(page).getByText('2.516 ETH')).toBeVisible()
  await expect(summary(page).getByText('1.626 ETH')).toHaveCount(0) // the old snapshot did not come back
  await expect(notice).toHaveCount(1)
  // Only the genuine change was announced: the duplicate and the old event said nothing.
  const announced = await page.evaluate(() => (window as unknown as { __announced: string[] }).__announced)
  expect(announced).toHaveLength(1)
  expect(announced[0]).toContain('2.50 ETH')
})

test('RT-5#1 RT-9#1: after a dropped connection the page catches up, and a pending order ends in one purchase', async ({ page }) => {
  await signIn(page)
  await page.goto('/')
  await mock(page, 'setSettleDelay(5000)')
  await toCart(page)
  await toReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  await expect(page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' })).toBeVisible()

  // The connection drops; while it is down the order falls due (the mock clock moves, no event can arrive).
  await mock(page, 'dropConnections()')
  await mock(page, 'advance(6000)')
  // The reconnect reads the order again: the receipt appears without a reload and without a second purchase.
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 8000 })
  expect(await mock<number>(page, 'orders()')).toBe(1)
})

test('RT-5#2 ORD-10#1 ORD-10#3: a confirmed order is not undone by a late pending or refused event', async ({ page }) => {
  await signIn(page)
  await toCart(page)
  await toReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 6000 })

  // Each event makes the page read the order again; waiting for that read means the event was handled.
  for (const status of ['pending', 'refused']) {
    const read = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/orders/ord_000001')
    await mock(page, `emitOrder('ord_000001', '${status}', 99)`) // a newer version, but an older status
    await read
  }
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await expect(page.getByText('Pagamento recusado')).toHaveCount(0)
})

test('MOCK-S13#1 CHK-4#1 CHK-4#2: a price that changes between the review and the click creates no order until the new total is confirmed', async ({ page }) => {
  await signIn(page)
  await toCart(page)
  await toReview(page)
  await mock(page, "setScenario('price-changed')")
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'A cotação mudou' })).toBeVisible()
  expect(await mock<number>(page, 'orders()')).toBe(0)
  await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled()

  await page.getByRole('button', { name: 'Confirmar nova cotação' }).click()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('dialog', { name: 'Revise seu pedido' }).getByText('1.726 ETH')).toBeVisible() // 1.71 + the fee
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  expect(await mock<number>(page, 'orders()')).toBe(1)
})

test('MOCK-S14#1: an edition that sells out between the review and the click blocks the checkout', async ({ page }) => {
  await signIn(page)
  await toCart(page)
  await toReview(page)
  await mock(page, "setScenario('sold-out')")
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'Estoque insuficiente' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled()
  expect(await mock<number>(page, 'orders()')).toBe(0)
})
