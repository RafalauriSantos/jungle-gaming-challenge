import { User } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { errorBodyOf } from '@/api/client'
import { Button } from '@/components/ui/button'
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
    <section aria-label="Foto do perfil" className="flex items-center gap-4">
      {avatarUrl ? (
        <img src={avatarUrl} alt={`Foto de ${name}`} width={80} height={80} className="size-20 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="grid size-20 place-items-center rounded-full bg-surface-card">
          <User className="size-8" />
        </span>
      )}
      <div className="flex flex-col items-start gap-2">
        <input ref={input} type="file" accept={TYPES.join(',')} onChange={onFile} aria-label="Escolher foto" className="sr-only" tabIndex={-1} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()} className="h-[29px] px-3 text-xs">
            {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
          </Button>
          {avatarUrl && (
            <Button type="button" variant="outline" disabled={busy} onClick={() => void onRemove()} className="h-[29px] px-3 text-xs">
              Remover foto
            </Button>
          )}
        </div>
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      </div>
    </section>
  )
}
