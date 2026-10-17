const POSTS = [
  ['12 de setembro', '6 min', 'Como funciona a propriedade de NFTs', 'Aprenda a colecionar, negociar e verificar ativos digitais.', '/nfts/art-3.webp'],
  ['13 de setembro', '2 min', '10 artistas digitais para acompanhar', 'Conheça criadores que moldam a cultura digital.', '/nfts/art-1.webp'],
  ['15 de setembro', '3 min', 'Raridade, atributos e procedência', 'Entenda raridade, procedência, direitos autorais e utilidade.', '/nfts/art-2.webp'],
  ['15 de setembro', '2 min', 'Como proteger sua carteira', 'Proteja sua carteira, seus ativos e sua identidade.', '/nfts/art-4.webp'],
] as const

// Editorial pages are out of scope, so the cards are informative only.
export function Blog() {
  return (
    <section aria-labelledby="blog-title" className="hidden flex-col items-center gap-10 md:flex">
      <header className="text-center">
        <h2 id="blog-title" className="mb-3 text-[28px] font-bold">Diário da Cunhagem</h2>
        <p className="text-sm text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-4">
        {POSTS.map(([date, read, title, text, img]) => (
          <li key={title} className="flex flex-col overflow-hidden rounded-lg bg-surface-card">
            <img src={img} alt="" aria-hidden loading="lazy" width={268} height={195} className="h-[195px] w-full object-cover" />
            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <p className="text-xs font-medium text-text-secondary">{date} | Leitura de {read}</p>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs font-medium leading-4 text-text-secondary">{text}</p>
              <p className="mt-auto text-xs font-bold text-text-accent">Em breve</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
