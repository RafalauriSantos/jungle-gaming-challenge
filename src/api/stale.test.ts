import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { nftDetailOptions, nftListOptions } from './nfts'

afterEach(() => vi.restoreAllMocks())

describe('a superseded request is cancelled', () => {
  it('API-7#1: the catalog list and the detail hand the Query signal to Axios, so changing params aborts the older request', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: {} })
    const controller = new AbortController()
    const context = { signal: controller.signal } as never
    await (nftListOptions({}).queryFn as (c: never) => Promise<unknown>)(context)
    await (nftDetailOptions('nft-004').queryFn as (c: never) => Promise<unknown>)(context)
    expect(get).toHaveBeenCalledTimes(2)
    for (const [, config] of get.mock.calls) expect(config?.signal).toBe(controller.signal)
  })
})
