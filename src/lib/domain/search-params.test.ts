import { describe, expect, it } from 'vitest'
import { parseSearch } from './search-params'

describe('price parameters keep the digits that were typed', () => {
  it('CAT-1#4: a typed price is not turned into a number, so no precision is lost', () => {
    expect(parseSearch('?minPrice=0.123456789012345678&maxPrice=0.0000001')).toMatchObject({ minPrice: '0.123456789012345678', maxPrice: '0.0000001' })
    expect(parseSearch('?minPrice=1&maxPrice=2.50')).toMatchObject({ minPrice: '1', maxPrice: '2.50' })
  })

  it('CAT-1#4: a price the app wrote (quoted text) and the other parameters parse as before', () => {
    expect(parseSearch('?minPrice=%221.5%22&page=3&q=ape')).toMatchObject({ minPrice: '1.5', page: 3, q: 'ape' })
  })
})
