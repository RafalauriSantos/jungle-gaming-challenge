import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { loginRequest, logoutRequest, signupRequest } from '@/api/auth'
import type { AuthResponse } from '@/api/types'
import { claimVisitorMerge } from '@/features/cart/useVisitorMerge'
import { beginSession, endSession } from '@/session/actions'

/** Starts the session, then hands over what the visitor had put in the cart. */
async function start(queryClient: QueryClient, auth: AuthResponse) {
  beginSession(queryClient, auth)
  await claimVisitorMerge(queryClient, auth.user.id)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: loginRequest, onSuccess: (auth) => start(queryClient, auth) })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: signupRequest, onSuccess: (auth) => start(queryClient, auth) })
}

/** Logs out on the server on a best-effort basis; the local session ends either way. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: logoutRequest, onSettled: () => endSession(queryClient, { forget: true }) })
}

/** Ends the session and goes home. */
export function useLogoutAndLeave() {
  const router = useRouter()
  const logout = useLogout()
  return () => logout.mutate(undefined, { onSettled: () => void router.navigate({ to: '/' }) })
}
