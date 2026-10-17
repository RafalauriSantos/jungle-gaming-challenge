import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import heroBg from '@/assets/icons/hero-bg.svg'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[190px] items-center overflow-hidden rounded-xl bg-surface-card p-4 md:h-[450px] md:rounded-none md:pl-10"
    >
      <img src={heroBg} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex max-w-[600px] flex-col gap-1.5 md:gap-8">
          <p className="text-xs font-medium md:text-sm md:tracking-[1.4px]">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="text-lg font-bold leading-[29px] md:text-[43px] md:leading-[70px]">
            <span className="md:hidden">SEJA DONO DA CULTURA DIGITAL</span>
            <span className="hidden md:inline">SEJA DONO DO FUTURO DA ARTE DIGITAL</span>
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
            className="inline-flex w-fit items-center gap-2 text-xs font-bold text-text-accent md:h-10 md:rounded-md md:bg-primary md:px-7 md:text-base md:text-ink"
          >
            EXPLORAR
            <ArrowRight aria-hidden className="size-4 md:hidden" />
          </Link>
        </div>
        <img
          src="/nfts/art-1.webp"
          alt="NFT em destaque: macaco de óculos escuros e jaqueta verde"
          width={450}
          height={450}
          fetchPriority="high"
          className="size-[138px] shrink-0 rounded-2xl object-cover md:size-[450px] md:rounded-3xl"
        />
      </div>
    </section>
  )
}
