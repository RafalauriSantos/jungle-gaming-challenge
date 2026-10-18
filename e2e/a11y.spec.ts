import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

// An automatic scan of each screen for what axe rates serious or critical, at the size of the project (desktop or mobile).
async function scan(page: Page) {
  await page.waitForFunction('!!window.__mock && !!navigator.serviceWorker.controller')
  await page.waitForLoadState('networkidle')
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

async function withOneItem(page: Page) {
  await signIn(page)
  await page.goto('/nfts/nft-004')
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: /comprar/i }).first().click()
  await expect(page).toHaveURL('/carrinho')
}

const PUBLIC = ['/', '/nfts/nft-004', '/entrar', '/cadastrar', '/rota-que-nao-existe'] as const
for (const path of PUBLIC) {
  test(`A11Y-8#1 A11Y-3#1 A11Y-4#1: ${path} has no serious or critical accessibility violation`, async ({ page }) => {
    await page.goto(path)
    expect(await scan(page)).toEqual([])
  })
}

const PRIVATE = ['/perfil', '/carteiras', '/favoritos'] as const
for (const path of PRIVATE) {
  test(`A11Y-8#1 A11Y-3#1: ${path} has no serious or critical accessibility violation`, async ({ page }) => {
    await signIn(page)
    await page.goto(path)
    expect(await scan(page)).toEqual([])
  })
}

test('A11Y-8#1 A11Y-3#1: the cart and the payment have no serious or critical accessibility violation', async ({ page }) => {
  await withOneItem(page)
  expect(await scan(page)).toEqual([])
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  expect(await scan(page)).toEqual([])
})

test('A11Y-4#2: every image has a text alternative or is hidden as decoration', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('img').first()).toBeVisible()
  const bare = await page.locator('img').evaluateAll((imgs) =>
    imgs.filter((i) => i.getAttribute('alt') === null && i.getAttribute('aria-hidden') !== 'true').map((i) => i.outerHTML.slice(0, 80)),
  )
  expect(bare).toEqual([])
})

test('A11Y-8#1 A11Y-3#1: the order confirmation has no serious or critical accessibility violation', async ({ page }) => {
  await withOneItem(page)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await page.getByRole('radio', { name: 'MetaMask' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada: MetaMask.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await page.getByRole('dialog', { name: 'Revise seu pedido' }).getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page).toHaveURL(/\/pedido\//)
  // The order stays pending for a moment: scan the confirmed receipt, not the pending card.
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
  expect(await scan(page)).toEqual([])
})
