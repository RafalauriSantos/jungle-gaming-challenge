import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TextField } from './TextField'
import { useLogin, useSignup } from './useAuth'
import { validateLogin, validateSignup, type Errors } from './validation'

interface FormProps {
  onDone: () => void
  /** Larger controls, as drawn in the mobile frames. */
  large?: boolean
}

/** After new errors render, the first invalid field takes focus so its message is read. */
function useFocusFirstInvalid(form: React.RefObject<HTMLFormElement | null>, errors: Errors) {
  useEffect(() => {
    if (Object.keys(errors).length) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors, form])
}

export function LoginForm({ onDone, large }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const login = useLogin()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string>()
  const field = large ? 'h-[50px] rounded-xl' : ''
  useFocusFirstInvalid(formRef, errors)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (login.isPending) return
    const found = validateLogin(values)
    setErrors(found)
    setFormError(undefined)
    if (Object.keys(found).length) return
    login.mutate(values, {
      onSuccess: onDone,
      onError: (error) => {
        const body = errorBodyOf(error)
        setErrors(body?.fields ?? {})
        setFormError(body?.fields ? undefined : (body?.message ?? 'Não foi possível entrar. Tente novamente.'))
      },
    })
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextField id="login-email" label="E-mail" type="email" placeholder="contato@email.com" autoComplete="email" value={values.email} onChange={(email) => setValues((v) => ({ ...v, email }))} error={errors.email} className={field} />
      <TextField id="login-password" label="Senha" type="password" placeholder="Senha" autoComplete="current-password" value={values.password} onChange={(password) => setValues((v) => ({ ...v, password }))} error={errors.password} className={field} />
      <div className="flex justify-end">
        {/* Password recovery is outside the required flows. */}
        <Button type="button" variant="link" disabled title="Em breve" className="h-auto p-0 text-sm text-text-accent disabled:opacity-75">
          Esqueceu a senha?
        </Button>
      </div>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={login.isPending} className={cn('mt-3 h-[45px] rounded-[5px] text-base font-bold', large && 'h-[60px] rounded-xl')}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

export function SignupForm({ onDone, large }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const signup = useSignup()
  const [values, setValues] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string>()
  const field = large ? 'h-[50px] rounded-xl' : ''
  useFocusFirstInvalid(formRef, errors)
  const set = (key: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [key]: value }))

  function submit(e: FormEvent) {
    e.preventDefault()
    if (signup.isPending) return
    const found = validateSignup(values)
    setErrors(found)
    setFormError(undefined)
    if (Object.keys(found).length) return
    signup.mutate(values, {
      onSuccess: onDone,
      onError: (error) => {
        const body = errorBodyOf(error)
        setErrors(body?.fields ?? {})
        setFormError(body?.fields ? undefined : (body?.message ?? 'Não foi possível criar a conta. Tente novamente.'))
      },
    })
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextField id="signup-username" label="Nome de usuário" placeholder="Nome de usuário" autoComplete="username" value={values.username} onChange={set('username')} error={errors.username} className={field} />
      <TextField id="signup-email" label="E-mail" type="email" placeholder="Digite seu e-mail" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} className={field} />
      <TextField id="signup-password" label="Senha" type="password" placeholder="Senha" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} className={field} />
      <TextField id="signup-confirm" label="Confirmar senha" type="password" placeholder="Confirmar senha" autoComplete="new-password" value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} className={field} />
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={signup.isPending} className={cn('mt-3 h-[45px] rounded-[5px] text-base font-bold', large && 'h-[60px] rounded-xl')}>
        {signup.isPending ? 'Criando…' : large ? 'Criar perfil' : 'Criar conta'}
      </Button>
    </form>
  )
}
