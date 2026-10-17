# Architecture

Status: **planning**. These rules are decided before the code so that the mock backend, the client and the tests agree. `src/api/types.ts` must follow the contracts below; when code and this file disagree, fix one of them in the same change.

Requirement IDs (`CART-6`) point to `docs/spec/requirements.md`. Open questions are in `docs/spec/design-decisions.md`.

## 1. Domain

| Term | Definition | Evidence |
| --- | --- | --- |
| NFT | An artwork with a number, creator, collection, network and one price. Example: Emerald Ape #042 | Figma detail |
| Edition | A supply tier of an NFT: `1/1`, `1/10` or `1/50`. Each tier has its own `supply`, `available` stock and status `open` or `sold_out` | Figma detail shows the three tiers and "ABERTA" |
| Unit | One purchased copy of an edition. A cart line has a quantity of units. The cart column called "Edições" is this quantity | Figma cart |
| Token ID | `#` plus the NFT number padded to 4 digits: Emerald Ape #042 is `#0042`. One token ID per NFT, shown on detail, cart, payment and receipt. Units share it | Detail and receipt follow this rule; the cart frame shows `#0009` and `#0552` for NFTs #314 and #088, which is a Figma error |
| Price | One price per NFT, equal for every edition | Figma shows one price per NFT |
| Stock | `available` per edition. The NFT's availability is the sum over its editions. A pending order reserves stock; refusal releases it; confirmation consumes it | Own decision |
| Network | `ethereum`, `polygon` or `solana`. Each NFT, wallet and fee belongs to one network | Figma filters and wallet frames |
| Network fee | Fixed per order and per network, from a table in the mock: Ethereum `0.016` (Figma). Polygon and Solana values are mock constants | Figma cart shows `0.016` on Ethereum |
| Wallet | Registered by the user: primary and optional secondary, with a network and a wallet type | Figma wallets and mobile payment |

Money: every amount is a decimal string ("1.19"). Math uses integers in wei (`BigInt`); never `Number`. Quantities are integers.

### Network compatibility

1. A cart holds NFTs of **one network**. The first item sets `cart.network`.
2. Adding an NFT of another network returns `409 network_mismatch` with the cart's network. The UI offers "Esvaziar e adicionar".
3. A quote has one network fee, for `cart.network`.
4. Checkout lists only wallets of `cart.network`; the others are shown disabled with the reason.
5. The order's wallet network must equal the cart network, else `422 wallet_network_mismatch`.

### Quantity above stock

The UI limits the stepper to the edition's `available`. The server is the authority: any add or set above stock returns `409 availability_conflict` with `{ available }` and changes nothing. After a stock drop the quote lists an `issues` entry, the line stays, and checkout is blocked until the user lowers the quantity.

## 2. REST contracts

Base path `/api`. JSON. Authenticated routes need `Authorization: Bearer <token>`. Errors share one shape.

```ts
type ErrorBody = { code: ErrorCode; message: string; fields?: Record<string, string>; details?: unknown }
```

| Status | `code` | When |
| --- | --- | --- |
| 401 | `unauthenticated` | No or unknown token |
| 401 | `session_expired` | Token known but expired |
| 403 | `forbidden` | Resource belongs to another user |
| 404 | `not_found` | Unknown NFT, order or route resource |
| 409 | `email_taken`, `username_taken` | Signup or profile conflict |
| 409 | `availability_conflict` | Quantity above stock. `details: { available }` |
| 409 | `network_mismatch` | Cart network differs. `details: { cartNetwork }` |
| 409 | `quote_stale` | Quote no longer matches the cart or catalog. `details: { quote, changes }` (the current quote and what differs) |
| 409 | `order_pending` | The user already has a pending order. `details: { orderId }` |
| 409 | `idempotency_conflict` | Same key, different body |
| 422 | `validation` | `fields` maps field name to message |
| 422 | `wallet_network_mismatch` | Wallet network differs from the cart |
| 422 | `wallet_refused` | The wallet app refused the connection (simulated) |
| 503 | `transient` | Retryable failure |

A timeout has no body: the client sees a network error.

### Session and account

| Method and path | Body | Success | Errors |
| --- | --- | --- | --- |
| `POST /auth/signup` | `{ username, email, password, confirmPassword }` | `201 { user, session }` | 422, 409 `email_taken` |
| `POST /auth/login` | `{ email, password }` | `200 { user, session }` | 422, 401 `unauthenticated` (wrong credentials) |
| `GET /auth/session` | none | `200 { user, session }` | 401 |
| `POST /auth/logout` | none | `204` | none (idempotent) |

```ts
type User = { id: string; username: string; email: string }
type Session = { token: string; expiresAt: string }
```

### NFTs and favorites

| Method and path | Success |
| --- | --- |
| `GET /nfts?q&collection&network&minPrice&maxPrice&feed&sort&page` | `200 { items: Nft[], total, page, pageSize, facets, priceRange }` (as implemented) |
| `GET /nfts/:id` | `200 Nft`, `404` |
| `GET /favorites` | `200 { nftIds: string[], version }` |
| `PUT /favorites/:nftId` | `204` (idempotent) |
| `DELETE /favorites/:nftId` | `204` (idempotent) |

```ts
type Edition = { id: string; tier: '1/1' | '1/10' | '1/50'; supply: number; available: number; status: 'open' | 'sold_out' }
type Nft = { id: string; number: number; tokenId: string; name: string; creator: string; collection: Collection;
  network: Network; price: string; previousPrice?: string; image: string; rare: boolean; listedAt: string;
  popularity: number; editions: Edition[]; version: number }
```

### Cart (server side, per user)

| Method and path | Body | Success |
| --- | --- | --- |
| `GET /cart` | none | `200 Cart` |
| `POST /cart/items` | `{ nftId, editionId, quantity }` (adds) | `200 Cart`; 409 `availability_conflict` or `network_mismatch` |
| `PUT /cart/items/:nftId/:editionId` | `{ quantity }` (sets, ≥ 1) | `200 Cart`; 409 `availability_conflict` |
| `DELETE /cart/items/:nftId/:editionId` | none | `200 Cart` |
| `POST /cart/merge` | `{ mergeId, items }` | `200 { cart, skipped }` |

```ts
type Cart = { version: number; network: Network | null; items: { lineId: string; nftId: string; editionId: string; quantity: number }[] }  // lineId is new for every line that is created, including a line removed and added again
type Skipped = { nftId: string; editionId: string; requested: number; applied: number; reason: 'network_mismatch' | 'unavailable' }
```

`Cart.version` increases on every change. Responses return the whole cart; the client replaces its copy only if the version is not older (§5).

### Quote

| Method and path | Body | Success |
| --- | --- | --- |
| `POST /quotes` | `{ couponCode?: string }` | `200 Quote` for the user's current cart |
| `GET /quotes/:id` | none | `200 { status: 'valid' | 'stale' | 'expired', quote, current?: Quote }` |

```ts
type Quote = {
  id: string; cartVersion: number; network: Network;
  lines: { lineId: string; nftId: string; editionId: string; tokenId: string; name: string; tier: string;
           quantity: number; unitPrice: string; lineTotal: string; nftVersion: number; available: number; image: string }[]
  subtotal: string; discount: string; networkFee: string; total: string;
  coupon: null | { code: string; status: 'applied' | 'invalid' | 'expired'; message?: string }
  issues: { type: 'unavailable' | 'price_changed'; nftId: string; editionId: string; available?: number; was?: string; now?: string }[]
  createdAt: string; expiresAt: string
}
```

An invalid or expired coupon is **not** an HTTP error: the quote returns `200` with `coupon.status` set and no discount, so the cart keeps showing totals. The UI states the reason next to the field.

### Orders

| Method and path | Headers and body | Success |
| --- | --- | --- |
| `POST /orders` | `Idempotency-Key`; `{ quoteId, wallet, provider }` | `201 Order` (`200` when replayed, plus `Idempotent-Replayed: true`) |
| `GET /orders/:id` | none | `200 Order`, `403`, `404` |
| `GET /orders?status=pending` | none | `200 { items: Order[] }` of the current user |

```ts
type WalletRef = { walletId: string } | { inline: WalletInput }   // inline = "Usar outra carteira?" on desktop
type Provider = 'metamask' | 'walletconnect' | 'coinbase'
type Order = {
  id: string; status: 'pending' | 'confirmed' | 'refused'; version: number
  createdAt: string; updatedAt: string
  quote: Quote            // immutable snapshot taken at creation
  wallet: { label: string; address: string; network: Network }; provider: Provider
  refusalReason?: 'payment_refused' | 'insufficient_funds' | 'stock_lost'
  receipt?: Receipt       // present only when confirmed
}
type Receipt = { txRef: string; confirmedAt: string; explorerUrl: string }  // totals and lines come from order.quote
```

### Wallet connection (simulated)

`POST /wallet-connections { provider }` returns `200 { provider, status: 'connected' }`, or `422 wallet_refused` in the `wallet-refused` scenario. The client keeps the connected state; the order still carries the `provider`.

### Wallets, profile

| Method and path | Body | Success |
| --- | --- | --- |
| `GET /wallets` | none | `200 { primary: Wallet | null, secondary: Wallet | null }` |
| `PUT /wallets/primary`, `PUT /wallets/secondary` | `WalletInput` | `200 Wallet`; 422 `fields` |
| `GET /profile` | none | `200 Profile` |
| `PATCH /profile` | partial `ProfileInput` | `200 Profile`; 422; 409 `email_taken`, `username_taken` |
| `PUT /profile/avatar` | `{ dataUrl }` (png, jpeg or webp, ≤ 1 MB) | `200 Profile`; 422 |
| `DELETE /profile/avatar` | none | `200 Profile` |
| `POST /profile/password` | `{ currentPassword, newPassword, confirmNewPassword }` | `204`; 422 `fields.currentPassword` |

`WalletInput` follows the Figma wallet form: `displayName*, nickname*, network*, profileName*, address*, ensOrSecondary?, walletType*, referralCode*, email*, ensName*`. Rules: address is `0x` plus 40 hex for EVM networks and base58 for Solana; `ensName` is required only on Ethereum; `referralCode` is 4 to 12 letters or digits (the mock has no list of valid codes).

## 3. Purchase rules

### Quote identity and invalidation

- The server stores `{ id, userId, cartVersion, couponCode, fingerprint }` for each quote. `fingerprint` is a hash of every input of the totals:

  | Input | Why a change invalidates |
  | --- | --- |
  | Each line: `lineId`, NFT, edition, quantity | The purchase itself changed |
  | Each line's unit price and `nftVersion` | Price changed |
  | Each line's edition `available` stock | Stock moved, even if the quantity still fits |
  | Coupon code and its evaluated status (applied, invalid, expired) at that instant | A coupon can expire or be removed |
  | Discount amount | A rule or the base changed |
  | Network and the network fee | The cart network or the fee schedule changed |
  | Subtotal and total | Derived check |
- A quote is **valid** only if (a) it belongs to the caller, (b) `now < expiresAt` (5 minutes; the test clock can change this), and (c) recomputing from the current cart and catalog gives the same fingerprint.
- It becomes stale when the cart version changes, the coupon changes, any line's NFT changes version (price or stock), or it expires.
- The client requests a new quote when: the cart version changes, the coupon changes, `nft.updated` arrives for a line, the socket reconnects, and on entering checkout. It never edits a quote locally.

### Stale quote between review and submit

`POST /orders` recomputes the fingerprint at that instant. If it differs, nothing is created and the server answers `409 quote_stale` with the current quote. The client shows what changed (`issues` and totals), keeps the form, and the user must press confirm again on the **new** quote. This covers a price change that lands after the review step and before the click.

### Order state machine

```
 (create) ──► pending ──► confirmed   (terminal)
                 └──────► refused     (terminal)
```

- Only `pending` can change. A terminal order ignores every later event or response, except one carrying the same status.
- Creating an order reserves stock. `refused` releases it. `confirmed` consumes it.
- A user has **at most one** pending order; another create returns `409 order_pending` with its id. This keeps duplicates impossible even if the client lost its idempotency key.

**Pending is not confirmed.** A successful `POST /orders` means the order exists and is `pending`; it never shows the receipt. The receipt screen renders only from an order read (`GET /orders/:id` or the event) whose status is `confirmed` and which carries a receipt.

### Idempotency key

- An **attempt** is one press of "Confirmar compra" on a given `(quoteId, wallet, provider)`.
- The client creates the key (`crypto.randomUUID()`) **before** sending and stores it with the attempt in local storage under the user: `{ key, quoteId, bodyHash, orderId?, state }`.
- The same attempt is re-sent with the **same key** after a timeout, a network error, a refresh or a double click.
- The server stores `key → { bodyHash, orderId }`. Same key and same body returns the same order. Same key and a different body returns `409 idempotency_conflict`.
- A **new key** is made only for a new attempt: after a refused order, when the user presses "Tentar novamente"; or after `quote_stale`, when the user confirms the new quote.
- The protection lives in the simulated API, not in the button: the mock stores `key → { bodyHash, orderId }` in its persisted state and enforces one pending order. Disabling the button is only a convenience; a direct second call, a replay after refresh and a resend after timeout all hit the same rule.
- After a timeout, the UI says "Verificando seu pedido…" and replays the same key until it gets an answer. It never offers a new attempt while the previous one is unresolved.

### The single pending order: recovery and resolution

At most one pending order per user exists, so every recovery path ends in one of the same three outcomes.

**Recovery** runs at app start, after login and after every reconnect:
1. Read the stored attempt (`{ key, quoteId, bodyHash, orderId?, state }`) and `GET /orders?status=pending`. The server list wins.
2. Server shows a pending order: open the pending screen for it, subscribe, and poll `GET /orders/:id` every 3 s as a fallback.
3. Server shows none but the attempt has an `orderId`: `GET /orders/:id`; if terminal, show its receipt or refusal.
4. Server shows none and the attempt has no `orderId` (the create call was lost): replay the same key once. The reply is the order, or a `409 quote_stale`, which starts a new attempt.
5. No attempt (storage cleared, for example after logout) and a pending order on the server: step 2 still finds it, because the server list does not depend on the client.

**Starting checkout while one is pending:** `POST /orders` returns `409 order_pending`; the UI goes to that order's pending screen and does not create another.

**Resolution:** the mock settles every pending order at its due time (§7), so none stays pending forever. The pending screen turns into the receipt (`confirmed`) or the refusal (`refused`) when an event or a poll shows the terminal status. If 60 s pass in the UI without an answer, it says it is still processing, keeps polling, and offers only a manual refresh, never a new order. A refusal frees the user to start a new attempt; a confirmation settles the cart (below). The receipt of a settled order stays at `/pedido/:id`; there is no order-history screen (not in the statement).

### Cart settlement

Settlement is by **line**, never by NFT. The order records the `lineId` and quantity of each purchased line. When the order becomes `confirmed`, inside that transition, for each purchased line:
- the line still exists (same `lineId`): subtract the purchased quantity from its **current** quantity; remove it at zero or below;
- the line was removed and later added again: the new line has another `lineId`, so it is **not touched**; items the user added again while the order was pending stay;
- the user raised the quantity during pending: only the purchased part leaves.

`refused` changes nothing: a line the user removed while pending is not brought back. The client invalidates the cart on `order.updated`. Cart edits are allowed while an order is pending.

## 4. Session and isolation

- **Token:** opaque, returned by login and signup, kept in local storage (`kurio.session`) so a refresh restores it. Expiry is 30 minutes (configurable); there is no refresh token. Passwords are hashed with a per-user salt in the mock and never logged.
- **Session scope:** one object `{ userId, epoch, controller }`. `epoch` increases on every login, logout or user change. Every request carries `controller.signal`; on a session change the controller aborts all in-flight requests.
- **Query keys** start with the user id (`['u', userId, …]`). On logout or a change of user: `queryClient.cancelQueries()`, then `queryClient.clear()`, abort the controller, disconnect the socket, remove every storage key of that user. The visitor cart is the only data kept.
- **Authorization in the handlers:** every handler resolves the caller from the token and checks ownership before reading or writing. `GET /orders/:id` of another user's order returns `403 forbidden`. Wallets, profile, favorites and cart take the user from the token; the API has no route that accepts another user's id for them. A page guard is never the only check.
- **Late responses and mutations:** a mutation remembers the `epoch` it started in; if the epoch changed when it resolves, its result is discarded and its `onSuccess` does not run.
- **Storage keys:** `kurio.<userId>.*` for private data and `kurio.visitor.cart` for the visitor cart.
- **Expiry:** a `401 session_expired` while navigating clears the query cache and the socket (not the stored form below), saves the return path in a `redirect` search param (same-origin paths only), and opens login. During checkout it also keeps the checkout form values in session storage, under that user's key, so the user resumes after logging in again. The cart is already on the server.

### Visitor cart merge (once)

- The visitor cart is `{ id: mergeId, items }` in local storage.
- On login the client **claims** it: it writes `claimedBy = userId` locally, then calls `POST /cart/merge { mergeId, items }`.
- The server records `mergeId` per user; replaying it changes nothing and returns the current cart. Only the claiming user may retry; another user logging in never receives these items.
- Rule: quantities add to the user's cart, capped by stock; lines of another network than the user's cart are skipped. Both outcomes come back in `skipped` and the UI lists them.
- After a successful merge the local visitor cart is deleted.

## 5. Real time and synchronization

Transport: Socket.IO over the MSW interception from `@mswjs/socket.io-binding`; the client is the real `socket.io-client`. The binding documents no support for rooms, namespaces or broadcasting. The mock therefore keeps its own registry of live connections (user id and subscribed resources) and sends each event to the matching connections itself. Limits found while proving it (M0):
- `socket.io-client` keeps the `WebSocket` it finds at import time, so it is imported dynamically **after** the mock worker starts; a static import would bypass the mock.
- Only WebSocket is used (`transports: ['websocket']`); long polling is HTTP and would not reach the mock socket.
- `ws.link` matches the origin only, not the path. The client connects to a dedicated origin (`VITE_REALTIME_URL`, default `wss://realtime.kurio.mock`), which also keeps the dev server's HMR socket out of the mock.
- The binding answers the Socket.IO handshake with a fixed session id and supports the default namespace only. It sends no Engine.IO pings, so the mock sends one every 20 s.
- Works with `msw` 3.0.3 although the binding declares `msw ^2.10.2`.

- **Connect:** handshake `auth: { token }`. A failed handshake with `unauthorized` counts as session expiry. The socket belongs to one session epoch and is closed and rebuilt on any session change; listeners are removed in the same cleanup.
- **Subscribe:** `socket.emit('subscribe', { resources: ['nft:<id>', …] })` for the NFTs on screen and in the cart. The mock registry stores them per connection; private events go to connections of that user.

```ts
type Event<Type, Resource, Data> = {
  eventId: string                      // stable: "<resource>.<id>.v<version>"
  type: Type
  resource: { type: Resource; id: string }
  version: number                      // monotonic per resource
  occurredAt: string
  scope: 'public' | { userId: string }
  data: Data
}
type NftUpdated = Event<'nft.updated', 'nft', Nft>                       // full snapshot at that version
type OrderUpdated = Event<'order.updated', 'order', { id: string; status: Order['status']; refusalReason?: string }>
```

### The version gate

One rule for every write into the cache, whether it comes from REST or from an event:

> Apply a payload only if its `version` is **greater than** the cached version (equal is allowed for a REST refetch of the same state). Otherwise discard it.

- **Duplicates:** the same `eventId` has the same version, so it is dropped. A set of recent event ids (last 500) avoids repeating side effects such as announcements.
- **Old events:** a lower version is dropped; the state never goes back.
- **Old REST response after a newer event:** its version is lower, so it is discarded. Catalog list rows read price and stock through a small entity store keyed by NFT id that holds the highest version seen.
- **Terminal orders ignore versions.** For an order, the status rule is checked first and the version second: a `pending` cached order accepts a terminal status even when the incoming version is not greater (a late REST refetch must not hide a confirmation); a terminal order accepts nothing that changes its status, whatever the version; two different terminal statuses never replace each other (first wins). The version rule applies only among payloads of the same status.
- **Private events:** the client drops an event whose `scope.userId` is not the current user.

### Reconnection

On `connect` after a drop: re-subscribe, then refetch the active resources: the cart and its quote, the NFTs on screen, and `GET /orders?status=pending`. Results pass through the same gate, so an older snapshot or a stale pending order cannot overwrite a newer or terminal state.

### Effect on the open screens

- `nft.updated` for a line in the cart: the cart announces the change (`role="status"`), requests a new quote, and the checkout button is disabled until the user confirms the new quote.
- `order.updated`: moves the pending screen to the receipt or the refusal.

## 6. Cache and retries

| Resource | Cache | Retries |
| --- | --- | --- |
| NFT list and detail | `staleTime` 30 s; refetch on focus and on reconnect; patched by events | 2 retries with backoff on network errors and 5xx; none on 4xx |
| Cart, quote, wallets, profile, favorites | `staleTime` 0; invalidated by their own mutations and by events | Same as above |
| Mutations | No automatic retry, except `POST /orders` which the client replays with the same key | n/a |
| Optimistic updates | Favorite toggle: patch the cache, roll back on error, then refetch | n/a |

Requests use the query `signal`, so a changed key cancels the older request.

## 7. Mock backend

Layers, each calling only the one below: `handlers` (HTTP) and `socket` (events) → `services` (rules above, pure) → `db` (state, persisted, with `reset()`).

- REST handlers and socket events read the **same** `db`; a change emits its event from one place.
- **Order progression does not depend on a connection.** The mock runs in the page, so timers die on refresh. Each order stores its next transition and the time it is due (from the controllable clock). `settle(now)` applies every due transition; it runs on each read of an order, on app boot, and on a timer while the page is alive. The socket only *announces* what `settle` did. A dropped socket or a reload before the due time therefore changes nothing about the outcome.
- **Reset clears everything:** sessions, users' changes, carts, favorites, orders, idempotency keys, wallets, profiles, the scenario, queued events and timers, and the client's `kurio.*` storage and query cache. State carries a `generation` number; every scheduled event and transition remembers the generation it was created in, and anything older than the current generation is dropped. An event fired after a reset cannot reach a later test.
- Ids, timestamps and transaction references come from a seeded counter and a controllable clock, so snapshots and tests are stable.
- Dev, the demo build and Playwright use the same handlers.
- **Scenario selection (for evaluators too):** `?scenario=<name>` sets it and stores it, on the deployed build as well; a visible control or `?reset=1` clears everything and restores the default. Scenarios map to `MOCK-S01..S17` in the requirements. The README lists, for each one, how to activate it, what to observe and how to reset.
- Passwords are hashed with a per-user salt. Two seeded users exist (documented in the README).

## 8. Known limitations (to complete)

- Token ID is per NFT, not per unit, as the Figma shows.
- Fees for Polygon and Solana are invented mock values.
- The mock has no valid-referral-code list.
- Solana address validation is a format check only.

## 9. Operational notes

**Deploy.** Cloudflare Pages project `jungle-gaming-challenge`, direct upload of `dist` built from the commit being published:
`pnpm build && pnpm dlx wrangler@4.20.0 pages deploy dist --project-name=jungle-gaming-challenge --branch=main --commit-hash=$(git rev-parse HEAD)`.
Public URL: https://jungle-gaming-challenge.pages.dev. Check it with `BASE_URL=<url> pnpm test:e2e`.

**Observed with `wrangler@latest` (not reproduced, cause not established).**
- Command: `pnpm dlx wrangler@latest pages project create jungle-gaming-challenge --production-branch main`, run in the repository root on 2026-10-16.
- The version that `latest` resolved to was not printed. The run added `"wrangler": "^4.151.1"` to `package.json`, and `wrangler@4.20.0` later reported 4.151.1 as the available update, so it was probably 4.151.1.
- Output seen: a `workers.dev` URL (`https://jungle-gaming-challenge.<account>.workers.dev`), a `Current Version ID`, and a warning stating that the project was deployed to the latest version of Cloudflare Pages, "which is now part of Cloudflare Workers", with a suggestion to use `wrangler deploy` and an opt-out flag.
- Effects found afterwards: a Worker named `jungle-gaming-challenge` (static assets from `dist`, created by an upload deployment) existed and answered 200; no Pages project was listed by `wrangler pages project list`; the working tree had changes to `package.json` (new `preview` and `deploy` scripts and the `wrangler` devDependency), `.gitignore` (added `.env*`), `pnpm-lock.yaml`, and a new `wrangler.jsonc`.
- Handling: the working-tree changes were reverted; the Worker had no bindings in its generated config, no routes and no dependents found, and was deleted with `wrangler@4.20.0 delete`; the Pages project was left untouched.
- With `wrangler@4.20.0` the same `pages project create` and a `pages deploy` created and published the Pages project, with no change to the repository. The newer version was not run again, so whether it always behaves this way is unknown.
