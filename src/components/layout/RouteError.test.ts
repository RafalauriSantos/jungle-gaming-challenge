import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RouteError } from './RouteError'

describe('the screen shown when a page breaks', () => {
  it('API-5#1: says what happened, offers a retry and the way home, and shows the technical detail', () => {
    const html = renderToStaticMarkup(createElement(RouteError, { error: new Error('boom'), reset: () => undefined }))
    expect(html).toContain('Algo deu errado nesta tela')
    expect(html).toContain('Tentar novamente')
    expect(html).toContain('href="/"')
    expect(html).toContain('boom')
  })

  it('API-5#1: without a retry it still offers the way home', () => {
    const html = renderToStaticMarkup(createElement(RouteError, { error: 'x' }))
    expect(html).not.toContain('Tentar novamente')
    expect(html).toContain('Voltar ao início')
  })
})
