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
}

/** A labelled input whose error is linked to it and announced. */
export function ProfileField({ id, label, type = 'text', autoComplete, value, onChange, error }: Props) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )
}
