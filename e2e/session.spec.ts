import { expect, test, type Page } from '@playwright/test'
import { ANA, authRoot, signIn } from './support'

const BRUNO = { email: 'bruno@kurio.test', password: 'Colecionar#2027', username: 'bruno' }

async function mock<T = unknown>(page: Page, expr: string): Promise<T> {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`) as Promise<T>
}

async function addToCart(page: Page) {
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL('/carrinho')
}

async function logOut(page: Page, mobile: boolean) {
  if (mobile) {
    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('button', { name: 'Conta de ana' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page).toHaveURL('/')
}

test('AUTH-6#1 AUTH-6#2 AUTH-11#1 MOCK-S08#1: an expired session sends the user to sign in and back to the same page', async ({ page }) => {
  await signIn(page)
  await page.goto('/carteiras')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

  await mock(page, 'advance(31 * 60 * 1000)') // the clock moves; nothing waits
  await page.goto('/carrinho')

  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho&reason=session_expired/)
  await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' }).first()).toBeVisible()
  await authRoot(page).getByLabel('E-mail').fill(ANA.email)
  await authRoot(page).getByLabel('Senha', { exact: true }).fill(ANA.password)
  await authRoot(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/carrinho')
})

test('AUTH-7#1: an expiry during checkout keeps the cart and what was chosen', async ({ page }) => {
  await signIn(page)
  await addToCart(page)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await page.getByRole('radio', { name: 'WalletConnect' }).click()

  await mock(page, 'advance(31 * 60 * 1000)')
  await page.getByRole('button', { name: 'Conectar carteira' }).click() // the first request after the expiry
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento&reason=session_expired/)

  await authRoot(page).getByLabel('E-mail').fill(ANA.email)
  await authRoot(page).getByLabel('Senha', { exact: true }).fill(ANA.password)
  await authRoot(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByRole('radio', { name: 'WalletConnect' })).toBeChecked() // the choice came back
  await expect(page.getByText('Cosmic Bloom #412')).toBeVisible() // and so did the cart
})

test('AUTH-5#1 AUTH-5#3 RT-6#1 API-8#2: after a switch of user nothing of the previous one is seen or received', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile'
  await signIn(page)
  await mock(page, 'setSettleDelay(5000)')
  await addToCart(page)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord_000001$/)
  await page.goto('/')
  await logOut(page, mobile)

  await signIn(page, BRUNO)
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible() // Ana's cart is not Bruno's
  await expect(page.getByText('Cosmic Bloom #412')).toHaveCount(0)
  await page.goto('/carteiras')
  await expect(page.getByLabel('Apelido da carteira').first()).toHaveValue('') // nor her wallets

  // Ana's order falls due while Bruno is signed in. Its event has nobody to go to.
  await mock(page, 'advance(6000)')
  await mock(page, 'settle()') // the order settles now; its event is published, and nobody is listening for it
  expect(await mock<string[]>(page, 'sentEvents()')).not.toContain('order.ord_000001.v2')
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})
