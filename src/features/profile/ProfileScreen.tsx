import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarEditor } from './AvatarEditor'
import { PasswordForm } from './PasswordForm'
import { ProfileForm } from './ProfileForm'
import { useProfile } from './useProfile'

export function ProfileScreen() {
  const { data, isPending, isError, refetch } = useProfile()

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
        <p>Não foi possível carregar seu perfil.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }
  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando perfil" role="status" className="flex flex-col gap-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-[200px] max-w-md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="profile-title" className="flex flex-col gap-5">
        <h1 id="profile-title" className="text-base font-bold">Perfil do colecionador</h1>
        <AvatarEditor avatarUrl={data.avatarUrl} name={data.displayName} />
        <ProfileForm profile={data} />
      </section>
      <section aria-labelledby="password-title" className="flex flex-col gap-4">
        <h2 id="password-title" className="text-base font-bold">Alterar senha</h2>
        <PasswordForm />
      </section>
    </div>
  )
}
