import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type { NftListParams, NftListResponse } from './types'

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
  })
