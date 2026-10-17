import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  /** Names the control for assistive tech, e.g. "Quantidade de Emerald Ape #042". */
  label: string
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
  /** `pill` and `round` are the two cart frames; `default` is the detail page. */
  variant?: 'default' | 'pill' | 'round' | 'large'
}

/** A whole-number quantity with limits. Each button is disabled at its limit, so the state is not just a color. */
const BUTTON = {
  default: 'size-6 rounded-full bg-primary text-ink disabled:bg-surface-raised disabled:text-tone disabled:opacity-100',
  pill: 'h-[30px] w-5 rounded-[20px] border border-ink bg-primary text-ink shadow-[0_4px_6px_rgba(20,13,10,0.15)] disabled:bg-surface-raised disabled:text-tone disabled:opacity-100',
  large: 'h-[49.5px] w-[33px] rounded-[33px] border border-ink bg-primary text-ink shadow-[0_6.6px_9.9px_rgba(20,13,10,0.15)] disabled:bg-surface-raised disabled:text-tone disabled:opacity-100',
  round: 'size-6 rounded-full border border-border bg-surface-raised text-foreground disabled:text-tone disabled:opacity-100',
} as const

export function Stepper({ label, value, min = 1, max, onChange, disabled, className, variant = 'default' }: Props) {
  const button = BUTTON[variant]
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-3', className)}>
      <Button type="button" size="icon-sm" className={button} aria-label="Diminuir quantidade" disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <Minus aria-hidden className={variant === 'pill' ? 'size-4' : variant === 'large' ? 'size-[26px]' : 'size-3.5'} />
      </Button>
      <output aria-live="polite" className={cn('min-w-4 text-center', variant === 'pill' ? 'text-[17px]' : variant === 'large' ? 'text-[20px]' : variant === 'round' ? 'text-base' : 'text-sm')}>
        {value}
      </output>
      <Button type="button" size="icon-sm" className={button} aria-label="Aumentar quantidade" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden className={variant === 'pill' ? 'size-4' : variant === 'large' ? 'size-[26px]' : 'size-3.5'} />
      </Button>
    </div>
  )
}
