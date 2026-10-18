// Click-through audit: clicks every enabled control of each screen, one at a time on a fresh page, and lists the ones
// that change nothing (no URL, no DOM, no request). Usage: pnpm click-audit [desktop|mobile] [baseUrl]
// Expected quiet ones: links to the page you are already on, a selected tab, the skip link, external share links,
// the avatar button (opens the file picker). Anything else is a dead control.
import { chromium, devices, type Page } from '@playwright/test'

const mode = process.argv[2] ?? 'desktop'
const base = process.argv[3] ?? 'http://localhost:4173'
const mobile = mode === 'mobile'
const SELECTOR = 'a[href], button, [role=button], [role=tab], [role=menuitem], [role=link], summary'

const browser = await chromium.launch()
const context = mobile ? { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } : { viewport: { width: 1440, height: 900 } }

type Setup = (page: Page) => Promise<void>
interface Control {
  index: number
  label: string
  disabled: boolean
  href: string | null
  tag: string
}

async function fresh(setup: Setup, path: string) {
  const ctx = await browser.newContext(context)
  const page = await ctx.newPage()
  await setup(page)
  await page.goto(base + path)
  await page.waitForFunction('!!window.__mock')
  await page.waitForTimeout(1600)
  return { ctx, page }
}

const signIn: Setup = async (page) => {
  await page.goto(`${base}/entrar`)
  await page.waitForFunction('!!window.__mock && !!navigator.serviceWorker.controller')
  const root = mobile ? page.getByRole('main') : page.getByRole('dialog')
  await root.getByLabel('E-mail').fill('ana@kurio.test')
  await root.getByLabel('Senha', { exact: true }).fill('Colecionar#2026')
  await root.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForTimeout(1200)
}

const withCart: Setup = async (page) => {
  await signIn(page)
  await page.goto(`${base}/nfts/nft-004`)
  await page.getByRole('radio', { name: 'Edição 1/10' }).click()
  await page.getByRole('button', { name: /comprar/i }).first().click()
  await page.waitForTimeout(800)
}

const none: Setup = async () => {}
const SCREENS: [string, string, Setup][] = [
  ['home', '/', none],
  ['detail', '/nfts/nft-004', none],
  ['login', '/entrar', none],
  ['signup', '/cadastrar', none],
  ['favorites', '/favoritos', signIn],
  ['profile', '/perfil', signIn],
  ['wallets', '/carteiras', signIn],
  ['cart', '/carrinho', withCart],
  ['payment', '/pagamento', withCart],
]

/** The controls a person can see and reach, in document order (the same filter runs in the page for each click). */
const visibleControls = (selector: string) =>
  [...document.querySelectorAll(selector)].filter((e) => {
    const r = e.getBoundingClientRect()
    return (
      r.width > 0 &&
      r.height > 0 &&
      getComputedStyle(e).visibility !== 'hidden' &&
      !e.closest('[aria-hidden=true]') &&
      !e.closest('[id=mock-panel]') &&
      e.textContent?.trim() !== 'Demo'
    )
  })

for (const [name, path, setup] of SCREENS) {
  const probe = await fresh(setup, path)
  const controls: Control[] = await probe.page.evaluate(
    ([selector, source]) => {
      const visible = new Function('selector', `return (${source})(selector)`) as (s: string) => Element[]
      return visible(selector).map((e, index) => ({
        index,
        label: (e.getAttribute('aria-label') || e.textContent || (e as HTMLElement).title || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40),
        disabled: (e as HTMLButtonElement).disabled || e.getAttribute('aria-disabled') === 'true',
        href: e.getAttribute('href'),
        tag: e.tagName,
      }))
    },
    [SELECTOR, visibleControls.toString()] as const,
  )
  await probe.ctx.close()

  const dead: string[] = []
  for (const control of controls) {
    if (control.disabled) continue
    const { ctx, page } = await fresh(setup, path)
    const requests: string[] = []
    page.on('request', (r) => r.url().includes('/api/') && requests.push(r.url()))
    const handle = await page.evaluateHandle(
      ([selector, source, index]) => (new Function('selector', `return (${source})(selector)`) as (s: string) => Element[])(selector)[index as number],
      [SELECTOR, visibleControls.toString(), control.index] as const,
    )
    const element = handle.asElement()
    if (!element) {
      await ctx.close()
      continue
    }
    const before = await page.evaluate(() => location.href)
    await page.evaluate(() => {
      const w = window as unknown as { __mutations: number }
      w.__mutations = 0
      new MutationObserver((records) => (w.__mutations += records.length)).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
    })
    try {
      await element.scrollIntoViewIfNeeded({ timeout: 2000 })
      await element.click({ timeout: 2500 })
    } catch (error) {
      dead.push(`${control.label} [${control.tag}] NOT CLICKABLE: ${String((error as Error).message).split('\n')[0]?.slice(0, 70)}`)
      await ctx.close()
      continue
    }
    await page.waitForTimeout(700)
    const after = await page.evaluate(() => ({ url: location.href, mutations: (window as unknown as { __mutations: number }).__mutations }))
    if (after.url === before && after.mutations === 0 && requests.length === 0) dead.push(`${control.label} [${control.tag}${control.href ? ` ${control.href}` : ''}]`)
    await ctx.close()
  }
  console.log(`${mode} ${name}: ${controls.length} controls, ${dead.length} with no visible effect`)
  for (const d of dead) console.log(`   - ${d}`)
}
await browser.close()
