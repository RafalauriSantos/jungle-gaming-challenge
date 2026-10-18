import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NFT_FIXTURES } from './nfts'

describe('catalog fixtures: what the detail screen reads', () => {
  it('UI-1#1: every NFT carries its series, summary, attributes, rating and the long description with its sections', () => {
    for (const nft of NFT_FIXTURES) {
      expect(nft.series, nft.id).toMatch(/^Kurio \w+s$/)
      expect(nft.about, nft.id).toContain(nft.series)
      expect(nft.attributes.length, nft.id).toBeGreaterThanOrEqual(3)
      expect(nft.rating, nft.id).toBeGreaterThanOrEqual(3.8)
      expect(nft.rating, nft.id).toBeLessThanOrEqual(5)
      expect(Number.isInteger(nft.reviewCount) && nft.reviewCount > 0, nft.id).toBe(true)
      expect(nft.description.paragraphs, nft.id).toHaveLength(2)
      expect(nft.description.paragraphs[0], nft.id).toContain(nft.name)
      expect(nft.description.sections.map((s) => s.label), nft.id).toEqual(['Rede:', 'Contrato:', 'Direitos autorais:'])
      expect(nft.description.sections[1]!.text, nft.id).toMatch(/^0x[0-9A-F]{4}\.\.\.[0-9A-F]{4} • Contrato inteligente ERC-721 verificado\.$/)
    }
  })

  it('UI-1#1: a rare NFT lists "Raro" among its attributes and the others do not', () => {
    for (const nft of NFT_FIXTURES) expect(nft.attributes.includes('Raro'), nft.id).toBe(nft.rare)
  })

  it('UI-1#1: every NFT has an artwork of its own, and the file exists', () => {
    const images = NFT_FIXTURES.map((nft) => nft.image)
    expect(new Set(images).size).toBe(images.length)
    for (const image of images) expect(existsSync(`public${image}`), image).toBe(true)
  })
})
