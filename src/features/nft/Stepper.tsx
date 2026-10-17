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
}

/** A whole-number quantity with limits. Each button is disabled at its limit, so the state is not just a color. */
export function Stepper({ label, value, min = 1, max, onChange, disabled, className }: Props) {
  const button = 'size-6 rounded-full bg-primary text-ink disabled:bg-surface-raised disabled:text-tone disabled:opacity-100'
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-3', className)}>
      <Button type="button" size="icon-sm" className={button} aria-label="Diminuir quantidade" disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <Minus aria-hidden className="size-3.5" />
      </Button>
      <output aria-live="polite" className="min-w-4 text-center text-sm">
        {value}
      </output>
      <Button type="button" size="icon-sm" className={button} aria-label="Aumentar quantidade" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden className="size-3.5" />
      </Button>
    </div>
  )
}
