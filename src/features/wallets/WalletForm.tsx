import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import { NETWORKS, PROVIDERS, type Wallet, type WalletInput, type Wallets } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { validateWallet } from '@/lib/wallet-rules'
import { NETWORK_LABELS } from '@/features/catalog/search'
import { useSaveWallet } from './useWallets'

export const PROVIDER_LABELS = { metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet' } as const

type Values = Record<keyof WalletInput, string>
const EMPTY: Values = { displayName: '', nickname: '', network: '', profileName: '', address: '', ensOrSecondary: '', walletType: '', referralCode: '', email: '', ensName: '' }

const fromWallet = (w: Partial<WalletInput> | null | undefined): Values => ({ ...EMPTY, ...Object.fromEntries(Object.entries(w ?? {}).filter(([k, v]) => k in EMPTY && typeof v === 'string')) })

interface Props {
  slot: keyof Wallets
  wallet: Wallet | null
  /** Pre-fills a new wallet (for "Igual à carteira principal"). */
  defaults?: Partial<WalletInput>
}

export function WalletForm({ slot, wallet, defaults }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveWallet(slot)
  const [values, setValues] = useState<Values>(() => fromWallet(wallet ?? defaults))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const set = (key: keyof Values) => (value: string) => {
    setSaved(false)
    setValues((v) => ({ ...v, [key]: value }))
  }
  const ethereum = values.network === 'ethereum'

  useEffect(() => {
    if (Object.keys(errors).length) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (save.isPending) return
    const found = validateWallet(values as unknown as Partial<WalletInput>)
    setErrors(found)
    setSaved(false)
    if (Object.keys(found).length) return
    const { ensOrSecondary, ensName, ...rest } = values
    save.mutate(
      { ...rest, ...(ensOrSecondary && { ensOrSecondary }), ...(ensName && { ensName }) } as unknown as WalletInput,
      {
        onSuccess: () => setSaved(true),
        onError: (error) => setErrors(errorBodyOf(error)?.fields ?? { form: 'Não foi possível salvar a carteira. Tente novamente.' }),
      },
    )
  }

  const id = (key: string) => `${slot}-${key}`
  const text = (key: keyof Values, label: string, opts: { placeholder?: string; required?: boolean; type?: string; autoComplete?: string; hideLabel?: boolean } = {}) => (
    <Field data-invalid={errors[key] ? true : undefined}>
      <FieldLabel htmlFor={id(key)} className={opts.hideLabel ? 'sr-only' : undefined}>
        {label}
        {opts.required !== false && <span aria-hidden className="text-coral">*</span>}
      </FieldLabel>
      <Input
        id={id(key)}
        name={key}
        type={opts.type ?? 'text'}
        value={values[key]}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        onChange={(e) => set(key)(e.target.value)}
        required={opts.required !== false}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id(key)}-error` : undefined}
      />
      {errors[key] && <FieldError id={`${id(key)}-error`}>{errors[key]}</FieldError>}
    </Field>
  )
  const choice = (key: 'network' | 'walletType', label: string, placeholder: string, options: readonly (readonly [string, string])[]) => (
    <Field data-invalid={errors[key] ? true : undefined}>
      <FieldLabel htmlFor={id(key)}>
        {label}
        <span aria-hidden className="text-coral">*</span>
      </FieldLabel>
      <Select value={values[key] || null} onValueChange={(v) => set(key)(v ?? '')}>
        <SelectTrigger id={id(key)} aria-invalid={errors[key] ? true : undefined} aria-describedby={errors[key] ? `${id(key)}-error` : undefined}>
          <SelectValue placeholder={placeholder}>{(v: string) => options.find(([value]) => value === v)?.[1]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(([value, text]) => (
            <SelectItem key={value} value={value}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[key] && <FieldError id={`${id(key)}-error`}>{errors[key]}</FieldError>}
    </Field>
  )

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-label={slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
        {text('nickname', 'Apelido da carteira')}
        {choice('network', 'Rede', 'Selecione uma rede', NETWORKS.map((n) => [n, NETWORK_LABELS[n]] as const))}
        {text('profileName', 'Nome do perfil')}
        {text('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira' })}
        <div className="md:self-end">{text('ensOrSecondary', 'ENS ou carteira secundária (opcional)', { placeholder: 'ENS ou carteira secundária (opcional)', required: false, hideLabel: true })}</div>
        {choice('walletType', 'Tipo de carteira', 'Selecione uma carteira', PROVIDERS.map((p) => [p, PROVIDER_LABELS[p]] as const))}
        {text('referralCode', 'Código de indicação')}
        {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        <Field data-invalid={errors.ensName ? true : undefined}>
          <FieldLabel htmlFor={id('ensName')}>
            Nome ENS
            {ethereum && <span aria-hidden className="text-coral">*</span>}
          </FieldLabel>
          <div className="flex gap-2">
            <span aria-hidden className="grid h-10 shrink-0 place-items-center rounded-[5px] border border-input px-3 text-sm">.eth</span>
            <Input
              id={id('ensName')}
              name="ensName"
              value={values.ensName}
              onChange={(e) => set('ensName')(e.target.value)}
              required={ethereum}
              aria-invalid={errors.ensName ? true : undefined}
              aria-describedby={errors.ensName ? `${id('ensName')}-error` : undefined}
            />
          </div>
          {errors.ensName && <FieldError id={`${id('ensName')}-error`}>{errors.ensName}</FieldError>}
        </Field>
      </div>
      {errors.form && <FieldError>{errors.form}</FieldError>}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={save.isPending} className="h-[29px] rounded-[4px] px-3 text-xs font-bold">
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
        <p role="status" className="text-sm text-text-accent">
          {saved ? 'Carteira salva.' : ''}
        </p>
      </div>
    </form>
  )
}
