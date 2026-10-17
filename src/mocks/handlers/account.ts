import { delay, http, HttpResponse } from 'msw'
import type { LoginInput, PasswordInput, ProfileInput, SignupInput, WalletInput } from '@/api/types'
import { db } from '../db'
import { authenticate, login, logout, signup } from '../services/auth'
import { addFavorite, listFavorites, removeFavorite } from '../services/favorites'
import { changePassword, getProfile, removeAvatar, setAvatar, updateProfile } from '../services/profile'
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

  http.get('/api/favorites', ({ request }) => respond(() => HttpResponse.json(listFavorites(db, callerOf(request).id)))),

  http.put('/api/favorites/:nftId', ({ request, params }) =>
    respond(() => {
      addFavorite(db, callerOf(request).id, String(params.nftId))
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.delete('/api/favorites/:nftId', ({ request, params }) =>
    respond(() => {
      removeFavorite(db, callerOf(request).id, String(params.nftId))
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get('/api/profile', ({ request }) => respond(() => HttpResponse.json(getProfile(db, callerOf(request).id)))),

  http.patch('/api/profile', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      await delay(150)
      return HttpResponse.json(updateProfile(db, user.id, (await request.json()) as ProfileInput))
    }),
  ),

  http.put('/api/profile/avatar', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      const { dataUrl } = (await request.json()) as { dataUrl: string }
      return HttpResponse.json(setAvatar(db, user.id, dataUrl))
    }),
  ),

  http.delete('/api/profile/avatar', ({ request }) => respond(() => HttpResponse.json(removeAvatar(db, callerOf(request).id)))),

  http.post('/api/profile/password', ({ request }) =>
    respond(async () => {
      const user = callerOf(request)
      await delay(150)
      await changePassword(db, user.id, (await request.json()) as PasswordInput)
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
