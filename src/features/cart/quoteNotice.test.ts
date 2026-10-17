import { describe, expect, it } from 'vitest'
import type { Quote, QuoteLine } from '@/api/types'
import { describeChanges } from './quoteNotice'

const line = (over: Partial<QuoteLine> = {}): QuoteLine => ({
  lineId: 'line_1', nftId: 'nft-004', editionId: 'nft-004:1-10', tokenId: '#0412', name: 'Cosmic Bloom #412', image: '', tier: '1/10',
  quantity: 2, unitPrice: '1.61', lineTotal: '3.22', nftVersion: 1, available: 9, ...over,
})
const quote = (lines: QuoteLine[]) => ({ lines }) as Quote

describe('describeChanges', () => {
  it('says nothing when the terms are the same, as with a duplicate event', () => {
    expect(describeChanges(quote([line()]), quote([line({ nftVersion: 2 })]))).toEqual([])
  })

  it('names the NFT whose price changed, with both prices', () => {
    expect(describeChanges(quote([line()]), quote([line({ unitPrice: '2', nftVersion: 2 })]))).toEqual([
      'O preço de Cosmic Bloom #412 mudou de 1.61 ETH para 2.00 ETH.',
    ])
  })

  it('names the NFT whose stock fell', () => {
    expect(describeChanges(quote([line()]), quote([line({ available: 1 })]))).toEqual(['O estoque de Cosmic Bloom #412 diminuiu: restam 1.'])
  })

  it('ignores lines that are new or gone, which come from the user, not from an event', () => {
    expect(describeChanges(quote([line()]), quote([line({ lineId: 'line_2', unitPrice: '9' })]))).toEqual([])
  })
})
