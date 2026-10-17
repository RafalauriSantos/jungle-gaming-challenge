import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletForm } from './WalletForm'
import { useWallets } from './useWallets'

export function WalletsScreen() {
  const { data, isPending, isError, refetch } = useWallets()
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6">
        <p>Não foi possível carregar suas carteiras.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }
  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando carteiras" role="status" className="flex flex-col gap-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[330px] w-full" />
      </div>
    )
  }

  const { primary, secondary } = data
  // "Igual à carteira principal" starts the new wallet from the principal's data, to be adjusted.
  const { id: _id, version: _version, nickname: _nickname, ...principalData } = primary ?? ({} as NonNullable<typeof primary>)

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="wallet-primary" className="flex flex-col gap-4">
        <div>
          <h1 id="wallet-primary" className="text-base font-bold">Carteira principal</h1>
          <p className="text-xs text-text-secondary">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </div>
        <WalletForm slot="primary" wallet={primary} />
      </section>

      <section aria-labelledby="wallet-secondary" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="wallet-secondary" className="text-base font-bold">Carteira secundária</h2>
          {!secondary && !adding && (
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox checked={sameAsPrimary} disabled={!primary} onCheckedChange={(v) => setSameAsPrimary(v === true)} />
                Igual à carteira principal
              </label>
              <Button variant="link" className="h-auto p-0 text-text-accent" onClick={() => setAdding(true)}>
                Adicionar
              </Button>
            </div>
          )}
        </div>
        {secondary || adding ? (
          <WalletForm slot="secondary" wallet={secondary} defaults={sameAsPrimary ? principalData : undefined} />
        ) : (
          <p className="text-xs text-text-secondary">Você ainda não adicionou uma carteira secundária.</p>
        )}
      </section>
    </div>
  )
}
