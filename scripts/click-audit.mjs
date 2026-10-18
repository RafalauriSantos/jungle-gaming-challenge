import { chromium, devices } from '@playwright/test'
// Click-through audit: clicks every enabled control of each screen, one at a time on a fresh page, and lists the ones
// that change nothing (no URL, no DOM, no request). Usage: node scripts/click-audit.mjs [desktop|mobile] [baseUrl]
// Expected quiet ones: links to the page you are already on, a selected tab, the skip link, external share links,
// the avatar button (opens the file picker). Anything else is a dead control.
const mode = process.argv[2] ?? 'desktop'
const base = process.argv[3] ?? 'http://localhost:4173'
const b = await chromium.launch()
const ctxOpts = mode === 'mobile' ? { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } : { viewport: { width: 1440, height: 900 } }
async function fresh(setup) {
  const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage(); await setup(p); return { ctx, p }
}
const signIn = async (p) => { await p.goto(base + '/entrar'); await p.waitForFunction('!!window.__mock && !!navigator.serviceWorker.controller'); const r = mode === 'mobile' ? p.getByRole('main') : p.getByRole('dialog'); await r.getByLabel('E-mail').fill('ana@kurio.test'); await r.getByLabel('Senha', { exact: true }).fill('Colecionar#2026'); await r.getByRole('button', { name: 'Entrar', exact: true }).click(); await p.waitForTimeout(1200) }
const withCart = async (p) => { await signIn(p); await p.goto(base + '/nfts/nft-004'); await p.getByRole('radio', { name: 'Edição 1/10' }).click(); await p.getByRole('button', { name: /comprar/i }).first().click(); await p.waitForTimeout(800) }
const SCREENS = [
  ['home', '/', async () => {}], ['detail', '/nfts/nft-004', async () => {}], ['login', '/entrar', async () => {}], ['signup', '/cadastrar', async () => {}],
  ['favorites', '/favoritos', signIn], ['profile', '/perfil', signIn], ['wallets', '/carteiras', signIn], ['cart', '/carrinho', withCart], ['payment', '/pagamento', withCart],
]
const SEL = 'a[href], button, [role=button], [role=tab], [role=menuitem], [role=link], summary'
for (const [name, path, setup] of SCREENS) {
  const probe = await fresh(async (p) => { await setup(p); await p.goto(base + path); await p.waitForFunction('!!window.__mock'); await p.waitForTimeout(1800) })
  const items = await probe.p.evaluate((SEL) => [...document.querySelectorAll(SEL)].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[aria-hidden=true]') && !e.closest('[id=mock-panel]') && !(e.getAttribute('aria-label') === 'Demo' || e.textContent.trim() === 'Demo') }).map((e, i) => ({ i, label: (e.getAttribute('aria-label') || e.textContent || e.title || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40), disabled: e.disabled || e.getAttribute('aria-disabled') === 'true', href: e.getAttribute('href'), tag: e.tagName }))
  , SEL)
  await probe.ctx.close()
  const dead = []
  for (const it of items) {
    if (it.disabled) continue
    const { ctx, p } = await fresh(async (p) => { await setup(p); await p.goto(base + path); await p.waitForFunction('!!window.__mock'); await p.waitForTimeout(1500) })
    const requests = []; p.on('request', (r) => r.url().includes('/api/') && requests.push(r.url()))
    const target = (await p.$$(SEL)).filter(async () => true)
    const handle = await p.evaluateHandle(({ SEL, i }) => [...document.querySelectorAll(SEL)].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[aria-hidden=true]') && !e.closest('[id=mock-panel]') && !(e.getAttribute('aria-label') === 'Demo' || e.textContent.trim() === 'Demo') })[i], { SEL, i: it.i })
    const el = handle.asElement(); if (!el) { await ctx.close(); continue }
    const before = await p.evaluate(() => ({ url: location.href, html: document.body.innerHTML.length, y: scrollY, active: document.activeElement?.outerHTML.slice(0, 80) }))
    let changed = false
    await p.evaluate(() => { window.__mut = 0; new MutationObserver((m) => (window.__mut += m.length)).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }) })
    try { await el.scrollIntoViewIfNeeded({ timeout: 2000 }); await el.click({ timeout: 2500, force: false }) } catch (e) { dead.push(`${it.label} [${it.tag}] NOT CLICKABLE: ${String(e.message).split('\n')[0].slice(0, 70)}`); await ctx.close(); continue }
    await p.waitForTimeout(700)
    const after = await p.evaluate(() => ({ url: location.href, mut: window.__mut, y: scrollY, active: document.activeElement?.outerHTML.slice(0, 80) }))
    if (after.url !== before.url || after.mut > 0 || requests.length > 0) changed = true
    if (!changed) dead.push(`${it.label} [${it.tag}${it.href ? ' ' + it.href : ''}]`)
    await ctx.close()
  }
  console.log(`${mode} ${name}: ${items.length} controls, ${dead.length} with no visible effect`); dead.forEach((d) => console.log('   -', d))
}
await b.close()
