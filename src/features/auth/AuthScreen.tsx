import { Link, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { useMediaQuery } from '@/lib/ui/useMediaQuery'
import { LoginForm, SignupForm } from './AuthForms'
import { SocialButtons } from './SocialButtons'

interface Props {
  mode: 'login' | 'signup'
  /** Where to go after success; already checked to be a path on this site. */
  redirect?: string
  reason?: 'session_expired'
}

const COPY = {
  login: { lead: 'Entre para gerenciar sua carteira, coleção e perfil de criador.', mobileTitle: 'Entrar', switchText: 'Novo na Kurio?', switchLink: 'Crie uma conta', to: '/cadastrar' },
  signup: { lead: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.', mobileTitle: 'Criar perfil de colecionador', switchText: 'Já tem uma conta?', switchLink: 'Entre', to: '/entrar' },
} as const

/** Desktop and tablet: a modal over the home page. Mobile: its own page. As drawn in the Figma. */
export function AuthScreen({ mode, redirect, reason }: Props) {
  const router = useRouter()
  const desktop = useMediaQuery('(min-width: 768px)')
  const copy = COPY[mode]
  const done = () => router.history.push(redirect ?? '/')
  const notice = reason === 'session_expired' && (
    <p role="status" className="mb-3 text-center text-sm text-text-accent">
      Sua sessão expirou. Entre novamente para continuar.
    </p>
  )

  if (!desktop) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-7 pb-10 pt-28">
        <p aria-hidden className="text-center text-[28px] font-bold tracking-[0.2em]">KURIO</p>
        <h1 className="mb-8 mt-20 text-center text-xl font-bold">{copy.mobileTitle}</h1>
        {notice}
        {mode === 'login' ? <LoginForm onDone={done} large /> : <SignupForm onDone={done} large />}
        <div className="mt-8">
          <SocialButtons />
        </div>
        <p className="mt-10 text-center text-text-secondary">
          {copy.switchText}{' '}
          <Link to={copy.to} search={{ redirect }} className="md:underline">
            {copy.switchLink}
          </Link>
        </p>
      </main>
    )
  }

  const tab = (label: string, active: boolean, to: '/entrar' | '/cadastrar') =>
    active ? (
      <DialogTitle className="text-xl font-medium text-text-accent">{label}</DialogTitle>
    ) : (
      <Link to={to} search={{ redirect }} className="text-xl font-medium">
        {label}
      </Link>
    )

  return (
    <>
      {/* The home page stays visible behind the modal, as in the frame. */}
      <div inert aria-hidden="true">
        <CatalogPage search={{}} onChange={() => {}} onReset={() => {}} />
      </div>
      <Dialog open onOpenChange={(open) => !open && void router.navigate({ to: '/' })}>
        <DialogContent
          showCloseButton={false}
          initialFocus={() => document.getElementById(mode === 'login' ? 'login-email' : 'signup-username')}
          className="w-[500px] gap-0 rounded-none bg-surface-card p-0 ring-0 sm:max-w-[500px]"
        >
          <div className="flex flex-col items-center gap-10 px-12 pt-12">
            <div className="flex items-center gap-2">
              {tab('Entrar', mode === 'login', '/entrar')}
              <span aria-hidden className="h-4 w-px bg-coral" />
              {tab('Criar conta', mode === 'signup', '/cadastrar')}
            </div>
            <DialogDescription className="text-center text-[13px] text-foreground">{copy.lead}</DialogDescription>
          </div>
          <div className="px-20 pt-6">
            {notice}
            {mode === 'login' ? <LoginForm onDone={done} /> : <SignupForm onDone={done} />}
          </div>
          <div className="px-20 pb-10 pt-6">
            <SocialButtons />
          </div>
          <div aria-hidden className="h-[10px] bg-primary" />
          {/* Last in the DOM so the first field receives focus when the modal opens. */}
          <DialogClose render={<Button variant="ghost" size="icon-sm" className="absolute right-3 top-3 text-text-accent hover:bg-transparent" />}>
            <X aria-hidden />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
