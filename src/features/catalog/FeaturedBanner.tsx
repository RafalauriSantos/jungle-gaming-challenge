export function FeaturedBanner() {
  return (
    <section
      aria-labelledby="featured-title"
      className="flex flex-col gap-4 bg-gradient-to-b from-primary/10 to-primary/[0.03] pt-6"
    >
      <h2 id="featured-title" className="px-5 text-2xl font-bold leading-8 text-text-accent">
        NFT EM DESTAQUE
      </h2>
      <p className="px-5 text-center text-[22px] font-bold leading-4">OFERTA LIMITADA</p>
      <img
        src="/nfts/art-2.webp"
        alt="NFT em destaque: macaco de chapéu e moletom roxo"
        width={310}
        height={368}
        loading="lazy"
        className="h-[368px] w-full rounded-[22px] object-cover"
      />
    </section>
  )
}
