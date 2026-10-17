import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { loginRequest, logoutRequest, signupRequest } from '@/api/auth'
import { beginSession, endSession } from '@/session/actions'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: loginRequest, onSuccess: (auth) => beginSession(queryClient, auth) })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: signupRequest, onSuccess: (auth) => beginSession(queryClient, auth) })
}

/** Logs out on the server on a best-effort basis; the local session ends either way. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: logoutRequest, onSettled: () => endSession(queryClient) })
}

/** Ends the session and goes home. */
export function useLogoutAndLeave() {
  const router = useRouter()
  const logout = useLogout()
  return () => logout.mutate(undefined, { onSettled: () => void router.navigate({ to: '/' }) })
}
