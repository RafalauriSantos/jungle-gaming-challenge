import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, memoryStorage, type Db } from '../db'
import { authenticate, login, logout, signup } from './auth'

const valid = { username: 'carla', email: 'carla@kurio.test', password: 'Segredo#2026', confirmPassword: 'Segredo#2026' }
let db: Db
let storage: ReturnType<typeof memoryStorage>
beforeEach(() => {
  storage = memoryStorage()
  db = createDb(storage)
})

describe('signup', () => {
  it('creates the user and a session', async () => {
    const { user, session } = await signup(db, valid)
    expect(user).toEqual({ id: 'u_000001', username: 'carla', email: 'carla@kurio.test' })
    expect(session.token).toMatch(/^tok_/)
    expect(authenticate(db, session.token).id).toBe(user.id)
  })

  it('AUTH-8#1: stores only a salted hash, never the password', async () => {
    await signup(db, valid)
    const stored = db.state.users.find((u) => u.email === 'carla@kurio.test')!
    expect(stored.passwordHash).toMatch(/^[0-9a-f]{64}$/)
    expect(stored.salt.length).toBeGreaterThan(5)
    expect(JSON.stringify(db.state)).not.toContain(valid.password)
    expect(storage.getItem('kurio.mock.db') ?? '').not.toContain(valid.password)
  })

  it('reports a taken e-mail on the e-mail field, ignoring case', async () => {
    await expect(signup(db, { ...valid, email: 'ANA@kurio.test' })).rejects.toMatchObject({
      status: 409,
      body: { code: 'email_taken', fields: { email: expect.any(String) } },
    })
  })

  it('reports a taken username', async () => {
    await expect(signup(db, { ...valid, username: 'ana' })).rejects.toMatchObject({
      status: 409,
      body: { code: 'username_taken', fields: { username: expect.any(String) } },
    })
  })

  it('validates every field', async () => {
    await expect(signup(db, { username: 'a', email: 'x', password: 'short', confirmPassword: 'other' })).rejects.toMatchObject({
      status: 422,
      body: { code: 'validation', fields: { username: expect.any(String), email: expect.any(String), password: expect.any(String), confirmPassword: expect.any(String) } },
    })
  })
})

describe('login and sessions', () => {
  it('logs a seeded user in', async () => {
    const { user } = await login(db, { email: 'ana@kurio.test', password: 'Colecionar#2026' })
    expect(user.username).toBe('ana')
  })

  it('answers wrong password and unknown e-mail the same way', async () => {
    const wrong = await login(db, { email: 'ana@kurio.test', password: 'nope-nope-1' }).catch((e) => e)
    const unknown = await login(db, { email: 'ghost@kurio.test', password: 'nope-nope-1' }).catch((e) => e)
    expect(wrong.status).toBe(401)
    expect(wrong.body).toEqual(unknown.body)
  })

  it('tells an unknown token from an expired one', async () => {
    const { session } = await login(db, { email: 'ana@kurio.test', password: 'Colecionar#2026' })
    expect(() => authenticate(db, 'tok_nope')).toThrowError(expect.objectContaining({ status: 401, body: expect.objectContaining({ code: 'unauthenticated' }) }))
    expect(() => authenticate(db, null)).toThrowError(expect.objectContaining({ body: expect.objectContaining({ code: 'unauthenticated' }) }))
    db.advance(31 * 60_000)
    expect(() => authenticate(db, session.token)).toThrowError(expect.objectContaining({ status: 401, body: expect.objectContaining({ code: 'session_expired' }) }))
  })

  it('logs out, and logging out twice is fine', async () => {
    const { session } = await login(db, { email: 'ana@kurio.test', password: 'Colecionar#2026' })
    logout(db, session.token)
    logout(db, session.token)
    expect(() => authenticate(db, session.token)).toThrowError(expect.objectContaining({ body: expect.objectContaining({ code: 'unauthenticated' }) }))
  })
})
