import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect'

describe('safeRedirect', () => {
  it('keeps same-origin paths, with query and hash', () => {
    expect(safeRedirect('/carrinho')).toBe('/carrinho')
    expect(safeRedirect('/?q=ape&page=2#catalogo')).toBe('/?q=ape&page=2#catalogo')
  })

  it('drops everything that could leave the site or is not a path', () => {
    for (const bad of ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', 'carrinho', '', '/\u0000x', '/%2F%2Fevil.test'.replace('%2F', '/'), 42, undefined, null]) {
      expect(safeRedirect(bad), String(bad)).toBeUndefined()
    }
  })
})
