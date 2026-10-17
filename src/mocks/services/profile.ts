import type { PasswordInput, Profile, ProfileInput } from '@/api/types'
import type { Db } from '../db'
import { fail } from '../failure'
import { hashPassword } from '../password'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-zA-Z0-9._-]{3,24}$/
const ENS = /^[a-zA-Z0-9-]{1,30}$/
const AVATAR = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/
/** Base64 characters, about 1 MB of image. */
const AVATAR_MAX = 1_400_000

export const getProfile = (db: Db, userId: string): Profile => structuredClone(db.state.profiles[userId]!)

export function updateProfile(db: Db, userId: string, patch: ProfileInput): Profile {
  const profile = db.state.profiles[userId]!
  const user = db.state.users.find((u) => u.id === userId)!
  const fields: Record<string, string> = {}
  if (patch.displayName !== undefined && (patch.displayName.trim().length < 2 || patch.displayName.trim().length > 60)) fields.displayName = 'Informe um nome de 2 a 60 caracteres.'
  if (patch.username !== undefined && !USERNAME.test(patch.username)) fields.username = 'Use de 3 a 24 letras, números, ponto, hífen ou sublinhado.'
  if (patch.email !== undefined && !EMAIL.test(patch.email.trim())) fields.email = 'Informe um e-mail válido.'
  if (patch.ensName !== undefined && !ENS.test(patch.ensName.trim())) fields.ensName = 'Use de 1 a 30 letras, números ou hífen.'
  if (patch.walletNickname !== undefined && (patch.walletNickname.trim().length < 1 || patch.walletNickname.trim().length > 30)) fields.walletNickname = 'Informe um apelido de 1 a 30 caracteres.'
  if (Object.keys(fields).length) throw fail(422, 'validation', 'Revise os campos destacados.', fields)

  const email = patch.email?.trim().toLowerCase()
  if (email && db.state.users.some((u) => u.id !== userId && u.email === email)) {
    throw fail(409, 'email_taken', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
  }
  if (patch.username && db.state.users.some((u) => u.id !== userId && u.username.toLowerCase() === patch.username!.toLowerCase())) {
    throw fail(409, 'username_taken', 'Este nome de usuário já está em uso.', { username: 'Este nome de usuário já está em uso.' })
  }

  if (patch.displayName !== undefined) profile.displayName = patch.displayName.trim()
  if (patch.username) profile.username = user.username = patch.username
  if (patch.ensName !== undefined) profile.ensName = patch.ensName.trim()
  if (patch.walletNickname !== undefined) profile.walletNickname = patch.walletNickname.trim()
  if (email) profile.email = user.email = email
  profile.version += 1
  db.save()
  return getProfile(db, userId)
}

export function setAvatar(db: Db, userId: string, dataUrl: string): Profile {
  if (!AVATAR.test(dataUrl)) throw fail(422, 'validation', 'Use uma imagem PNG, JPEG ou WebP.', { avatar: 'Use uma imagem PNG, JPEG ou WebP.' })
  if (dataUrl.length > AVATAR_MAX) throw fail(422, 'validation', 'A imagem deve ter no máximo 1 MB.', { avatar: 'A imagem deve ter no máximo 1 MB.' })
  const profile = db.state.profiles[userId]!
  profile.avatarUrl = dataUrl
  profile.version += 1
  db.save()
  return getProfile(db, userId)
}

export function removeAvatar(db: Db, userId: string): Profile {
  const profile = db.state.profiles[userId]!
  profile.avatarUrl = null
  profile.version += 1
  db.save()
  return getProfile(db, userId)
}

export async function changePassword(db: Db, userId: string, input: PasswordInput): Promise<void> {
  const user = db.state.users.find((u) => u.id === userId)!
  const fields: Record<string, string> = {}
  if (input.newPassword.length < 8) fields.newPassword = 'A senha deve ter ao menos 8 caracteres.'
  else if (input.newPassword === input.currentPassword) fields.newPassword = 'A nova senha deve ser diferente da atual.'
  if (input.confirmNewPassword !== input.newPassword) fields.confirmNewPassword = 'As senhas não conferem.'
  if ((await hashPassword(input.currentPassword, user.salt)) !== user.passwordHash) fields.currentPassword = 'A senha atual está incorreta.'
  if (Object.keys(fields).length) throw fail(422, 'validation', 'Revise os campos destacados.', fields)
  user.passwordHash = await hashPassword(input.newPassword, user.salt)
  db.save()
}
