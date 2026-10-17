import { queryOptions, replaceEqualDeep } from '@tanstack/react-query'
import { pickNewerNft } from '@/realtime/gate'
import { isAxiosError } from 'axios'
import { api } from './client'
import type { Nft, NftListParams, NftListResponse } from './types'

export const nftKeys = {
  all: ['nfts'] as const,
  list: (params: NftListParams) => [...nftKeys.all, 'list', params] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}

/** Arrays go over the wire as comma-separated values. */
const toQuery = ({ collection, network, ...rest }: NftListParams) => ({
  ...rest,
  collection: collection?.join(','),
  network: network?.join(','),
})

export const nftListOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    // signal lets Query cancel superseded requests when params change
    queryFn: ({ signal }) =>
      api.get<NftListResponse>('/nfts', { params: toQuery(params), signal }).then((r) => r.data),
    placeholderData: (prev) => prev,
    // Items are kept at their newest version: an event may have landed while this read was in flight.
    structuralSharing: (old, read) => {
      const current = old as NftListResponse | undefined
      const next = read as NftListResponse
      const byId = new Map(current?.items.map((n) => [n.id, n]))
      return replaceEqualDeep(old, { ...next, items: next.items.map((n) => pickNewerNft(byId.get(n.id), n)) })
    },
  })

export const nftDetailOptions = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => api.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal }).then((r) => r.data),
    // A missing NFT is an answer, not a transient failure.
    retry: (count, error) => !(isAxiosError(error) && error.response?.status === 404) && count < 2,
    structuralSharing: (old, read) => replaceEqualDeep(old, pickNewerNft(old as Nft | undefined, read as Nft)),
  })
