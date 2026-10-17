import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

const BRUNO = { email: 'bruno@kurio.test', password: 'Colecionar#2027', username: 'bruno' }

async function mock(page: Page, expr: string) {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`)
}

const heart = (page: Page) => page.getByRole('button', { name: /^Favorit/ }).first()
const announcer = (page: Page) => page.getByTestId('announcer')

test('FAV-1#1 A11Y-6#1: a favorite survives a reload and the favorites page lists it, and another user does not see it', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await heart(page).click()
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(announcer(page)).toHaveText('Adicionado aos favoritos.')

  await page.reload()
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/favoritos')
  await expect(page.getByTestId('nft-card')).toHaveCount(1)

  await page.evaluate(() => localStorage.removeItem('kurio.session'))
  await signIn(page, BRUNO)
  await page.goto('/favoritos')
  await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
})

test('FAV-1#1: removing a favorite empties it for good', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await heart(page).click()
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true')
  await heart(page).click()
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false')
})

test('FAV-2#1 API-10#1: the heart changes before the server answers', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false')
  await mock(page, "setScenario('slow')")
  await heart(page).click()
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true')
})

test('FAV-2#2 API-10#1: on a server error the heart goes back and the failure is announced', async ({ page }) => {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false')
  await mock(page, "setScenario('http-5xx')")
  await heart(page).click()
  await expect(announcer(page)).toHaveText('Não foi possível favoritar. Tente novamente.')
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false')
})

test('FAV-1#1: a visitor who taps the heart is sent to sign in and returns to the NFT', async ({ page }) => {
  await page.goto('/nfts/nft-004')
  await heart(page).click()
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fnfts%2Fnft-004/)
})
