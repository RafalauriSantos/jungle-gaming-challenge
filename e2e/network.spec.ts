import { expect, test, type Page } from '@playwright/test'
import { searchField, signIn } from './support'

async function mock<T = unknown>(page: Page, expr: string): Promise<T> {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`) as Promise<T>
}

const cards = (page: Page) => page.getByTestId('nft-card')

test('MOCK-S02#1: an empty result is shown as such', async ({ page }) => {
  await page.goto('/?scenario=empty')
  await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()
  await expect(cards(page)).toHaveCount(0)
})

test('MOCK-S03#1 MOCK-4#1 UI-3#1 UI-3#2: slow loading shows skeletons of the content size, with no layout shift, and is the same on every run', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number }
    w.__cls = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('/?scenario=slow')
  const skeletons = page.getByRole('list', { name: 'Carregando NFTs' })
  await expect(skeletons).toBeVisible()
  const placeholder = await skeletons.locator('li').first().boundingBox()

  await expect(cards(page).first()).toBeVisible({ timeout: 10_000 })
  const loaded = await cards(page).first().boundingBox()
  expect(Math.abs(placeholder!.height - loaded!.height)).toBeLessThanOrEqual(2) // the same height
  expect(Math.abs(placeholder!.width - loaded!.width)).toBeLessThanOrEqual(2)
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.02)

  // The same scenario applies the same delays, in the same order, after a reset.
  const first = await mock<number[]>(page, 'latencies()')
  await page.goto('/?reset=1&scenario=slow')
  await expect(cards(page).first()).toBeVisible({ timeout: 10_000 })
  const second = await mock<number[]>(page, 'latencies()')
  expect(first.length).toBeGreaterThan(0)
  expect(second.slice(0, first.length)).toEqual(first)
})

test('UI-3#3: the shimmer stops when the user prefers reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?scenario=slow')
  const bar = page.getByRole('list', { name: 'Carregando NFTs' }).locator('.skeleton').first()
  await expect(bar).toBeVisible()
  expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
})

test('MOCK-S04#1 CAT-5#1: an older answer that arrives late never replaces the newer one', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?scenario=out-of-order')
  await expect(cards(page).first()).toBeVisible()
  const search = await searchField(page)
  await search.fill('ape') // the scenario makes this answer the slow one
  await expect(page).toHaveURL(/q=ape/)
  await search.fill('cosmic') // and this one the fast one
  await expect(page).toHaveURL(/q=cosmic/)
  await expect(cards(page).first()).toContainText('Cosmic')

  // Let the slow answer's time come: whatever it does, the page must still show the second search.
  await page.clock.fastForward(5000)
  expect(Math.max(...(await mock<number[]>(page, 'latencies()')))).toBeGreaterThan(1000)
  await expect(cards(page).filter({ hasText: 'Ape' })).toHaveCount(0)
  await expect(cards(page).first()).toContainText('Cosmic')
})

async function failsThenRecovers(page: Page, scenario: string) {
  await page.goto(`/?scenario=${scenario}`)
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs.' })
  await expect(alert).toBeVisible({ timeout: 12_000 })
  await mock(page, "setScenario('success')")
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(cards(page).first()).toBeVisible()
}

test('MOCK-S05#1 CAT-4#2: with the connection down the catalog says it failed, and recovers on retry', ({ page }) => failsThenRecovers(page, 'offline'))
test('MOCK-S06#1: with HTTP 4xx the catalog says it failed, and recovers on retry', ({ page }) => failsThenRecovers(page, 'http-4xx'))
test('MOCK-S07#1: with HTTP 5xx the catalog says it failed, and recovers on retry', ({ page }) => failsThenRecovers(page, 'http-5xx'))

test('MOCK-S09#1: a user turned away with 403 sees why', async ({ page }) => {
  await signIn(page)
  await mock(page, "setScenario('unauthorized')")
  await page.goto('/carteiras')
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar suas carteiras.' })).toBeVisible({ timeout: 8000 })
})

test('API-5#1: when the mock service worker is not in control of the page, a signed-in screen shows its failure state, not a crash', async ({ page, context }) => {
  await signIn(page)
  // The page runs but its requests reach the host, which answers every unknown path with the app's own index.html.
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBypassServiceWorker', { bypass: true })
  await page.goto('/favoritos')
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar seus favoritos.' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Algo deu errado nesta tela')).toHaveCount(0)
})

test('API-5#1: after the browser stops the idle mock service worker, the next request is served again', async ({ page, context }) => {
  await signIn(page)
  await page.goto('/')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  // A browser ends an idle worker and restarts it on the next request, with no memory of which pages it was serving.
  const cdp = await context.newCDPSession(page)
  const running = new Map<string, string>() // worker version id -> running status
  cdp.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
    for (const v of versions) running.set(v.versionId, v.runningStatus)
  })
  await cdp.send('ServiceWorker.enable')
  await expect.poll(() => [...running.values()].includes('running')).toBe(true)
  // Stop this page's worker only (not every worker of the browser), and make sure it really stopped before going on.
  for (const [versionId, status] of running) if (status === 'running') await cdp.send('ServiceWorker.stopWorker', { versionId })
  await expect.poll(() => [...running.values()].includes('running')).toBe(false)
  await cdp.detach() // an open debugging session on a worker makes it flaky to test (playwright#12103)
  await page.getByRole('link', { name: /^Carrinho/ }).first().click() // a client-side move that asks the API for the cart
  await expect(page.getByRole('heading', { name: /^Carrinho( de NFTs)?$/ }).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Algo deu errado nesta tela')).toHaveCount(0)
  await expect(page.getByText('Não foi possível')).toHaveCount(0)
})
