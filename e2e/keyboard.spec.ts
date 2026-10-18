import { expect, test, type Locator, type Page } from '@playwright/test'
import { ANA } from './support'

// Keyboard only: no mouse click below. `tabTo` presses Tab until the target has focus.
async function tabTo(page: Page, target: Locator, max = 80) {
  await target.waitFor({ state: 'visible' }) // the screen must be there before Tab is pressed
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`The keyboard never reached ${target}`)
}
const insideDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))
const desktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768

test('A11Y-1#1: sign in, choose an edition, buy and pay, with the keyboard only', async ({ page }) => {
  // Sign in. On desktop the e-mail field has focus when the modal opens; on mobile it is one Tab away.
  await page.goto('/entrar')
  const email = page.getByLabel('E-mail', { exact: true })
  await tabTo(page, email)
  await page.keyboard.type(ANA.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(ANA.password)
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/entrar/)

  // The detail: the edition group, then the buy button.
  await page.goto('/nfts/nft-004')
  await tabTo(page, page.getByRole('radio', { name: /^Edição/ }).first())
  for (let i = 0; i < 3 && !(await page.getByRole('radio', { name: 'Edição 1/10' }).isChecked()); i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Edição 1/10' })).toBeChecked()
  const buy = page.getByRole('button', { name: /comprar/i }).first()
  await tabTo(page, buy)
  await page.keyboard.press('Enter')

  // The cart, then the payment: a wallet app, its connection, the review and the order.
  await expect(page).toHaveURL('/carrinho')
  await tabTo(page, page.getByRole('link', { name: 'Conectar e finalizar' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/pagamento')
  // Radios are one tab stop per group: Tab reaches the group, the arrows pick inside it.
  const metamask = page.getByRole('radio', { name: 'MetaMask' })
  if (desktop(page)) {
    await tabTo(page, metamask)
    await page.keyboard.press('Space')
  } else {
    await tabTo(page, page.getByRole('radiogroup', { name: 'Carteira e rede' }).locator('[role=radio][tabindex="0"]'))
    for (let i = 0; i < 3 && !(await metamask.isChecked()); i++) await page.keyboard.press('ArrowDown')
  }
  await expect(metamask).toBeChecked()
  await tabTo(page, page.getByRole('button', { name: 'Conectar carteira' }))
  await page.keyboard.press('Enter')
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await tabTo(page, page.getByRole('button', { name: 'Confirmar compra' }))
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  await expect.poll(() => insideDialog(page)).toBe(true)
  await tabTo(page, dialog.getByRole('button', { name: 'Enviar pedido' }))
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
})

test('A11Y-2#1: the review dialog takes focus in, keeps it inside, and gives it back when it closes', async ({ page }) => {
  await page.goto('/entrar')
  await tabTo(page, page.getByLabel('E-mail', { exact: true }))
  await page.keyboard.type(ANA.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(ANA.password)
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/entrar/)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).check()
  await page.getByRole('button', { name: /comprar/i }).first().click()
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('radio', { name: 'MetaMask' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()

  const trigger = page.getByRole('button', { name: 'Confirmar compra' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  expect(await insideDialog(page)).toBe(true) // focus entered
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    await expect.poll(() => insideDialog(page)).toBe(true) // and cycles inside (a focus guard hands focus back)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused() // and returns to what opened it
})

test('A11Y-2#1: the filters sheet on mobile takes focus in and gives it back', async ({ page }) => {
  test.skip(desktop(page), 'The sheet exists on mobile only')
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Abrir filtros' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await expect.poll(() => insideDialog(page)).toBe(true)
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    await expect.poll(() => insideDialog(page)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('A11Y-2#1: the account menu opens and closes by keyboard and returns focus', async ({ page }) => {
  test.skip(!desktop(page), 'The account menu is in the desktop header')
  await page.goto('/entrar')
  await tabTo(page, page.getByLabel('E-mail', { exact: true }))
  await page.keyboard.type(ANA.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(ANA.password)
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/entrar/)
  const account = page.getByRole('button', { name: 'Conta de ana' })
  await account.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Perfil' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: 'Perfil' })).toHaveCount(0)
  await expect(account).toBeFocused()
})

test('A11Y-3#2: an invalid sign-up marks each field, links its error and puts focus on the first', async ({ page }) => {
  await page.goto('/cadastrar')
  const root = desktop(page) ? page.getByRole('dialog') : page.getByRole('main')
  await root.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  const invalid = root.locator('input[aria-invalid="true"]')
  expect(await invalid.count()).toBeGreaterThanOrEqual(3)
  for (const input of await invalid.all()) {
    const id = await input.getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    await expect(page.locator(`[id="${id}"]`)).not.toBeEmpty()
  }
  await expect(invalid.first()).toBeFocused()
})
