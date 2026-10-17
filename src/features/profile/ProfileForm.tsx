import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import type { Profile } from '@/api/types'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { validateProfile } from './rules'
import { ProfileField } from './ProfileField'
import { useUpdateProfile } from './useProfile'

export function ProfileForm({ profile }: { profile: Profile }) {
  const formRef = useRef<HTMLFormElement>(null)
  const update = useUpdateProfile()
  const [values, setValues] = useState({ displayName: profile.displayName, username: profile.username, email: profile.email })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const set = (key: keyof typeof values) => (value: string) => {
    setSaved(false)
    setValues((v) => ({ ...v, [key]: value }))
  }
  useEffect(() => {
    if (Object.keys(errors).length) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (update.isPending) return
    const found = validateProfile(values)
    setErrors(found)
    setSaved(false)
    if (Object.keys(found).length) return
    update.mutate(values, {
      onSuccess: () => setSaved(true),
      onError: (error) => setErrors(errorBodyOf(error)?.fields ?? { form: 'Não foi possível salvar o perfil. Tente novamente.' }),
    })
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-label="Dados do perfil" className="flex max-w-md flex-col gap-4">
      <ProfileField id="profile-displayName" label="Nome" autoComplete="name" value={values.displayName} onChange={set('displayName')} error={errors.displayName} />
      <ProfileField id="profile-username" label="Nome de usuário" autoComplete="username" value={values.username} onChange={set('username')} error={errors.username} />
      <ProfileField id="profile-email" label="E-mail" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
      {errors.form && <FieldError>{errors.form}</FieldError>}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={update.isPending} className="h-[29px] rounded-[4px] px-3 text-xs font-bold">
          {update.isPending ? 'Salvando…' : 'Salvar perfil'}
        </Button>
        <p role="status" className="text-sm text-text-accent">
          {saved ? 'Perfil salvo.' : ''}
        </p>
      </div>
    </form>
  )
}
