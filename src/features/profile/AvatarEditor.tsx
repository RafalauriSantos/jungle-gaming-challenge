import { ImageIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import { useRemoveAvatar, useSetAvatar } from './useProfile'

const TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 1_000_000

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/** "Avatar": the picture (or the placeholder), "Alterar" to choose a file and "Remover". */
export function AvatarEditor({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const input = useRef<HTMLInputElement>(null)
  const set = useSetAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState('')
  const busy = set.isPending || remove.isPending

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    if (!TYPES.includes(file.type)) return setError('Use uma imagem PNG, JPEG ou WebP.')
    if (file.size > MAX_BYTES) return setError('A imagem deve ter no máximo 1 MB.')
    try {
      await set.mutateAsync(await readAsDataUrl(file))
    } catch (err) {
      setError(errorBodyOf(err)?.fields?.avatar ?? 'Não foi possível salvar a foto. Tente novamente.')
    }
  }

  async function onRemove() {
    setError('')
    try {
      await remove.mutateAsync(undefined)
    } catch {
      setError('Não foi possível remover a foto. Tente novamente.')
    }
  }

  return (
    <section aria-labelledby="avatar-label" className="flex flex-col gap-2.5">
      <p id="avatar-label" className="text-[15px] leading-[15px]">Avatar</p>
      <div className="flex items-center gap-6">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`Foto de ${name}`} width={50} height={50} className="size-[50px] rounded-full object-cover" />
        ) : (
          <span aria-hidden className="grid size-[50px] place-items-center rounded-full border border-border bg-surface-raised">
            <ImageIcon className="size-6 text-text-accent" strokeWidth={1.5} />
          </span>
        )}
        <div className="flex items-center gap-5">
          <input ref={input} type="file" accept={TYPES.join(',')} onChange={onFile} aria-label="Escolher foto" className="sr-only" tabIndex={-1} />
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="h-10 w-[98px] rounded-[3px] bg-primary text-sm font-bold text-ink disabled:opacity-50">
            Alterar
          </button>
          {avatarUrl && (
            <button type="button" aria-label="Remover foto" disabled={busy} onClick={() => void onRemove()} className="text-sm disabled:opacity-50">
              Remover
            </button>
          )}
        </div>
      </div>
      <p role="alert" className="text-xs text-destructive">
        {error}
      </p>
    </section>
  )
}
