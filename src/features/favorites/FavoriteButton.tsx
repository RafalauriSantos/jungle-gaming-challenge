import { useRouter } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUser } from '@/session/store'
import { useFavorites, useToggleFavorite } from './useFavorites'

type Props = { nftId: string; name: string; variant?: 'button' | 'icon'; className?: string }

/** The heart. Signed-out visitors are sent to sign in and come back to this page. */
export function FavoriteButton({ nftId, name, variant = 'button', className }: Props) {
  const user = useUser()
  const router = useRouter()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const on = favorites.data?.nftIds.includes(nftId) ?? false

  function onClick() {
    if (!user) {
      void router.navigate({ to: '/entrar', search: { redirect: router.state.location.href } })
      return
    }
    toggle.mutate({ nftId, on: !on })
  }

  const heart = <Heart aria-hidden className={cn('size-4', on && 'fill-current text-primary')} />
  return variant === 'icon' ? (
    <Button type="button" variant="ghost" size="icon" aria-pressed={on} aria-label={`Favoritar ${name}`} onClick={onClick} className={cn('relative touch', className)}>
      {heart}
    </Button>
  ) : (
    <Button type="button" variant="outline" aria-pressed={on} onClick={onClick} className={cn('h-9 gap-2', className)}>
      {heart}
      {on ? 'Favoritado' : 'Favoritar'}
    </Button>
  )
}
