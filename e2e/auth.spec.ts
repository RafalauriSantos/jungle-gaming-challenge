import { expect, test } from '@playwright/test'
import { PRIVATE_API } from './private-api'
import { ANA, authRoot, signIn } from './support'

const desktopOnly = (name: string) => name === 'desktop'

test('AUTH-1#1: empty and invalid sign-up fields show field errors', async ({ page }) => {
  await page.goto('/cadastrar')
  const root = authRoot(page)
  await root.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(root.getByText('Use de 3 a 24 letras, números, ponto, hífen ou sublinhado.')).toBeVisible()
  await expect(root.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(root.getByText('A senha deve ter ao menos 8 caracteres.')).toBeVisible()
  // The first invalid field takes focus and is linked to its message.
  const username = root.getByLabel('Nome de usuário')
  await expect(username).toBeFocused()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  await expect(username).toHaveAccessibleDescription(/Use de 3 a 24 letras/)
})

test('AUTH-1#2: a mismatched password confirmation is an error', async ({ page }) => {
  await page.goto('/cadastrar')
  const root = authRoot(page)
  await root.getByLabel('Nome de usuário').fill('carla')
  await root.getByLabel('E-mail').fill('carla@kurio.test')
  await root.getByLabel('Senha', { exact: true }).fill('Segredo#2026')
  await root.getByLabel('Confirmar senha').fill('Outra#2026')
  await root.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(root.getByLabel('Confirmar senha')).toHaveAccessibleDescription('As senhas não conferem.')
})

test('AUTH-1#3 MOCK-S10#1: a registered e-mail is reported on the e-mail field', async ({ page }) => {
  await page.goto('/cadastrar')
  const root = authRoot(page)
  await root.getByLabel('Nome de usuário').fill('carla')
  await root.getByLabel('E-mail').fill(ANA.email)
  await root.getByLabel('Senha', { exact: true }).fill('Segredo#2026')
  await root.getByLabel('Confirmar senha').fill('Segredo#2026')
  await root.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(root.getByLabel('E-mail')).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
  await expect(root.getByLabel('E-mail')).toBeFocused()
  await expect(page).toHaveURL(/\/cadastrar/)
})

test('a new account is created and signed in', async ({ page }) => {
  await page.goto('/cadastrar')
  const root = authRoot(page)
  await root.getByLabel('Nome de usuário').fill('carla')
  await root.getByLabel('E-mail').fill('carla@kurio.test')
  await root.getByLabel('Senha', { exact: true }).fill('Segredo#2026')
  await root.getByLabel('Confirmar senha').fill('Segredo#2026')
  await root.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})

test('AUTH-2#1: wrong credentials show an error and stay on the form', async ({ page }) => {
  await page.goto('/entrar')
  const root = authRoot(page)
  await root.getByLabel('E-mail').fill(ANA.email)
  await root.getByLabel('Senha', { exact: true }).fill('errada-errada')
  await root.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(root.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await expect(page).toHaveURL(/\/entrar/)
})

test('API-1#1 ROUTE-3#1 ROUTE-3#2 AUTH-2#2: a private page sends visitors to login and back', async ({ page }) => {
  await page.goto('/carrinho')
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho/)
  await signIn(page, ANA, page.url())
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByRole('heading', { name: /^Carrinho/ })).toBeVisible()
})

test('ROUTE-3#3: an external redirect is ignored', async ({ page, baseURL }) => {
  await signIn(page, ANA, '/entrar?redirect=https://evil.test/')
  expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin)
  await expect(page).toHaveURL('/')
})

test('AUTH-2#3 AUTH-10#2: the header shows the account and drops "Entrar" after login', async ({ page }, info) => {
  test.skip(!desktopOnly(info.project.name), 'The mobile layout has no header; see AUTH-10')
  await signIn(page)
  await expect(page.getByRole('button', { name: 'Conta de ana' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Entrar' })).toHaveCount(0)
})

test('AUTH-3#1: the session survives a reload', async ({ page }) => {
  await signIn(page)
  await page.reload()
  await page.goto('/perfil')
  await expect(page).toHaveURL('/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})

test('AUTH-10#1 AUTH-4#2: logout is reachable, ends the session and protects the private pages', async ({ page }, info) => {
  await signIn(page)
  if (desktopOnly(info.project.name)) {
    await page.getByRole('button', { name: 'Conta de ana' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  } else {
    await page.getByRole('link', { name: 'Perfil', exact: true }).click()
    await page.getByRole('button', { name: 'Sair' }).click()
  }
  await expect(page).toHaveURL('/')
  expect(await page.evaluate(() => localStorage.getItem('kurio.session'))).toBeNull()
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/)
})

test('the sign-in modal traps focus and Escape leaves it', async ({ page }, info) => {
  test.skip(!desktopOnly(info.project.name), 'The modal exists from tablet width up')
  await page.goto('/entrar')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('E-mail')).toBeFocused()
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL('/')
})

test('the password can be revealed and hidden by keyboard', async ({ page }) => {
  await page.goto('/entrar')
  const root = authRoot(page)
  const password = root.getByLabel('Senha', { exact: true })
  await password.fill('segredo')
  await expect(password).toHaveAttribute('type', 'password')
  await root.getByRole('button', { name: 'Mostrar senha' }).focus()
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'text')
  await expect(root.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
})

test('AUTH-9#1: every private API refuses a request without a token, and every private route sends the visitor to sign in', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction('!!window.__mock && !!navigator.serviceWorker.controller') // the mock backend answers from here on
  const answers = await page.evaluate(async (endpoints) => {
    const out: string[] = []
    for (const [method, path] of endpoints) {
      const url = path.replace(/:\w+/g, 'x')
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' || method === 'DELETE' ? undefined : '{}' })
      out.push(`${method} ${path} ${response.status}`)
    }
    return out
  }, PRIVATE_API)
  expect(answers).toEqual(PRIVATE_API.map(([method, path]) => `${method} ${path} 401`))

  for (const route of ['/carrinho', '/pagamento', '/favoritos', '/perfil', '/carteiras', '/pedido/ord_x']) {
    await page.goto(route)
    await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=${encodeURIComponent(route)}`))
  }
})
