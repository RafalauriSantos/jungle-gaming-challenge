import { queryOptions } from '@tanstack/react-query'
import { api } from './client'

export const favoriteKeys = { all: (userId: string) => ['u', userId, 'favorites'] as const }

export const favoritesOptions = (userId: string) =>
  queryOptions({
    queryKey: favoriteKeys.all(userId),
    queryFn: ({ signal }) => api.get<{ nftIds: string[] }>('/favorites', { signal }).then((r) => r.data),
  })

export const setFavoriteRequest = (nftId: string, on: boolean) =>
  (on ? api.put(`/favorites/${nftId}`) : api.delete(`/favorites/${nftId}`)).then(() => undefined)
