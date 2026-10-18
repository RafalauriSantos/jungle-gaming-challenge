import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import type { Wallet, WalletInput, Wallets } from '@/api/types'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { validateWallet } from '@/lib/domain/wallet-rules'
import { fromWallet, WalletFields, type Values } from './WalletFields'
import { useSaveWallet } from './useWallets'

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

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-label={slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'} className="flex flex-col gap-5">
      <WalletFields idPrefix={slot} values={values} errors={errors} set={set} />
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
