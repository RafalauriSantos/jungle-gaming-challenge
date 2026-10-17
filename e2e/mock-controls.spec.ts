import { expect, test } from '@playwright/test'
import { ANA, authRoot, signIn } from './support'

// The mock backend starts after the page loads, so wait for its control surface first.
async function mock<T>(page: import('@playwright/test').Page, expr: string): Promise<T> {
  await page.waitForFunction('!!window.__mock')
  return page.evaluate(`window.__mock.${expr}`) as Promise<T>
}

test('MOCK-3#1 MOCK-13#2: ?reset=1 wipes accounts, sessions and app storage and drops the parameter', async ({ page }) => {
  // Create an account and stay signed in with it.
  await page.goto('/cadastrar')
  const root = authRoot(page)
  await root.getByLabel('Nome de usuário').fill('carla')
  await root.getByLabel('E-mail').fill('carla@kurio.test')
  await root.getByLabel('Senha', { exact: true }).fill('Segredo#2026')
  await root.getByLabel('Confirmar senha').fill('Segredo#2026')
  await root.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(page).toHaveURL('/')
  expect(await page.evaluate(() => localStorage.getItem('kurio.session'))).not.toBeNull()
  const before = await mock<number>(page, 'generation()')

  await page.goto('/?reset=1')

  await expect(page).toHaveURL('/') // the parameter is gone, so a refresh does not reset again
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('kurio.session'))).toBeNull()
  expect(await mock<number>(page, 'generation()')).toBe(before + 1)
  // The account created before no longer exists; the seeded ones do.
  await page.goto('/entrar')
  await authRoot(page).getByLabel('E-mail').fill('carla@kurio.test')
  await authRoot(page).getByLabel('Senha', { exact: true }).fill('Segredo#2026')
  await authRoot(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(authRoot(page).getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await page.reload()
  expect(await mock<number>(page, 'generation()')).toBe(before + 1)
})

test('MOCK-3#1: a reset also ends the session of a seeded user', async ({ page }) => {
  await signIn(page, ANA)
  await page.goto('/?reset=1')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/entrar/)
})

test('a scenario is chosen by URL, shown in the demo panel, and cleared by the reset button', async ({ page }) => {
  await page.goto('/?scenario=signup-conflict&q=ape')
  await expect(page).toHaveURL('/?q=ape')
  expect(await mock<string>(page, 'scenario()')).toBe('signup-conflict')

  await page.getByRole('button', { name: 'Demo' }).click()
  const panel = page.getByRole('region', { name: 'Painel de demonstração' })
  await expect(panel.getByRole('combobox', { name: 'Cenário' })).toContainText('Conflito de cadastro')

  await panel.getByRole('button', { name: 'Resetar estado' }).click()
  await expect(page).toHaveURL('/')
  expect(await mock<string>(page, 'scenario()')).toBe('success')
})

test('an unknown scenario is ignored', async ({ page }) => {
  await page.goto('/?scenario=nao-existe')
  await expect(page).toHaveURL('/')
  expect(await mock<string>(page, 'scenario()')).toBe('success')
})
