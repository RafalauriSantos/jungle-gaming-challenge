import { describe, expect, it } from 'vitest'
import { validateCatalogSearch } from './search'

describe('catalog URL parameters are normalized before anything renders', () => {
  it('CAT-1#4: a price given as decimal text is kept', () => {
    expect(validateCatalogSearch({ minPrice: '0.5', maxPrice: '3' })).toMatchObject({ minPrice: '0.5', maxPrice: '3' })
    expect(validateCatalogSearch({ minPrice: '0.123456789012345678' })).toMatchObject({ minPrice: '0.123456789012345678' })
  })

  it('CAT-1#4: a price money code cannot handle is ignored, not thrown at render', () => {
    const tooPrecise = validateCatalogSearch({ minPrice: '0.1234567890123456789' })
    expect(tooPrecise.minPrice).toBeUndefined()
    for (const bad of [1, -1, Infinity, NaN, '1e3', '', 'abc', '1,5', {}, [], null]) {
      expect(validateCatalogSearch({ minPrice: bad, maxPrice: bad })).toMatchObject({ minPrice: undefined, maxPrice: undefined })
    }
  })

  it('CAT-1#4: a range whose minimum is above its maximum is ignored', () => {
    expect(validateCatalogSearch({ minPrice: '5', maxPrice: '2' })).toMatchObject({ minPrice: undefined, maxPrice: undefined })
    expect(validateCatalogSearch({ minPrice: '2', maxPrice: '2' })).toMatchObject({ minPrice: '2', maxPrice: '2' })
  })

  it('CAT-1#4: a page that is not a whole, finite number is ignored', () => {
    for (const bad of [Infinity, NaN, 1e300, '-3', 'x']) expect(validateCatalogSearch({ page: bad }).page).toBeUndefined()
    expect(validateCatalogSearch({ page: '3' }).page).toBe(3)
  })
})
