import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import heroBanner from '@/assets/icons/hero-banner-mobile.svg'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[190px] items-center overflow-hidden rounded-xl bg-surface-card p-4 md:min-h-[450px] lg:h-[450px] md:rounded-none md:bg-transparent md:pl-10"
    >
      <img src={heroBanner} alt="" aria-hidden className="absolute inset-0 size-full object-cover md:hidden" />
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex max-w-[600px] flex-col gap-1.5 md:w-[600px] md:gap-8">
          <p className="text-xs font-medium md:text-sm md:tracking-[1.4px]">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="text-lg font-bold leading-[29px] md:text-[43px] md:leading-[70px]">
            <span className="md:hidden">SEJA DONO DA CULTURA DIGITAL</span>
            <span className="hidden md:block">SEJA DONO DO FUTURO</span>
            <span className="hidden md:block">DA ARTE DIGITAL</span>
          </h1>
          <p className="text-xs leading-[18px] text-text-secondary md:max-w-[557px] md:text-sm md:leading-6">
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
            <span className="hidden md:inline">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </span>
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="touch relative inline-flex w-fit items-center gap-2 text-xs font-bold text-text-accent md:h-10 md:w-[140px] md:justify-center md:rounded-md md:bg-primary md:text-base md:text-ink"
          >
            EXPLORAR
            <ArrowRight aria-hidden className="size-4 md:hidden" />
          </Link>
        </div>
        <div className="relative shrink-0">
          <img
            src="/nfts/art-1.webp"
            srcSet="/nfts/art-1-300.webp 300w, /nfts/art-1.webp 640w"
            sizes="(min-width: 768px) 450px, 138px"
            alt="NFT em destaque: macaco de óculos escuros e jaqueta verde"
            width={450}
            height={450}
            fetchPriority="high"
            className="size-[138px] rounded-2xl object-cover md:size-[450px] md:rounded-3xl"
          />
          {/* Mobile frame only: a second, smaller artwork overlapping the first. */}
          <img src="/nfts/art-2-120.webp" alt="" aria-hidden width={58} height={58} className="absolute left-[14px] top-[88px] size-[58px] rounded-2xl object-cover md:hidden" />
        </div>
      </div>
    </section>
  )
}
