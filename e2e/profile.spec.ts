import { expect, test, type Page } from '@playwright/test'
import { ANA, signIn } from './support'

// A 1x1 PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

const main = (page: Page) => page.getByRole('main')
async function leave(page: Page) {
  await page.goto('/perfil')
  await page.getByRole('navigation', { name: 'Minha conta' }).getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
}

test('PRO-1#1 FRM-2#1: name, username and e-mail persist after a reload and the header follows', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  await main(page).getByLabel('Nome de exibição').fill('Ana Maria')
  await main(page).getByLabel('Nome de usuário').fill('anamaria')
  await main(page).getByLabel('E-mail').fill('ana.maria@kurio.test')
  await main(page).getByLabel('Nome ENS').fill('ana-maria')
  await main(page).getByLabel('Apelido da carteira').fill('Cofre')
  await main(page).getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(main(page).getByRole('status').filter({ hasText: 'Alterações salvas.' })).toBeVisible()

  await page.reload()
  await expect(main(page).getByLabel('Nome de exibição')).toHaveValue('Ana Maria')
  await expect(main(page).getByLabel('Nome ENS')).toHaveValue('ana-maria')
  await expect(main(page).getByLabel('Apelido da carteira')).toHaveValue('Cofre')
  await expect(main(page).getByLabel('Nome de usuário')).toHaveValue('anamaria')
  await expect(main(page).getByLabel('E-mail')).toHaveValue('ana.maria@kurio.test')
})

test('PRO-1#2 FRM-1#1: a taken e-mail is shown on its field, linked and focused', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  const email = main(page).getByLabel('E-mail')
  await email.fill('bruno@kurio.test')
  await main(page).getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(main(page).getByRole('alert').filter({ hasText: 'Este e-mail já está cadastrado.' })).toBeVisible()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
  await expect(email).toBeFocused()
})

test('FRM-1#1: invalid fields are refused before any request', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  await main(page).getByLabel('Nome de usuário').fill('a')
  await main(page).getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(main(page).getByLabel('Nome de usuário')).toHaveAccessibleDescription(/3 a 24/)
})

test('PRO-1#1: the avatar is sent, survives a reload and can be removed', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  await expect(main(page).getByRole('button', { name: 'Remover foto' })).toHaveCount(0)
  await main(page).getByLabel('Escolher foto').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG })
  await expect(main(page).getByRole('img', { name: 'Foto de Ana Souza' })).toBeVisible()
  await page.reload()
  await expect(main(page).getByRole('img', { name: 'Foto de Ana Souza' })).toBeVisible()
  await main(page).getByRole('button', { name: 'Remover foto' }).click()
  await expect(main(page).getByRole('img', { name: 'Foto de Ana Souza' })).toHaveCount(0)
})

test('PRO-1#2: a file that is not an image is refused with a message', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  await main(page).getByLabel('Escolher foto').setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') })
  await expect(main(page).getByRole('alert').filter({ hasText: 'PNG, JPEG ou WebP' })).toBeVisible()
})

test('PRO-2#1: a wrong current password errors on its field', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  await main(page).getByLabel('Senha atual', { exact: true }).fill('errada-errada')
  await main(page).getByLabel('Nova senha', { exact: true }).fill('NovaSenha#2027')
  await main(page).getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha#2027')
  await main(page).getByRole('button', { name: 'Salvar', exact: true }).click()
  const field = main(page).getByLabel('Senha atual', { exact: true })
  await expect(field).toHaveAccessibleDescription('A senha atual está incorreta.')
  await expect(field).toBeFocused()
})

test('PRO-2#2: after changing the password only the new one signs in', async ({ page }) => {
  await signIn(page)
  await page.goto('/perfil')
  await main(page).getByLabel('Senha atual', { exact: true }).fill(ANA.password)
  await main(page).getByLabel('Nova senha', { exact: true }).fill('NovaSenha#2027')
  await main(page).getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha#2027')
  await main(page).getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(main(page).getByRole('status').filter({ hasText: 'Alterações salvas.' })).toBeVisible()

  await leave(page)
  await page.goto('/entrar')
  const root = page.viewportSize()!.width >= 768 ? page.getByRole('dialog') : page.getByRole('main')
  await root.getByLabel('E-mail').fill(ANA.email)
  await root.getByLabel('Senha', { exact: true }).fill(ANA.password)
  await root.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(root.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await root.getByLabel('Senha', { exact: true }).fill('NovaSenha#2027')
  await root.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/entrar/)
})
