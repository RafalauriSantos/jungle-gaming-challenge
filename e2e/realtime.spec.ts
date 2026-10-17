import { expect, test, type Page } from '@playwright/test'

// The mock backend's control surface, exposed by the mock entry (never by app code).
type MockControl = {
  connections: () => number
  updateNft: (id: string, patch: { price?: string; available?: number }) => void
}
const mock = <T,>(page: Page, run: (m: MockControl) => T) =>
  page.evaluate(`(${run.toString()})(window.__mock)`) as Promise<T>

test('MOCK-7#1: an event sent by the mock reaches the app through socket.io-client', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('a[href="/nfts/nft-001"]')
  await expect(card).toBeVisible()
  await expect.poll(() => mock(page, (m) => m.connections())).toBe(1)

  await mock(page, (m) => m.updateNft('nft-001', { price: '9.99' }))
  await expect(card).toContainText('9.99 ETH')
})
