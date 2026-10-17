import { redirect } from '@tanstack/react-router'
import { getSession } from './store'

/** For `beforeLoad` of private routes: anonymous visitors go to login and come back afterwards. */
export function requireSession({ href }: { href: string }) {
  if (!getSession()) throw redirect({ to: '/entrar', search: { redirect: href } })
}
