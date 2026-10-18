import { describe, expect, it } from 'vitest'
import { api, onUnservedRequest } from './client'

const reply = (data: unknown, contentType: string) => async (config: never) => ({ data, status: 200, statusText: 'OK', headers: { 'content-type': contentType }, config })

describe('an answer that is not the API', () => {
  it('API-5#1: a page of HTML where JSON was expected is a failed request, not data', async () => {
    // What the host answers when the mock service worker is not in control of the page: the app's own index.html.
    await expect(api.request({ url: '/cart', adapter: reply('<!doctype html><html></html>', 'text/html; charset=utf-8') as never })).rejects.toMatchObject({ code: 'ERR_BAD_RESPONSE' })
  })

  it('API-5#1: a JSON answer passes through untouched', async () => {
    const cart = { items: [], version: 1 }
    const res = await api.request({ url: '/cart', adapter: reply(cart, 'application/json') as never })
    expect(res.data).toBe(cart)
  })

  it('API-5#1: when a way to wake the worker is registered, the request is sent once more and, if it is then served, succeeds', async () => {
    let woken = 0
    let calls = 0
    onUnservedRequest(async () => {
      woken += 1
    })
    const cart = { items: [], version: 1 }
    const adapter = (async (config: never) => {
      calls += 1
      return calls === 1 ? reply('<!doctype html>', 'text/html')(config) : reply(cart, 'application/json')(config)
    }) as never
    const res = await api.request({ url: '/cart', adapter })
    expect(woken).toBe(1)
    expect(calls).toBe(2)
    expect(res.data).toBe(cart)
  })
})
