/**
 * What the user sees when a screen throws while it renders. Plain anchors and buttons, no router hooks: the router
 * itself may be the thing that is broken.
 */
export function RouteError({ error, reset }: { error: unknown; reset?: () => void }) {
  const detail = error instanceof Error ? error.message : undefined
  return (
    <main className="mx-auto flex max-w-[1232px] flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Algo deu errado nesta tela</h1>
      <p role="alert" className="text-text-secondary">
        Não foi possível mostrar esta página. Seus dados estão seguros; tente de novo ou volte ao início.
      </p>
      {detail && <p className="text-xs text-tone">Detalhe técnico: {detail}</p>}
      <div className="flex gap-3">
        {reset && (
          <button type="button" onClick={reset} className="h-10 rounded-md bg-primary px-4 font-bold text-ink">
            Tentar novamente
          </button>
        )}
        <a href="/" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-text-accent">
          Voltar ao início
        </a>
      </div>
    </main>
  )
}
