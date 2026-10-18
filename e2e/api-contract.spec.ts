import { expect, test, type Page } from '@playwright/test'
import { ANA } from './support'

// The REST contract of ARCHITECTURE.md §2, one request per row, through the same service worker the app uses.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, 'The API does not depend on the viewport; the desktop project runs it once')

type Reply = { status: number; body: any; headers: Record<string, string> } // eslint-disable-line @typescript-eslint/no-explicit-any

async function boot(page: Page, query = '') {
  await page.goto(`/${query}`)
  await page.waitForFunction('!!window.__mock && !!navigator.serviceWorker.controller')
}

const send = (page: Page, method: string, path: string, opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
  page.evaluate(
    async ([m, p, o]) => {
      const res = await fetch(p, {
        method: m,
        headers: { 'Content-Type': 'application/json', ...(o.token ? { Authorization: `Bearer ${o.token}` } : {}), ...o.headers },
        body: o.body === undefined ? undefined : JSON.stringify(o.body),
      })
      const text = await res.text()
      return { status: res.status, body: text ? JSON.parse(text) : null, headers: Object.fromEntries(res.headers.entries()) }
    },
    [method, path, opts] as const,
  ) as Promise<Reply>

async function login(page: Page) {
  const { body } = await send(page, 'POST', '/api/auth/login', { body: { email: ANA.email, password: ANA.password } })
  return body.session.token as string
}

test('API-12#1: every resource of the contract answers with its documented success status', async ({ page }) => {
  await boot(page)
  const token = await login(page)
  const call = async (method: string, path: string, status: number, body?: unknown, headers?: Record<string, string>) => {
    const reply = await send(page, method, path, { token, body, headers })
    expect(reply.status, `${method} ${path}`).toBe(status)
    return reply.body
  }

  await call('GET', '/api/auth/session', 200)
  expect((await send(page, 'GET', '/api/nfts')).status).toBe(200)
  const nft = (await send(page, 'GET', '/api/nfts/nft-004')).body
  const edition = nft.editions.find((e: { available: number }) => e.available >= 2).id as string

  await call('GET', '/api/favorites', 200)
  await call('PUT', '/api/favorites/nft-004', 204)
  await call('DELETE', '/api/favorites/nft-004', 204)

  await call('GET', '/api/cart', 200)
  await call('POST', '/api/cart/items', 200, { nftId: 'nft-004', editionId: edition, quantity: 1 })
  await call('PUT', `/api/cart/items/nft-004/${edition}`, 200, { quantity: 2 })
  await call('POST', '/api/cart/merge', 200, { mergeId: 'contract-merge', items: [] })

  const quote = await call('POST', '/api/quotes', 200, {})
  const state = await call('GET', `/api/quotes/${quote.id}`, 200)
  expect(state.status).toBe('valid')

  const wallets = await call('GET', '/api/wallets', 200)
  const input = { ...wallets.primary }
  delete input.id
  delete input.version
  await call('PUT', '/api/wallets/primary', 200, input)
  await call('PUT', '/api/wallets/secondary', 200, { ...input, address: wallets.primary.address.replace(/.$/, wallets.primary.address.endsWith('1') ? '2' : '1') })
  await call('POST', '/api/wallet-connections', 200, { provider: 'metamask' })

  const profile = await call('GET', '/api/profile', 200)
  await call('PATCH', '/api/profile', 200, { displayName: profile.displayName })
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  await call('PUT', '/api/profile/avatar', 200, { dataUrl: png })
  await call('DELETE', '/api/profile/avatar', 200)
  await call('POST', '/api/profile/password', 204, { currentPassword: ANA.password, newPassword: 'Colecionar#2099', confirmNewPassword: 'Colecionar#2099' })

  const order = await call('POST', '/api/orders', 201, { quoteId: quote.id, wallet: { walletId: wallets.primary.id }, provider: 'metamask' }, { 'Idempotency-Key': 'contract-1' })
  const again = await send(page, 'POST', '/api/orders', { token, body: { quoteId: quote.id, wallet: { walletId: wallets.primary.id }, provider: 'metamask' }, headers: { 'Idempotency-Key': 'contract-1' } })
  expect(again.status).toBe(200)
  expect(again.headers['idempotent-replayed']).toBe('true')
  await call('GET', `/api/orders/${order.id}`, 200)
  await call('GET', '/api/orders?status=pending', 200)
  await call('DELETE', `/api/cart/items/nft-004/${edition}`, 200)

  const signup = await send(page, 'POST', '/api/auth/signup', { body: { username: 'contrato', email: 'contrato@kurio.test', password: 'Colecionar#3000', confirmPassword: 'Colecionar#3000' } })
  expect(signup.status).toBe(201)
  expect((await send(page, 'POST', '/api/auth/logout', { token })).status).toBe(204)
})

test('API-13#1: each error of the contract is returned with its code, by a request or by a scenario', async ({ page }) => {
  await boot(page)
  const token = await login(page)
  const expectError = async (reply: Promise<Reply>, status: number, code: string) => {
    const r = await reply
    expect(r.status).toBe(status)
    expect(r.body.code).toBe(code)
    return r.body
  }

  const invalid = await expectError(send(page, 'POST', '/api/auth/login', { body: {} }), 422, 'validation')
  expect(Object.keys(invalid.fields).length).toBeGreaterThan(0)
  await expectError(send(page, 'GET', '/api/cart'), 401, 'unauthenticated')
  await expectError(send(page, 'GET', '/api/nfts/nao-existe'), 404, 'not_found')
  const nft = (await send(page, 'GET', '/api/nfts/nft-004')).body
  const conflict = await expectError(
    send(page, 'POST', '/api/cart/items', { token, body: { nftId: 'nft-004', editionId: nft.editions[0].id, quantity: 9999 } }),
    409,
    'availability_conflict',
  )
  expect(conflict.details.available).toBeGreaterThanOrEqual(0)

  for (const [scenario, status, code, path] of [
    ['session-expired', 401, 'session_expired', '/api/profile'],
    ['unauthorized', 403, 'forbidden', '/api/profile'],
    ['http-5xx', 503, 'transient', '/api/nfts'],
  ] as const) {
    await page.evaluate((s) => (window as unknown as { __mock: { setScenario(n: string): void } }).__mock.setScenario(s), scenario)
    await expectError(send(page, 'GET', path, { token }), status, code)
  }
})
