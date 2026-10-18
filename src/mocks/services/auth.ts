import type { AuthResponse, LoginInput, SignupInput, User } from '@/api/types'
import type { Db, StoredUser } from '../db'
import { fail } from '../failure'
import { hashPassword } from '../password'

const SESSION_MS = 30 * 60_000
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-zA-Z0-9._-]{3,24}$/

const toUser = ({ id, username, email }: StoredUser): User => ({ id, username, email })

function startSession(db: Db, userId: string) {
  const token = db.nextId('tok')
  const expiresAt = db.now() + SESSION_MS
  db.state.sessions.push({ token, userId, expiresAt })
  db.save()
  return { token, expiresAt: new Date(expiresAt).toISOString() }
}

// A body that misses a field is a validation error, not a crash.
const text = (value: unknown) => (typeof value === 'string' ? value : '')

export async function signup(db: Db, raw: SignupInput): Promise<AuthResponse> {
  const input: SignupInput = { username: text(raw.username), email: text(raw.email), password: text(raw.password), confirmPassword: text(raw.confirmPassword) }
  const fields: Record<string, string> = {}
  if (!USERNAME.test(input.username)) fields.username = 'Use de 3 a 24 letras, números, ponto, hífen ou sublinhado.'
  if (!EMAIL.test(input.email)) fields.email = 'Informe um e-mail válido.'
  if (input.password.length < 8) fields.password = 'A senha deve ter ao menos 8 caracteres.'
  if (input.confirmPassword !== input.password) fields.confirmPassword = 'As senhas não conferem.'
  if (Object.keys(fields).length) throw fail(422, 'validation', 'Revise os campos destacados.', fields)

  const email = input.email.toLowerCase()
  if (db.state.users.some((u) => u.email === email)) {
    throw fail(409, 'email_taken', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
  }
  if (db.state.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    throw fail(409, 'username_taken', 'Este nome de usuário já está em uso.', { username: 'Este nome de usuário já está em uso.' })
  }

  const id = db.nextId('u')
  const salt = `s-${id}`
  const user: StoredUser = { id, username: input.username, email, salt, passwordHash: await hashPassword(input.password, salt) }
  db.state.users.push(user)
  db.state.profiles[id] = { displayName: input.username, username: input.username, email, ensName: input.username.toLowerCase().replace(/[^a-z0-9-]/g, '-'), walletNickname: 'Principal', avatarUrl: null, version: 1 }
  db.state.wallets[id] = { primary: null, secondary: null }
  return { user: toUser(user), session: startSession(db, id) }
}

export async function login(db: Db, raw: LoginInput): Promise<AuthResponse> {
  const input: LoginInput = { email: text(raw.email), password: text(raw.password) }
  const missing: Record<string, string> = {}
  if (!input.email.trim()) missing.email = 'Informe seu e-mail.'
  if (!input.password) missing.password = 'Informe sua senha.'
  if (Object.keys(missing).length) throw fail(422, 'validation', 'Revise os campos destacados.', missing)
  const user = db.state.users.find((u) => u.email === input.email.trim().toLowerCase())
  // Hash even for an unknown e-mail so both failures cost the same and read the same.
  const hash = await hashPassword(input.password, user?.salt ?? 'unknown')
  if (!user || hash !== user.passwordHash) throw fail(401, 'unauthenticated', 'E-mail ou senha incorretos.')
  return { user: toUser(user), session: startSession(db, user.id) }
}

/** The caller behind a bearer token. Distinguishes an unknown token from an expired one. */
export function authenticate(db: Db, token: string | null): User {
  const session = token ? db.state.sessions.find((s) => s.token === token) : undefined
  if (!session) throw fail(401, 'unauthenticated', 'Faça login para continuar.')
  if (session.expiresAt <= db.now()) throw fail(401, 'session_expired', 'Sua sessão expirou. Entre novamente.')
  const user = db.state.users.find((u) => u.id === session.userId)
  if (!user) throw fail(401, 'unauthenticated', 'Faça login para continuar.')
  return toUser(user)
}

export function logout(db: Db, token: string | null) {
  db.state.sessions = db.state.sessions.filter((s) => s.token !== token)
  db.save()
}
