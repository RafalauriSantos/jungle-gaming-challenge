import { Eye, EyeOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface Props {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  autoComplete: string
  value: string
  onChange: (value: string) => void
  error?: string
  /** Draws the coral asterisk of the frame. */
  required?: boolean
  /** Something drawn before the input, such as the ".eth" box. */
  prefix?: ReactNode
}

/** A labelled input, as the frames draw them: 15 px label, 40 px control. Its error is linked and announced. */
export function ProfileField({ id, label, type = 'text', autoComplete, value, onChange, error, required, prefix }: Props) {
  const [shown, setShown] = useState(false)
  const password = type === 'password'
  return (
    <Field data-invalid={error ? true : undefined} className="gap-2.5">
      <FieldLabel htmlFor={id} className="gap-0 text-[15px] font-normal leading-[15px]">
        {label}
        {required && <span aria-hidden className="text-[22px] leading-[29px] text-coral">*</span>}
      </FieldLabel>
      <div className="flex gap-2.5">
        {prefix}
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            name={id}
            type={password && shown ? 'text' : type}
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={password ? 'h-10 rounded-[3px] pr-11' : 'h-10 rounded-[3px]'}
          />
          {password && (
            <button
              type="button"
              aria-label={`${shown ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
              aria-pressed={shown}
              onClick={() => setShown((s) => !s)}
              className="absolute inset-y-0 right-4 grid place-items-center text-text-secondary"
            >
              {shown ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
            </button>
          )}
        </div>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )
}
