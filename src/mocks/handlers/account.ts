import { delay, http, HttpResponse } from 'msw'
import type { LoginInput, SignupInput, WalletInput } from '@/api/types'
import { db } from '../db'
import { authenticate, login, logout, signup } from '../services/auth'
import { getWallets, saveWallet } from '../services/wallets'
import { bearer, callerOf, respond } from './respond'

export const accountHandlers = [
  http.post('/api/auth/signup', ({ request }) =>
    respond(async () => {
      const input = (await request.json()) as SignupInput
      await delay(150)
      return HttpResponse.json(await signup(db, input), { status: 201 })
    }),
  ),

  http.post('/api/auth/login', ({ request }) =>
    respond(async () => {
      const input = (await request.json()) as LoginInput
      await delay(150)
      return HttpResponse.json(await login(db, input))
    }),
  ),

  http.get('/api/auth/session', ({ request }) =>
    respond(() => {
      const user = authenticate(db, bearer(request))
      const session = db.state.sessions.find((s) => s.token === bearer(request))!
      return HttpResponse.json({ user, session: { token: session.token, expiresAt: new Date(session.expiresAt).toISOString() } })
    }),
  ),

  http.post('/api/auth/logout', ({ request }) =>
    respond(() => {
      logout(db, bearer(request))
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get('/api/wallets', ({ request }) => respond(() => HttpResponse.json(getWallets(db, callerOf(request).id)))),

  ...(['primary', 'secondary'] as const).map((slot) =>
    http.put(`/api/wallets/${slot}`, ({ request }) =>
      respond(async () => {
        const user = callerOf(request)
        return HttpResponse.json(saveWallet(db, user.id, slot, (await request.json()) as WalletInput))
      }),
    ),
  ),
]
