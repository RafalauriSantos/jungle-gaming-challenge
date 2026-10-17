import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import type { Profile } from '@/api/types'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarEditor } from './AvatarEditor'
import { ProfileField } from './ProfileField'
import { validatePassword, validateProfile } from './rules'
import { useChangePassword, useProfile, useUpdateProfile } from './useProfile'

const NO_PASSWORD = { currentPassword: '', newPassword: '', confirmNewPassword: '' }

/** One form, as the frame draws it: the data, the avatar, the password and a single "Salvar". */
function ProfileForm({ profile }: { profile: Profile }) {
  const formRef = useRef<HTMLFormElement>(null)
  const update = useUpdateProfile()
  const change = useChangePassword()
  const [values, setValues] = useState({
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    walletNickname: profile.walletNickname,
  })
  const [password, setPassword] = useState(NO_PASSWORD)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const pending = update.isPending || change.isPending
  const touchedPassword = Object.values(password).some(Boolean)

  const setValue = (key: keyof typeof values) => (value: string) => {
    setSaved(false)
    setValues((v) => ({ ...v, [key]: value }))
  }
  const setPass = (key: keyof typeof password) => (value: string) => {
    setSaved(false)
    setPassword((p) => ({ ...p, [key]: value }))
  }
  useEffect(() => {
    if (Object.keys(errors).length) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pending) return
    setSaved(false)
    const found = { ...validateProfile(values), ...(touchedPassword ? validatePassword(password) : {}) }
    setErrors(found)
    if (Object.keys(found).length) return
    try {
      await update.mutateAsync(values)
      if (touchedPassword) {
        await change.mutateAsync(password)
        setPassword(NO_PASSWORD)
      }
      setSaved(true)
    } catch (error) {
      setErrors(errorBodyOf(error)?.fields ?? { form: 'Não foi possível salvar. Tente novamente.' })
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-label="Dados do perfil" className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
          <ProfileField id="profile-displayName" label="Nome de exibição" autoComplete="name" required value={values.displayName} onChange={setValue('displayName')} error={errors.displayName} />
          <ProfileField id="profile-username" label="Nome de usuário" autoComplete="username" required value={values.username} onChange={setValue('username')} error={errors.username} />
          <ProfileField id="profile-email" label="E-mail" type="email" autoComplete="email" required value={values.email} onChange={setValue('email')} error={errors.email} />
          <ProfileField
            id="profile-ensName"
            label="Nome ENS"
            autoComplete="off"
            required
            value={values.ensName}
            onChange={setValue('ensName')}
            error={errors.ensName}
            prefix={<span aria-hidden className="grid h-10 w-[78px] shrink-0 place-items-center rounded-[3px] border border-input text-[15px]">.eth</span>}
          />
          <ProfileField id="profile-walletNickname" label="Apelido da carteira" autoComplete="off" required value={values.walletNickname} onChange={setValue('walletNickname')} error={errors.walletNickname} />
          <AvatarEditor avatarUrl={profile.avatarUrl} name={profile.displayName} />
        </div>
      </div>

      <section aria-labelledby="password-title" className="flex max-w-[417px] flex-col gap-6">
        <h2 id="password-title" className="text-base font-medium leading-4">Alterar senha</h2>
        <ProfileField id="password-current" label="Senha atual" type="password" autoComplete="current-password" value={password.currentPassword} onChange={setPass('currentPassword')} error={errors.currentPassword} />
        <ProfileField id="password-new" label="Nova senha" type="password" autoComplete="new-password" value={password.newPassword} onChange={setPass('newPassword')} error={errors.newPassword} />
        <ProfileField id="password-confirm" label="Confirmar nova senha" type="password" autoComplete="new-password" value={password.confirmNewPassword} onChange={setPass('confirmNewPassword')} error={errors.confirmNewPassword} />
      </section>

      {errors.form && <FieldError>{errors.form}</FieldError>}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending} className="h-10 w-[131px] rounded-[3px] text-sm font-bold">
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
        <p role="status" className="text-sm text-text-accent">
          {saved ? 'Alterações salvas.' : ''}
        </p>
      </div>
    </form>
  )
}

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
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }
  return (
    <section aria-labelledby="profile-title" className="flex flex-col gap-8">
      <h1 id="profile-title" className="text-base font-bold leading-4">Perfil do colecionador</h1>
      <ProfileForm profile={data} />
    </section>
  )
}
