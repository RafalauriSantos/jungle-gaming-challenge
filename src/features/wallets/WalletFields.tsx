import { cn } from '@/lib/utils'
import { NETWORKS, PROVIDERS, type WalletInput } from '@/api/types'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NETWORK_LABELS } from '@/features/catalog/search'

const LABEL = 'h-[29px] gap-0 text-[15px] font-normal leading-[15px]'
const STAR = 'text-[22px] leading-[29px] text-coral'
const CONTROL = 'h-10 rounded-[3px] px-3 text-[14px] placeholder:text-tone'

export const PROVIDER_LABELS = { metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet' } as const

export type Values = Record<keyof WalletInput, string>
export const EMPTY: Values = { displayName: '', nickname: '', network: '', profileName: '', address: '', ensOrSecondary: '', walletType: '', referralCode: '', email: '', ensName: '' }

export const fromWallet = (w: Partial<WalletInput> | null | undefined): Values => ({ ...EMPTY, ...Object.fromEntries(Object.entries(w ?? {}).filter(([k, v]) => k in EMPTY && typeof v === 'string')) })

interface Props {
  idPrefix: string
  values: Values
  errors: Record<string, string>
  set: (key: keyof Values) => (value: string) => void
  /** Shows the data without letting it change (a saved wallet seen at checkout). */
  readOnly?: boolean
}

/** The ten wallet fields, laid out as in the Figma. Used by the wallets screen and by checkout. */
export function WalletFields({ idPrefix, values, errors, set, readOnly }: Props) {
  const ethereum = values.network === 'ethereum'
  const id = (key: string) => `${idPrefix}-${key}`
  const text = (key: keyof Values, label: string, opts: { placeholder?: string; required?: boolean; type?: string; autoComplete?: string; hideLabel?: boolean } = {}) => (
    <Field data-invalid={errors[key] ? true : undefined} className="gap-0">
      <FieldLabel htmlFor={id(key)} className={cn(LABEL, opts.hideLabel && 'sr-only w-px!')}>
        {label}
        {opts.required !== false && <span aria-hidden className={STAR}>*</span>}
      </FieldLabel>
      <Input
        id={id(key)}
        name={key}
        className={CONTROL}
        type={opts.type ?? 'text'}
        value={values[key]}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        onChange={(e) => set(key)(e.target.value)}
        required={opts.required !== false}
        disabled={readOnly}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id(key)}-error` : undefined}
      />
      {errors[key] && <FieldError id={`${id(key)}-error`}>{errors[key]}</FieldError>}
    </Field>
  )
  const choice = (key: 'network' | 'walletType', label: string, placeholder: string, options: readonly (readonly [string, string])[]) => (
    <Field data-invalid={errors[key] ? true : undefined} className="gap-0">
      <FieldLabel htmlFor={id(key)} className={LABEL}>
        {label}
        <span aria-hidden className={STAR}>*</span>
      </FieldLabel>
      <Select disabled={readOnly} value={values[key] || null} onValueChange={(v) => set(key)(v ?? '')}>
        <SelectTrigger className={CONTROL} id={id(key)} aria-invalid={errors[key] ? true : undefined} aria-describedby={errors[key] ? `${id(key)}-error` : undefined}>
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
      <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
        {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
        {text('nickname', 'Apelido da carteira')}
        {choice('network', 'Rede', 'Selecione uma rede', NETWORKS.map((n) => [n, NETWORK_LABELS[n]] as const))}
        {text('profileName', 'Nome do perfil')}
        {text('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira' })}
        <div className="flex flex-col justify-end md:h-[69px]">{text('ensOrSecondary', 'ENS ou carteira secundária (opcional)', { placeholder: 'ENS ou carteira secundária (opcional)', required: false, hideLabel: true })}</div>
        {choice('walletType', 'Tipo de carteira', 'Selecione uma carteira', PROVIDERS.map((p) => [p, PROVIDER_LABELS[p]] as const))}
        {text('referralCode', 'Código de indicação')}
        {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        <Field data-invalid={errors.ensName ? true : undefined}>
          <FieldLabel htmlFor={id('ensName')} className={LABEL}>
            Nome ENS
            {ethereum && <span aria-hidden className={STAR}>*</span>}
          </FieldLabel>
          <div className="flex gap-2">
            <span aria-hidden className="grid h-10 shrink-0 place-items-center rounded-[3px] border border-input px-3 text-[15px]">.eth</span>
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
  )
}
