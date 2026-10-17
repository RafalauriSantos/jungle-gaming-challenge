import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changePasswordRequest, profileKeys, profileOptions, removeAvatarRequest, setAvatarRequest, updateProfileRequest } from '@/api/profile'
import type { Profile } from '@/api/types'
import { updateSessionUser, useUser } from '@/session/store'

export function useProfile() {
  const user = useUser()
  return useQuery({ ...profileOptions(user?.id ?? ''), enabled: !!user })
}

/** Every profile write answers with the whole profile: keep the cache and the signed-in user in step with it. */
function useProfileWrite<V>(request: (variables: V) => Promise<Profile>) {
  const queryClient = useQueryClient()
  const user = useUser()
  return useMutation({
    mutationFn: request,
    onSuccess: (profile) => {
      if (!user) return
      queryClient.setQueryData(profileKeys.all(user.id), profile)
      updateSessionUser({ id: user.id, username: profile.username, email: profile.email })
    },
  })
}

export const useUpdateProfile = () => useProfileWrite(updateProfileRequest)
export const useSetAvatar = () => useProfileWrite(setAvatarRequest)
export const useRemoveAvatar = () => useProfileWrite(() => removeAvatarRequest())
export const useChangePassword = () => useMutation({ mutationFn: changePasswordRequest })
