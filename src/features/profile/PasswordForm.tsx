import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { validatePassword } from './rules'
import { ProfileField } from './ProfileField'
import { useChangePassword } from './useProfile'

const EMPTY = { currentPassword: '', newPassword: '', confirmNewPassword: '' }

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const change = useChangePassword()
  const [values, setValues] = useState(EMPTY)
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
    if (change.isPending) return
    const found = validatePassword(values)
    setErrors(found)
    setSaved(false)
    if (Object.keys(found).length) return
    change.mutate(values, {
      onSuccess: () => {
        setValues(EMPTY)
        setSaved(true)
      },
      onError: (error) => setErrors(errorBodyOf(error)?.fields ?? { form: 'Não foi possível alterar a senha. Tente novamente.' }),
    })
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-label="Alterar senha" className="flex max-w-md flex-col gap-4">
      <ProfileField id="password-current" label="Senha atual" type="password" autoComplete="current-password" value={values.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
      <ProfileField id="password-new" label="Nova senha" type="password" autoComplete="new-password" value={values.newPassword} onChange={set('newPassword')} error={errors.newPassword} />
      <ProfileField id="password-confirm" label="Confirmar nova senha" type="password" autoComplete="new-password" value={values.confirmNewPassword} onChange={set('confirmNewPassword')} error={errors.confirmNewPassword} />
      {errors.form && <FieldError>{errors.form}</FieldError>}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={change.isPending} className="h-[29px] rounded-[4px] px-3 text-xs font-bold">
          {change.isPending ? 'Salvando…' : 'Alterar senha'}
        </Button>
        <p role="status" className="text-sm text-text-accent">
          {saved ? 'Senha alterada.' : ''}
        </p>
      </div>
    </form>
  )
}
