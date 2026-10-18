import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const box = 'touch relative grid size-[35px] place-items-center rounded border text-lg'

/** Page numbers around the current page; the first and last are always kept. */
function pageList(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
}

export function Pagination({ page, total }: { page: number; total: number }) {
  if (total <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: page - 1 > 1 ? page - 1 : undefined })}
          aria-label="Página anterior"
          className={cn(box, 'border-border')}
        >
          <ChevronLeft aria-hidden className="size-[18px]" />
        </Link>
      )}
      {pageList(page, total).map((p, i, all) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && all[i - 1]! < p - 1 && <span aria-hidden>…</span>}
          <Link
            to="/"
            search={(prev) => ({ ...prev, page: p > 1 ? p : undefined })}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Página ${p}`}
            className={cn(box, p === page ? 'border-primary bg-primary font-bold text-ink' : 'border-border')}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < total && (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: page + 1 })}
          aria-label="Próxima página"
          className={cn(box, 'border-border')}
        >
          <ChevronRight aria-hidden className="size-[18px]" />
        </Link>
      )}
    </nav>
  )
}
