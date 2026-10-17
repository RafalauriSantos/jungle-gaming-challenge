import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  /** Visually hidden label; the Figma shows the same text as a placeholder. */
  label: string
  type?: 'text' | 'email' | 'password'
  placeholder: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}

export function TextField({ id, label, type = 'text', placeholder, autoComplete, value, onChange, error, className }: Props) {
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  const errorId = `${id}-error`
  return (
    <div>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={isPassword && shown ? 'text' : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(isPassword && 'pr-12', className)}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={shown ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={shown}
            onClick={() => setShown((s) => !s)}
            className="absolute inset-y-0 right-3 grid w-8 place-items-center text-tone focus-visible:text-text-accent"
          >
            {shown ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
