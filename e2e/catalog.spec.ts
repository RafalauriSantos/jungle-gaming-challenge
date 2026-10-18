import { expect, test } from '@playwright/test'
import { chooseSort, searchField, sortControl, sortLabel } from './support'

test('CAT-1#2 CAT-1#3 CAT-2#2: filters, sort and pagination live in the URL and survive history', async ({ page }) => {
  await page.goto('/')
  const cards = page.getByTestId('nft-card')
  await expect(cards).toHaveCount(9)

  await page.getByText('Todos os NFTs').click()
  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)

  // Filter via the sidebar (desktop) or the sheet (mobile).
  const filterButton = page.getByRole('button', { name: 'Abrir filtros' })
  const compact = await filterButton.isVisible()
  if (compact) await filterButton.click()
  const filters = compact ? page.getByRole('dialog') : page.getByRole('complementary', { name: 'Filtros' })
  await filters.locator('label', { hasText: 'Música' }).click()
  await expect(page).toHaveURL(/collection=/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(cards).toHaveCount(6)
  if (compact) await page.keyboard.press('Escape')

  await chooseSort(page, 'price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)

  await page.reload()
  await expect(sortControl(page)).toContainText(sortLabel('price-desc'))
  await page.goBack()
  await expect(page).not.toHaveURL(/sort=/)
})

test('CAT-4#1: empty result offers to clear filters', async ({ page }) => {
  await page.goto('/?q=zzz-nada')
  await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('API-1#1 CAT-1#4: invalid URL params are ignored', async ({ page }) => {
  await page.goto('/?sort=hack&collection=nope&page=-3')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('CAT-1#1: search, collection, sort and page each write their own URL parameter', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)

  await (await searchField(page)).fill('ape')
  await expect(page).toHaveURL(/q=ape/)
  await expect(page.getByTestId('nft-card')).toHaveCount(6)
  await expect(page.getByTestId('nft-card').first()).toContainText('Ape')

  await chooseSort(page, 'name')
  await expect(page).toHaveURL(/sort=name/)
  await page.goto('/?q=ape&page=2')
  // The search has results; only this page is past the end. Say so, and offer the way back.
  await expect(page.getByText('Esta página não existe para a busca atual.')).toBeVisible()
  await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toHaveCount(0)
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole('button', { name: 'Ver a primeira página' }).click()
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByTestId('nft-card')).toHaveCount(6)
})

test('CAT-2#1: collection and network filters combine and narrow the result', async ({ page }) => {
  await page.goto('/')
  const compact = page.viewportSize()!.width < 1024 // the filters live in a drawer below this width
  if (compact) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const filters = compact ? page.getByRole('dialog') : page.getByRole('complementary', { name: 'Filtros' })
  await filters.locator('label', { hasText: 'Música' }).click()
  await expect(page.getByTestId('nft-card')).toHaveCount(6)
  await filters.locator('label', { hasText: 'Ethereum' }).click()
  await expect(page).toHaveURL(/network=/)
  await expect(page.getByTestId('nft-card')).toHaveCount(2)
})

test('CAT-6#1 CAT-6#2: the home page shows the hero, nine NFTs and the sort control, and a card opens its detail', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /^SEJA DONO/ })).toBeVisible()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(sortControl(page)).toBeVisible()
  if (page.viewportSize()!.width >= 1024) await expect(page.getByRole('complementary', { name: 'Filtros' })).toBeVisible()
  const first = page.getByTestId('nft-card').first().getByRole('link')
  const href = await first.getAttribute('href')
  await first.click()
  await expect(page).toHaveURL(href!)
})

test('CAT-3#1: the request carries exactly the active parameters', async ({ page }) => {
  const queries: string[] = []
  page.on('request', (r) => {
    const url = new URL(r.url())
    if (url.pathname === '/api/nfts') queries.push(url.searchParams.toString())
  })
  await page.goto('/?q=ape&network=%5B%22polygon%22%5D&sort=name&page=2')
  await expect.poll(() => queries.at(-1)).toBeDefined()
  const params = new URLSearchParams(queries.at(-1))
  expect(Object.fromEntries(params)).toEqual({ q: 'ape', network: 'polygon', sort: 'name', page: '2' })

  queries.length = 0
  await page.goto('/')
  await expect.poll(() => queries.at(-1)).toBeDefined()
  expect(queries.at(-1)).toBe('')
})

test('CAT-7#1: every sort option orders the cards as its label says', async ({ page }) => {
  const prices = async () => (await page.getByTestId('nft-card').locator('p').allTextContents()).map((t) => parseFloat(t))
  const names = () => page.getByTestId('nft-card').locator('h2').allTextContents()
  const ordered = <T,>(values: T[], cmp: (a: T, b: T) => number) => values.length === 9 && values.every((v, i) => i === 0 || cmp(values[i - 1]!, v) <= 0)
  await page.goto('/')
  await expect(sortControl(page)).toContainText(sortLabel('recent'))

  await chooseSort(page, 'price-asc')
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect.poll(async () => ordered(await prices(), (a, b) => a - b)).toBe(true)

  await chooseSort(page, 'price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect.poll(async () => ordered(await prices(), (a, b) => b - a)).toBe(true)

  await chooseSort(page, 'name')
  await expect(page).toHaveURL(/sort=name/)
  await expect.poll(async () => ordered(await names(), (a, b) => a.localeCompare(b))).toBe(true)
})

test('CAT-8#1 CAT-8#2: previous appears from page 2 and page links keep the other parameters', async ({ page }) => {
  await page.goto('/?sort=name')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(page.getByRole('link', { name: 'Página anterior' })).toHaveCount(0)

  await page.getByRole('link', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/sort=name/)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('link', { name: 'Página anterior' })).toBeVisible()

  await page.getByRole('link', { name: 'Página anterior' }).click()
  await expect(page).toHaveURL(/sort=name/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByRole('link', { name: 'Página anterior' })).toHaveCount(0)
})
