import type { AxiosAdapter } from 'axios'
import { CanceledError } from 'axios'
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { setSession } from './store'

const auth = (id: string) => ({ user: { id, username: id, email: `${id}@kurio.test` }, session: { token: `tok_${id}`, expiresAt: '2030-01-01T00:00:00.000Z' } })

// A server that answers after 50 ms, and gives up the moment the request is aborted.
const slowServer: AxiosAdapter = (config) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ data: 'late', status: 200, statusText: 'OK', headers: {}, config }), 50)
    ;(config.signal as AbortSignal).addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new CanceledError('aborted', config))
    })
  })

describe('AUTH-5#2: a response that belongs to the previous session is discarded', () => {
  it('AUTH-5#2: aborts what is in flight when the session changes', async () => {
    api.defaults.adapter = slowServer
    setSession(auth('u_ana'))
    const request = api.get('/cart')
    setSession(auth('u_bruno')) // another user signs in while Ana's request is out
    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' })
  })

  it('lets a request made after the change through', async () => {
    api.defaults.adapter = slowServer
    setSession(auth('u_bruno'))
    await expect(api.get('/cart')).resolves.toMatchObject({ data: 'late' })
  })
})
