import { expect, type Page } from '@playwright/test'

/** Fictional users seeded by the mock (see src/mocks/fixtures/users.ts). */
export const ANA = { email: 'ana@kurio.test', password: 'Colecionar#2026', username: 'ana' }

/** The sign-in surface: a modal from tablet width up, a page on mobile. */
export const authRoot = (page: Page) => (page.viewportSize()!.width >= 768 ? page.getByRole('dialog') : page.getByRole('main'))

export async function signIn(page: Page, user = ANA, from = '/entrar') {
  await page.goto(from)
  const root = authRoot(page)
  await root.getByLabel('E-mail').fill(user.email)
  await root.getByLabel('Senha', { exact: true }).fill(user.password)
  await root.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/(entrar|cadastrar)/)
}
