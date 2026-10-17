import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, memoryStorage, type Db } from '../db'
import { login } from './auth'
import { changePassword, getProfile, removeAvatar, setAvatar, updateProfile } from './profile'

let db: Db
beforeEach(() => {
  db = createDb(memoryStorage())
})
const PNG = 'data:image/png;base64,iVBORw0KGgo='

describe('profile', () => {
  it('PRO-1#1: updates name, username and e-mail, and the sign-in follows the new e-mail', async () => {
    const profile = updateProfile(db, 'u_ana', { displayName: 'Ana Maria', username: 'anamaria', email: 'Ana.Maria@kurio.test' })
    expect(profile).toMatchObject({ displayName: 'Ana Maria', username: 'anamaria', email: 'ana.maria@kurio.test', version: 2 })
    expect(getProfile(db, 'u_ana').username).toBe('anamaria')
    expect((await login(db, { email: 'ana.maria@kurio.test', password: 'Colecionar#2026' })).user.username).toBe('anamaria')
  })

  it('PRO-1#2: reports a taken e-mail or username on its field', () => {
    expect(() => updateProfile(db, 'u_ana', { email: 'bruno@kurio.test' })).toThrowError(expect.objectContaining({ status: 409, body: expect.objectContaining({ fields: { email: expect.any(String) } }) }))
    expect(() => updateProfile(db, 'u_ana', { username: 'BRUNO' })).toThrowError(expect.objectContaining({ status: 409, body: expect.objectContaining({ fields: { username: expect.any(String) } }) }))
  })

  it('PRO-1#2: validates the fields and keeps the profile unchanged', () => {
    expect(() => updateProfile(db, 'u_ana', { displayName: ' ', username: 'a', email: 'x' })).toThrowError(
      expect.objectContaining({ status: 422, body: expect.objectContaining({ fields: { displayName: expect.any(String), username: expect.any(String), email: expect.any(String) } }) }),
    )
    expect(getProfile(db, 'u_ana').displayName).toBe('Ana Souza')
  })

  it('PRO-1#1: stores and removes the avatar, and refuses other types and big files', () => {
    expect(setAvatar(db, 'u_ana', PNG).avatarUrl).toBe(PNG)
    expect(getProfile(db, 'u_bruno').avatarUrl).toBeNull()
    expect(removeAvatar(db, 'u_ana').avatarUrl).toBeNull()
    expect(() => setAvatar(db, 'u_ana', 'data:text/html;base64,AAAA')).toThrowError(expect.objectContaining({ status: 422 }))
    expect(() => setAvatar(db, 'u_ana', 'data:image/png;base64,' + 'A'.repeat(1_500_000))).toThrowError(expect.objectContaining({ status: 422 }))
  })
})

describe('password', () => {
  const ok = { currentPassword: 'Colecionar#2026', newPassword: 'NovaSenha#2027', confirmNewPassword: 'NovaSenha#2027' }

  it('PRO-2#1: refuses a wrong current password on its field', async () => {
    await expect(changePassword(db, 'u_ana', { ...ok, currentPassword: 'errada-errada' })).rejects.toMatchObject({ status: 422, body: { fields: { currentPassword: expect.any(String) } } })
  })

  it('PRO-2#1: validates the new password', async () => {
    await expect(changePassword(db, 'u_ana', { ...ok, newPassword: 'curta', confirmNewPassword: 'outra' })).rejects.toMatchObject({
      status: 422,
      body: { fields: { newPassword: expect.any(String), confirmNewPassword: expect.any(String) } },
    })
    await expect(changePassword(db, 'u_ana', { ...ok, newPassword: ok.currentPassword, confirmNewPassword: ok.currentPassword })).rejects.toMatchObject({ status: 422, body: { fields: { newPassword: expect.any(String) } } })
  })

  it('PRO-2#2: after a change only the new password signs in', async () => {
    await changePassword(db, 'u_ana', ok)
    await expect(login(db, { email: 'ana@kurio.test', password: ok.currentPassword })).rejects.toMatchObject({ status: 401 })
    expect((await login(db, { email: 'ana@kurio.test', password: ok.newPassword })).user.id).toBe('u_ana')
  })
})
