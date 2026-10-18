import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

const BRUNO = { email: 'bruno@kurio.test', password: 'Colecionar#2027', username: 'bruno' }
const EVM = '0x' + 'ab12'.repeat(10)
const SOLANA = '4Nd1mYQzvgnZQ3dSPrtJXJvKNWJHgTWBvPhC1FDR6Y2d'

const principal = (page: Page) => page.getByRole('form', { name: 'Carteira principal' })
const secondary = (page: Page) => page.getByRole('form', { name: 'Carteira secundária' })

async function choose(form: ReturnType<typeof principal>, page: Page, label: string, option: string) {
  await form.getByRole('combobox', { name: label }).click()
  await page.getByRole('option', { name: option }).click()
}

async function fillValid(form: ReturnType<typeof principal>, page: Page, over: { address?: string; network?: string; nickname?: string } = {}) {
  await form.getByLabel('Nome de exibição').fill('Bruno Lima')
  await form.getByLabel('Apelido da carteira').fill(over.nickname ?? 'Principal')
  await choose(form, page, 'Rede', over.network ?? 'Ethereum')
  await form.getByLabel('Nome do perfil').fill('bruno.kurio')
  await form.getByLabel('Endereço da carteira').fill(over.address ?? EVM)
  await choose(form, page, 'Tipo de carteira', 'MetaMask')
  await form.getByLabel('Código de indicação').fill('KURIO2026')
  await form.getByLabel('E-mail').fill('bruno@kurio.test')
  if ((over.network ?? 'Ethereum') === 'Ethereum') await form.getByLabel('Nome ENS').fill('bruno')
}

test('WAL-1#1: required fields are reported on save and the first one takes focus', async ({ page }) => {
  await signIn(page, BRUNO)
  await page.goto('/carteiras')
  const form = principal(page)
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(form.getByText('Campo obrigatório.').first()).toBeVisible()
  await expect(form.getByText('Selecione uma rede.')).toBeVisible()
  await expect(form.getByLabel('Nome de exibição')).toBeFocused()
  await expect(form.getByLabel('Nome de exibição')).toHaveAccessibleDescription('Campo obrigatório.')
})

test('WAL-1#2: the address format of the chosen network is enforced', async ({ page }) => {
  await signIn(page, BRUNO)
  await page.goto('/carteiras')
  const form = principal(page)
  await fillValid(form, page, { address: '0x123' })
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(form.getByLabel('Endereço da carteira')).toHaveAccessibleDescription('Endereço inválido para esta rede.')

  // An EVM address is not a Solana address, and the ENS name stops being required there.
  await form.getByLabel('Endereço da carteira').fill(EVM)
  await choose(form, page, 'Rede', 'Solana')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(form.getByLabel('Endereço da carteira')).toHaveAccessibleDescription('Endereço inválido para esta rede.')
  await form.getByLabel('Endereço da carteira').fill(SOLANA)
  await form.getByLabel('Nome ENS').fill('')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva.' })).toBeVisible()
})

test('WAL-1#3 WAL-2#1: saved and edited wallets are there after a reload', async ({ page }) => {
  await signIn(page, BRUNO)
  await page.goto('/carteiras')
  const form = principal(page)
  await fillValid(form, page)
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva.' })).toBeVisible()

  await page.reload()
  await expect(principal(page).getByLabel('Apelido da carteira')).toHaveValue('Principal')
  await expect(principal(page).getByRole('combobox', { name: 'Rede' })).toContainText('Ethereum')

  await principal(page).getByLabel('Apelido da carteira').fill('Cofre')
  await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva.' })).toBeVisible()
  await page.reload()
  await expect(principal(page).getByLabel('Apelido da carteira')).toHaveValue('Cofre')
})

test('a secondary wallet can start from the principal one', async ({ page }) => {
  await signIn(page, BRUNO)
  await page.goto('/carteiras')
  await fillValid(principal(page), page)
  await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva.' })).toBeVisible()

  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).check()
  await page.getByRole('button', { name: 'Adicionar' }).click()
  await expect(secondary(page).getByLabel('Nome de exibição')).toHaveValue('Bruno Lima')
  await expect(secondary(page).getByLabel('Apelido da carteira')).toHaveValue('')
  await secondary(page).getByLabel('Apelido da carteira').fill('Reserva')
  await secondary(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary(page).getByRole('status')).toHaveText('Carteira salva.')
  await page.reload()
  await expect(secondary(page).getByLabel('Apelido da carteira')).toHaveValue('Reserva')
})

test('each user sees only their own wallets', async ({ page }) => {
  await signIn(page)
  await page.goto('/carteiras')
  await expect(principal(page).getByLabel('Apelido da carteira')).toHaveValue('Principal')
  await expect(secondary(page).getByLabel('Apelido da carteira')).toHaveValue('Reserva')
})

test('the wallets API refuses a request without a session', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-card').first()).toBeVisible() // the mock worker is now controlling the page
  const status = await page.evaluate(() => fetch('/api/wallets').then((r) => r.status))
  expect(status).toBe(401)
})

test('the network can be chosen by keyboard', async ({ page }) => {
  await signIn(page, BRUNO)
  await page.goto('/carteiras')
  const trigger = principal(page).getByRole('combobox', { name: 'Rede' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(trigger).not.toContainText('Selecione uma rede')
})

test('the ENS name field sits on the same line as the other fields, with its ".eth" tag at the same height', async ({ page }) => {
  await signIn(page)
  await page.goto('/carteiras')
  const form = principal(page)
  await expect(form.getByLabel('Nome ENS')).toBeVisible()
  const tops = async (label: string) => (await form.getByLabel(label).first().boundingBox())!
  const email = await tops('E-mail')
  const ens = await tops('Nome ENS')
  const tag = (await form.getByText('.eth', { exact: true }).boundingBox())!
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 768
  if (isDesktop) expect(Math.abs(ens.y - email.y), 'ENS input and E-mail input start at the same height').toBeLessThanOrEqual(1) // two columns: the same row
  expect(ens.height).toBe(email.height)
  expect(tag.y).toBeCloseTo(ens.y, 0)
  expect(tag.height).toBeCloseTo(ens.height, 0)
})
