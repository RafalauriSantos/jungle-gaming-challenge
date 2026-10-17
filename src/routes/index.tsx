import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { validateCatalogSearch } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  component: Home,
})

function Home() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <CatalogPage
      search={search}
      // Any filter change goes back to page 1.
      onChange={(patch) => navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) })}
      onReset={() => navigate({ search: {} })}
    />
  )
}
