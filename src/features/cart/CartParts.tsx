import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { CartModel } from './cartModel'

/** The coupon field. Both frames draw it; the desktop one is a rectangle, the mobile one a pill. */
export function CouponForm({ m, pill }: { m: CartModel; pill?: boolean }) {
  const [draft, setDraft] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (draft.trim()) m.applyCoupon(draft.trim())
  }
  if (m.coupon) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          Código <strong>{m.coupon}</strong>
        </span>
        <Button type="button" variant="link" className="h-auto p-0 text-text-accent" onClick={m.removeCoupon}>Remover código</Button>
      </div>
    )
  }
  return (
    <form onSubmit={submit} aria-label="Cupom" className={cn('flex flex-col', pill ? '' : 'gap-2')}>
      <label htmlFor="coupon" className={cn('text-sm font-bold leading-4', pill && 'sr-only')}>Código promocional</label>
      <div className={cn('flex items-center border', pill ? 'h-[50px] rounded-[40px] border-border bg-surface-card pl-4 shadow-[0_6px_10px_rgba(10,6,4,0.45)]' : 'h-10 rounded-[3px] border-primary pl-2')}>
        <input
          id="coupon"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Digite o código promocional..."
          className={cn('min-w-0 flex-1 bg-transparent outline-none placeholder:text-tone', pill ? 'text-[13px]' : 'text-xs')}
        />
        <button
          type="submit"
          className={cn(
            'h-full shrink-0 font-bold',
            pill ? 'w-[97px] rounded-[40px] bg-gradient-to-r from-primary/55 to-primary text-[15px] text-foreground' : 'w-[102px] rounded-r-[3px] bg-primary text-[15px] text-ink',
          )}
        >
          Aplicar
        </button>
      </div>
    </form>
  )
}

export function CouponStatus({ m }: { m: CartModel }) {
  const status = m.quote?.coupon?.status
  return (
    <p role={status === 'applied' ? 'status' : 'alert'} className={cn('text-sm', status === 'applied' ? 'text-text-accent' : 'text-destructive')}>
      {status === 'applied' ? 'Código aplicado.' : (m.quote?.coupon?.message ?? '')}
    </p>
  )
}

/** Subtotal, discount, fee and total, as the API priced them. */
export function Totals({ m, value }: { m: CartModel; value: string }) {
  const q = m.quote!
  return (
    <dl className={cn('grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 text-[15px]', m.updating && 'opacity-60')}>
      <dt>Subtotal</dt><dd className={cn('text-right leading-4', value)}>{formatEth(q.subtotal)}</dd>
      <dt>Desconto do lançamento</dt><dd className="text-right">(-) {formatEth(q.discount)}</dd>
      <dt>Taxa de rede</dt><dd className={cn('text-right leading-4', value)}>{formatEth(q.networkFee)}</dd>
      <dt className="col-span-2 -mt-1.5 text-right text-xs leading-4 text-text-accent">Taxa estimada</dt>
      <dt className="text-base font-bold leading-4">Total</dt>
      <dd className="text-right text-lg font-bold leading-4 text-text-accent">{formatEth(q.total)}</dd>
    </dl>
  )
}

export function Notices({ m }: { m: CartModel }) {
  const q = m.quote
  return (
    <>
      {m.notice && <p role="status" className="rounded-md border border-primary p-3 text-sm">{m.notice}</p>}
      <p role="alert" className="text-sm text-destructive">{m.error}</p>
      {q?.issues.map((issue) => (
        <p key={issue.editionId} role="alert" className="text-sm text-destructive">
          {q.lines.find((l) => l.editionId === issue.editionId)?.name}: restam apenas {issue.available} nesta edição. Ajuste a quantidade para continuar.
        </p>
      ))}
    </>
  )
}

/** "Conectar e finalizar" only when the quote is settled and has nothing to fix. */
export function Checkout({ m, className, children }: { m: CartModel; className: string; children: React.ReactNode }) {
  const blocked = m.updating || !!m.quote?.issues.length
  return blocked ? (
    <button type="button" disabled className={cn(className, 'disabled:opacity-50')}>{children}</button>
  ) : (
    <Link to="/pagamento" className={cn(className, 'inline-flex items-center justify-center')}>{children}</Link>
  )
}
