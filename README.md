# Kurio — NFT marketplace (Jungle Gaming frontend challenge)

A React single-page app for browsing, favoriting and buying NFTs. There is no real backend: **MSW** plays the whole API
(REST and Socket.IO), in development, in tests and in the published build.

- Live site: https://jungle-gaming-challenge.pages.dev
- Statement: [`docs/ENUNCIADO.md`](docs/ENUNCIADO.md) · Design and rules: [`ARCHITECTURE.md`](ARCHITECTURE.md) · Requirements and milestones: [`docs/spec`](docs/spec/README.md)

The interface is in Portuguese (pt-BR), as in the Figma. Code, comments and docs are in English.

## Stack

React 19, TypeScript (strict), Vite, TanStack Router and Query, Axios, `socket.io-client`, Tailwind v4, shadcn/ui (Base UI),
MSW with `@mswjs/socket.io-binding`, Vitest, Playwright, Lighthouse.

## Setup

Requirements: Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev          # dev server with the mocks on, http://localhost:5173
```

### Environment variables

Copy `.env.example` to `.env` (the repository already has the defaults).

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Starts the MSW worker. It is `true` in the published build too. With `false` the app has no backend to talk to |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.mock` | Address of the Socket.IO server. It is a fictional host: MSW intercepts it |

### Fictional credentials

| E-mail | Password | Notes |
| --- | --- | --- |
| `ana@kurio.test` | `Colecionar#2026` | Two saved wallets (as in the Figma payment frame) |
| `bruno@kurio.test` | `Colecionar#2027` | No wallets |

Coupon codes: `KURIO10` (10%), `LANCAMENTO5` (5%), `EXPIRADO` (known but expired). Any other code is invalid.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server with mocks |
| `pnpm build` | Generates the routes, type-checks and builds `dist/` |
| `pnpm preview` | Serves `dist/` at http://localhost:4173 (run `pnpm build` first) |
| `pnpm typecheck` | Route generation and `tsc -b` |
| `pnpm lint` | oxlint |
| `pnpm test:unit` / `pnpm test:coverage` | Vitest; the second enforces coverage floors on the business rules |
| `pnpm test:e2e` | Playwright, Chromium, desktop (1440) and mobile (390); builds and serves the app itself |
| `pnpm spec:check` | Checks that every requirement marked done has a test, and that this README lists every scenario |
| `pnpm verify` | typecheck, lint, unit tests with coverage, build and `spec:check`. Run it before saying a change is done |
| `pnpm lighthouse` | Lighthouse runner, see `scripts/lighthouse.mjs` (`--url`, `--runs`, `--out`) |

Run the E2E suite against a deployed site with `BASE_URL=https://jungle-gaming-challenge.pages.dev pnpm test:e2e`.

## Mock scenarios

Every scenario is deterministic. Pick one in any of these ways:

1. **URL:** add `?scenario=<name>` to any page, for example `/?scenario=http-5xx`. The parameter is read once and removed from the address.
2. **Demo panel:** the **Demo** button at the bottom-left of every page lists the scenarios.
3. **Console:** `window.__mock.setScenario('<name>')`.

**Reset:** `?reset=1` (combinable with `?scenario=`), or **Resetar estado** in the Demo panel, or `window.__mock.reset()`.
It restores the seeded data (users, wallets, carts, favorites, orders, idempotency keys) and clears the app's local storage and queued events.
A scenario stays active until you change it or reset.

<!-- scenarios:start -->
| Requirement | Scenario | How to activate | What to observe |
| --- | --- | --- | --- |
| `MOCK-S01` | success (default) | `?scenario=success` | Every flow works: browse, sign in, add to cart, pay, receipt |
| `MOCK-S02` | empty result | `?scenario=empty` | The catalog shows "Nenhum NFT encontrado com esses filtros." and a "Limpar filtros" button |
| `MOCK-S03` | variable latency | `?scenario=slow` | Each API call waits 1.8 s, 3.2 s, 0.9 s, 2.4 s in turn; skeletons fill the space and the layout does not move |
| `MOCK-S04` | out-of-order responses | `?scenario=out-of-order` | Answers take 1.8 s, 0.5 s, 0.1 s in turn. Change the filter or sort quickly: the screen ends on the last choice, older answers are dropped |
| `MOCK-S05` | connection failure | `?scenario=offline` | Requests fail at the connection. The catalog shows "Não foi possível carregar os NFTs." with "Tentar novamente"; switch to `success` and retry to recover |
| `MOCK-S06` | HTTP 4xx | `?scenario=http-4xx` | Every API call answers `400`. The matching error message shows, no retry loop |
| `MOCK-S07` | HTTP 5xx | `?scenario=http-5xx` | Every API call answers `503`. Reads are retried twice, then an error with "Tentar novamente" shows. A favorite toggled now rolls back and the failure is announced |
| `MOCK-S08` | expired session | `?scenario=session-expired` | Private calls answer `401 session_expired`. The app goes to the sign-in page with a notice and returns to where you were after signing in again |
| `MOCK-S09` | unauthorized access | `?scenario=unauthorized` | Private calls answer `403`. The page explains that access is not allowed |
| `MOCK-S10` | sign-up conflict | `?scenario=signup-conflict` (optional) | Needs no switch: sign up with `ana@kurio.test` or the username `ana` and the field shows "already registered". The scenario name only marks it in the Demo panel |
| `MOCK-S11` | invalid coupon | `?scenario=coupon-invalid` | In the cart, every code is reported invalid |
| `MOCK-S12` | expired coupon | `?scenario=coupon-expired` | In the cart, every code is reported expired |
| `MOCK-S13` | price changed during purchase | `?scenario=price-changed` | Add an item, open the payment and confirm. Just before the order is created the first item gets 0.1 ETH more (once, with a `nft.updated` event). The new total must be confirmed; no order exists until then |
| `MOCK-S14` | edition sold out during purchase | `?scenario=sold-out` | Same moment as above, but the edition of the first line runs out (once). The quote lists the issue and the checkout is blocked |
| `MOCK-S15` | timeout after the order is created | `?scenario=order-timeout` | The order is created but the answer is lost. The app resends with the same `Idempotency-Key` and ends with exactly one order |
| `MOCK-S16` | payment confirmed | `?scenario=payment-confirmed` | The default outcome: a pending screen, then the receipt about 2 s later through `order.updated` |
| `MOCK-S17` | payment refused | `?scenario=payment-refused` | The pending screen turns into a refusal; the cart is kept and a new attempt can be made |
| — | wallet connection refused | `?scenario=wallet-refused` | In the payment step, connecting a wallet app is refused with a message and can be tried again |
<!-- scenarios:end -->

Real-time events (`nft.updated`, `order.updated`) go through the real `socket.io-client`. `window.__mock`
can also drop the connection, resend an event, send an older version of an NFT, or move the mock clock; the controls are listed in
[`src/mocks/control.ts`](src/mocks/control.ts). Transport and its limits are described in [`ARCHITECTURE.md`](ARCHITECTURE.md) §5.

### Reproducing the failure flows

| Flow | Steps |
| --- | --- |
| Payment refused, then retried | `/?reset=1&scenario=payment-refused`, sign in as Ana, buy an NFT, see the refusal, switch to `success`, try again |
| Timeout with recovery | `/?reset=1&scenario=order-timeout`, buy an NFT; the receipt arrives and `window.__mock.orders()` is `1` |
| Price changes during checkout | `/?reset=1&scenario=price-changed`, add an NFT, confirm the payment, accept the new total |
| Expired session in checkout | Open the payment, then `window.__mock.advance(31 * 60 * 1000)` and confirm: you return to the payment after signing in, with your choices kept |
| Connection drop with a pending order | Buy an NFT, run `window.__mock.dropConnections()`, reload: the pending order is found and ends confirmed or refused |

## Tests

- **Unit (Vitest):** money math, the version gate, mock services, session rules. Coverage floors apply to these.
- **E2E (Playwright):** the flows of the statement §9 on Chromium at 1440 and 390 wide. A requirement is only `done` when a test names it (`ID#k` in the title); `pnpm spec:check` enforces it and writes [`docs/spec/traceability.md`](docs/spec/traceability.md).
- **Reports and traces:** each run writes an HTML report (`playwright-report/`, open it with `pnpm exec playwright show-report`) and keeps a trace of every failed test in `test-results/` (`pnpm exec playwright show-trace <trace.zip>`). CI uploads both as artifacts of each run for 14 days.
- **Lighthouse:** [`reports/lighthouse/`](reports/lighthouse) has the full audit (3 runs per page and profile, median, home and detail, mobile and desktop) with the HTML and JSON of every run. Measured on the deployed site: desktop scores 98 on both pages and every other category is 100; mobile performance is 76 and 77, and [the report](reports/lighthouse/README.md) explains the gap.

## Pipeline and deploy

`.github/workflows/ci.yml` runs on every push and pull request: `verify` → `e2e` → `preview` → `preview-e2e` → `promote` → `smoke`.
The build that passed the tests is the build that is published, first as a test copy and, if the suite passes there too, to production.
Production is never published by hand. `main` only accepts changes through a pull request with the checks green.
Details, secrets and rollback: [`ARCHITECTURE.md`](ARCHITECTURE.md) §9.

## Known limits

- The Figma used is a copy of the original, which could not be read; fidelity to the original was not checked.
- Browsers other than Chromium are not tested.
- The ETH fees for Polygon and Solana are invented constants (the Figma shows Ethereum only).
