import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Search field that writes to the catalog URL (debounced), from any page. */
export function SearchBox({ className, placeholder }: { className?: string; placeholder: string }) {
  const navigate = useNavigate()
  const urlQuery = useSearch({ strict: false, select: (s) => (s as { q?: string }).q ?? '' })
  const [value, setValue] = useState(urlQuery)
  const timer = useRef<number>(undefined)

  // Keep the field in sync with back/forward navigation.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery)
    setValue(urlQuery)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const go = (q: string, replace: boolean) =>
    navigate({ to: '/', search: (prev) => ({ ...prev, q: q.trim() || undefined, page: undefined }), replace })

  return (
    <form
      role="search"
      className={cn('flex items-center gap-2 rounded-[10px] bg-surface-card px-3', className)}
      onSubmit={(e) => {
        e.preventDefault()
        window.clearTimeout(timer.current)
        go(value, false)
      }}
    >
      <Search aria-hidden className="size-5 shrink-0 text-tone" />
      <input
        type="search"
        aria-label="Buscar NFTs"
        placeholder={placeholder}
        value={value}
        className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-tone focus-visible:outline-none"
        onChange={(e) => {
          setValue(e.target.value)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => go(e.target.value, true), 300)
        }}
      />
    </form>
  )
}
