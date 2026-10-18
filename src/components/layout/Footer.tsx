import facebook from '@/assets/icons/social-1.svg'
import instagram from '@/assets/icons/social-2.svg'
import twitter from '@/assets/icons/social-3.svg'
import linkedin from '@/assets/icons/social-4.svg'
import youtube from '@/assets/icons/social-5.svg'

const FEATURES = [
  ['W', 'Segurança da carteira', 'Proteja sua carteira e colecione arte digital verificada com confiança.'],
  ['C', 'Criadores em destaque', 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.'],
  ['D', 'Alertas de lançamentos', 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.'],
] as const

// Link targets are out of scope (no editorial/support pages): rendered as plain text.
const COLUMNS = [
  ['Meu perfil', ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']],
  ['Central de ajuda', ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']],
  ['Coleções', ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']],
] as const

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1232px] px-4 pb-24 md:pb-6">
      <div className="hidden bg-surface-card p-8 md:grid md:grid-cols-3 md:gap-6 lg:grid-cols-[265px_266px_265px_1fr] lg:gap-0">
        {FEATURES.map(([letter, title, text]) => (
          <section key={title} className="flex flex-col gap-3 border-primary px-4 lg:border-r">
            <span aria-hidden className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl font-bold text-ink">
              {letter}
            </span>
            <h2 className="text-[17px] font-bold leading-4">{title}</h2>
            <p className="max-w-[204px] text-sm leading-[22px] text-text-secondary">{text}</p>
          </section>
        ))}
        <section className="flex flex-col gap-4 px-4 md:col-span-3 lg:col-span-1">
          <h2 className="text-lg font-bold leading-4">Antecipe-se ao próximo lançamento</h2>
          <form onSubmit={(e) => e.preventDefault()} className="flex h-10 rounded-md bg-surface-dark">
            <input
              disabled
              aria-label="E-mail para novidades (indisponível)"
              placeholder="digite seu e-mail..."
              className="min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-tone"
            />
            <button disabled title="Em breve" className="w-[85px] rounded-r-md bg-primary/60 text-lg font-bold text-ink">
              Enviar
            </button>
          </form>
          <p className="text-[13px] leading-[22px] text-text-secondary">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </section>
      </div>

      <div className="hidden items-center gap-6 lg:gap-[92px] bg-surface-dark px-8 py-5 text-sm md:flex">
        <p className="flex-1 text-sm font-bold tracking-[1.4px]">KURIO</p>
        <p className="flex-1 leading-[22px]">Feito para colecionadores,<br />criadores e cultura</p>
        <p className="flex-1">contato@email.com</p>
        <p className="shrink-0 lg:w-[228px]">+55 11 4002 8922</p>
      </div>

      <div className="hidden grid-cols-2 gap-8 bg-surface-card p-8 md:grid lg:grid-cols-[1fr_1fr_1fr_228px] lg:gap-x-[124px]">
        {COLUMNS.map(([title, items]) => (
          <section key={title}>
            <h2 className="mb-2 text-lg font-bold">{title}</h2>
            <ul className="text-sm leading-[30px]">
              {items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </section>
        ))}
        <section className="flex flex-col gap-8">
          <div>
            <h2 className="mb-5 text-lg font-bold">Redes sociais</h2>
            <ul className="flex gap-2.5">
              {[
                ['Facebook', facebook],
                ['Instagram', instagram],
                ['Twitter', twitter],
                ['LinkedIn', linkedin],
                ['YouTube', youtube],
              ].map(([label, src]) => (
                <li key={label}>
                  <img src={src} alt={label} width={30} height={30} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 whitespace-nowrap text-lg font-bold">Carteiras compatíveis</h2>
            <p className="rounded-md border border-border-soft bg-surface-dark px-2 py-2 text-[9px] font-bold tracking-[0.1px] text-text-accent">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </section>
      </div>
      <p className="py-4 text-center text-sm leading-[30px]">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
