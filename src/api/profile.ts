import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type { PasswordInput, Profile, ProfileInput } from './types'

export const profileKeys = { all: (userId: string) => ['u', userId, 'profile'] as const }

export const profileOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.all(userId),
    queryFn: ({ signal }) => api.get<Profile>('/profile', { signal }).then((r) => r.data),
  })

export const updateProfileRequest = (patch: ProfileInput) => api.patch<Profile>('/profile', patch).then((r) => r.data)
export const setAvatarRequest = (dataUrl: string) => api.put<Profile>('/profile/avatar', { dataUrl }).then((r) => r.data)
export const removeAvatarRequest = () => api.delete<Profile>('/profile/avatar').then((r) => r.data)
export const changePasswordRequest = (input: PasswordInput) => api.post('/profile/password', input).then(() => undefined)
