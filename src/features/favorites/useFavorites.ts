import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoriteKeys, favoritesOptions, setFavoriteRequest } from '@/api/favorites'
import { announce } from '@/lib/announce'
import { useUser } from '@/session/store'

type Favorites = { nftIds: string[] }

export function useFavorites() {
  const user = useUser()
  return useQuery({ ...favoritesOptions(user?.id ?? ''), enabled: !!user })
}

/** Toggles a favorite at once, puts it back if the server refuses, then refetches. */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const user = useUser()
  return useMutation({
    mutationFn: ({ nftId, on }: { nftId: string; on: boolean }) => setFavoriteRequest(nftId, on),
    onMutate: async ({ nftId, on }) => {
      const key = favoriteKeys.all(user?.id ?? '')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      queryClient.setQueryData<Favorites>(key, (old) => {
        const ids = (old?.nftIds ?? []).filter((id) => id !== nftId)
        return { nftIds: on ? [...ids, nftId] : ids }
      })
      return { key, previous }
    },
    onSuccess: (_, { on }) => announce(on ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.'),
    onError: (_error, { on }, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
      announce(on ? 'Não foi possível favoritar. Tente novamente.' : 'Não foi possível remover o favorito. Tente novamente.')
    },
    onSettled: (_data, _error, _vars, context) => {
      if (context) void queryClient.invalidateQueries({ queryKey: context.key })
    },
  })
}
