import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { safeRedirect } from '@/lib/domain/redirect'
import { getSession } from '@/session/store'

export const Route = createFileRoute('/entrar')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; reason?: 'session_expired' } => ({
    redirect: safeRedirect(s.redirect),
    reason: s.reason === 'session_expired' ? 'session_expired' : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (getSession()) throw redirect({ href: search.redirect ?? '/' })
  },
  component: Login,
})

function Login() {
  const { redirect: to, reason } = Route.useSearch()
  return <AuthScreen mode="login" redirect={to} reason={reason} />
}
