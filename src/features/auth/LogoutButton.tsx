import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogoutAndLeave } from './useAuth'

/** The profile screen's logout: the only one on mobile. */

export function LogoutButton() {
  const leave = useLogoutAndLeave()
  return (
    <Button variant="outline" onClick={leave}>
      <LogOut aria-hidden />
      Sair
    </Button>
  )
}
