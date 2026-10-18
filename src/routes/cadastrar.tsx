import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { safeRedirect } from '@/lib/domain/redirect'
import { getSession } from '@/session/store'

export const Route = createFileRoute('/cadastrar')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(s.redirect) }),
  beforeLoad: ({ search }) => {
    if (getSession()) throw redirect({ href: search.redirect ?? '/' })
  },
  component: Signup,
})

function Signup() {
  const { redirect: to } = Route.useSearch()
  return <AuthScreen mode="signup" redirect={to} />
}
