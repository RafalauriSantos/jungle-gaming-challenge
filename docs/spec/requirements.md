# Requirements

Source: `docs/ENUNCIADO.md` (`§n`). Method, milestones and done rule: `README.md`. Rules and contracts: `/ARCHITECTURE.md`. Open questions: `design-decisions.md`.

This file keeps three things apart:

1. **Disqualifying criteria** — gates, not work items. Each is proven by requirement rows.
2. **Required deliverables** — every row with Kind `req`. Kind `opt` is an improvement that never blocks delivery.
3. **Execution order** — column **M** is the milestone (dependency order), defined in `README.md`.

Columns: **Kind** `req | opt` · **Verify** `test | manual | audit | config` · **Status** `todo | part | done`.
The **Requirement** cell ends with `Accept:` and numbered-by-position assertions separated by `;`. A test proves assertion `k` of row `ID` by naming `ID#k` in its title. A `test` row is `done` only when every assertion has a test.

## 1. Disqualifying criteria (§11)

| ID | Criterion | Proven by | Note |
| --- | --- | --- | --- |
| DQ-1 | A mandatory technology is decorative or unused | DQ-STACK, TEST-2, MOCK-7 | |
| DQ-2 | Main flows are only visual | ORD-3, CART-1, AUTH-2 | |
| DQ-3 | Purchase confirmed without a simulated API answer | ORD-3, ORD-1, MOCK-12 | |
| DQ-4 | Data exposed between users | AUTH-5, AUTH-12, RT-6, API-8 | |
| DQ-5 | Events simulated straight into the UI | RT-1, RT-2, TEST-7 | |
| DQ-6 | No runnable E2E tests | TEST-1, TEST-6 | |

## 2. Stack and delivery

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DQ-STACK | M0 | req | §2 | Router, Query, Axios, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright and Lighthouse each take real part. Accept: Axios is the only HTTP client in `src`; Socket.IO is exercised by a published-build test; a Lighthouse report exists | manual | part | Socket.IO and Lighthouse missing |
| ROUTE-1 | M1 | req | §4 | Unknown routes show a not-found page with a way back. Accept: `/nada` renders the not-found heading and a link to `/` | test | done | Verified on https://jungle-gaming-challenge.pages.dev at 5d5d35d (2026-10-16) |
| ROUTE-2 | M0 | req | §4, §12 | Every planned screen opens by direct URL and survives refresh, locally and on the host. Accept: each route loads by URL on the deployed build; refresh keeps the page | test | part | Existing routes pass by URL and refresh on the public URL; planned screens are added as they are built |
| ROUTE-3 | M1 | req | §3 | Private routes send an anonymous user to login and return afterwards. Accept: opening `/carrinho` anonymous lands on login with `redirect`; after login the cart opens; an external `redirect` is ignored | test | done | |
| DEL-1 | M0 | req | §12 | Source, lockfile, assets, mocks, fixtures, tests and audit config are in the repo. Accept: a clean clone installs and builds | config | part | Not committed yet |
| DEL-2 | M0 | req | §12 | The public deploy matches the code, serves mocks and real time, and keeps deep links. Accept: the published URL passes the M0 socket proof and a deep-link refresh; the final check is DEL-10 | manual | done | Verified on https://jungle-gaming-challenge.pages.dev at 5d5d35d (2026-10-16): HTTPS, socket proof, deep links and refresh. Final check is DEL-10 |
| DEL-3 | M6 | req | §12 | README: setup, env vars, fictional credentials, scenario selection and reset, commands, failure reproduction. Accept: a table lists every MOCK-S scenario with how to activate it (URL), what to observe, and how to reset; a new person follows it on a clean checkout and on the deployed URL | manual | done | Checked 2026-10-17: copy of the tree without `node_modules` ran every README command (install, typecheck, lint, unit, coverage, build, spec:check, 186 E2E, verify, dev on 5173, preview on 4173, `pnpm lighthouse`); the scenario specs (mock-controls, network, recovery, events: 38 tests) passed on the public URL. `spec:check` fails if the README table misses a scenario |
| DEL-4 | M6 | req | §12 | Contracts, events, session policy, cart state, cache and reconciliation are documented. Accept: `ARCHITECTURE.md` matches the code | manual | part | Planned in `ARCHITECTURE.md` |
| DEL-5 | M6 | req | §12 | `ARCHITECTURE.md` records limitations, UX decisions and Figma deviations. Accept: every `design-decisions.md` row is decided and reflected | manual | part | |
| DEL-6 | M0 | req | §12 | Commands exist for dev with mocks, build, preview, typecheck, lint, Playwright, Lighthouse. Accept: each runs from `package.json` | config | done | All seven commands exist |
| DEL-7 | M6 | req | §12 | The project runs from a clean checkout with no private service. Accept: install, build and E2E pass on a fresh clone | manual | done | CI is a clean checkout with no private service: install, build and E2E pass there |
| DEL-8 | M6 | req | §12 | The deploy stays reachable through the evaluation. Accept: host plan has no expiry or sleep | manual | todo | |
| DEL-10 | M6 | req | §12 | The public URL is verified as its own environment. Accept: a smoke subset of the E2E suite runs against the deployed URL (login, purchase, one failure scenario, one socket event, a deep link refresh) and passes; the result is recorded | test | part | Manual CI run against the deployed URL passed (938614e, 2026-10-17); repeat on the final deploy at M6 |
| DEL-9 | M0 | opt | none | CI runs verify and E2E on every push. Accept: a workflow is green on a clean checkout | config | done | First run green on a clean checkout (install, verify, 112 E2E in 5 min); `.github/workflows/ci.yml` |
| ASSET-1 | M0 | req | §8 | Images and fonts load from the repo; nothing loads from Figma or a third-party host at runtime. Accept: no request to another origin in the network log | test | done | Verified on https://jungle-gaming-challenge.pages.dev at 5d5d35d (2026-10-16) |

## 3. Routing, account, session

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-1 | M1 | req | §3 | Sign up with validation; a duplicate e-mail comes back as a form conflict. Accept: empty and invalid fields show field errors; mismatched password confirmation errors; a seeded e-mail shows the conflict on the e-mail field | test | done | Modal on tablet and desktop, page on mobile; errors move focus to the first invalid field and are linked with `aria-describedby` |
| AUTH-2 | M1 | req | §3 | Log in and return to the previous page. Accept: wrong credentials show an error; success returns to the page in `redirect`; header shows the account | test | done | The header assertion runs on desktop only: the mobile layout has no header |
| AUTH-3 | M1 | req | §3 | The session survives a refresh. Accept: after reload the user is still logged in and the header shows them | test | done | |
| AUTH-4 | M1 | req | §3 | Logout clears private cache and subscriptions. Accept: after logout the cart query, storage keys of the user and the socket are gone; protected routes redirect | test | part | Storage and route protection proven; the cart query and the socket are cleared once they exist (M2, M3) |
| AUTH-5 | M3 | req | §3, §7 | Switching user leaves nothing of the previous user. Accept: user A's cart, favorites and order never show for B; a late response started by A is discarded; an event for A is ignored by B | test | done | |
| AUTH-6 | M3 | req | §3 | Session expiry during navigation sends the user to login and keeps context. Accept: a `session_expired` reply on a private page opens login with `redirect`; after login the same page opens | test | done | |
| AUTH-7 | M3 | req | §3 | Session expiry during checkout keeps the checkout context. Accept: after expiry and re-login the cart is intact and the checkout form values are restored | test | done | |
| AUTH-8 | M1 | req | §3 | Passwords are never stored or logged in clear text. Accept: a unit test shows only a salted hash in the mock state and storage | test | done | Unit test on state and storage; hash is salted SHA-256 (mock grade) |
| AUTH-9 | M1 | req | §3 | Checkout, profile, wallets, favorites and orders need a session. Accept: each private API returns 401 without a token and its route redirects | test | part | Routes redirect; the wallets API refuses a missing token in the handlers; the other private APIs follow with their features |
| AUTH-10 | M1 | req | §3 | After login the header shows the account with a logout control. Accept: the desktop header and mobile tab expose logout; "Entrar" disappears | test | done | Desktop: account menu in the header; mobile: Sair on the profile screen, reached from the tab bar |
| AUTH-12 | M2 | req | §3, §11 | Mock handlers enforce who may read or change each resource, not only the pages. Accept: user B calling `GET /orders/:id` of user A gets 403 and the page shows a forbidden state; wallets, profile, favorites and cart always come from the token's user, never from a client-supplied id; the check runs with the page guard bypassed | test | done | |
| AUTH-11 | M3 | req | §9 | Session time is controllable in tests. Accept: a test expires the session by advancing the clock, without waiting | test | done | |

## 4. Catalog and detail

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAT-1 | M1 | req | §3 | Search, filters, sort and page live in the URL and survive refresh and history. Accept: each control writes its param; reload restores it; back and forward restore the earlier result; invalid params are ignored | test | done | Search term untested |
| CAT-2 | M1 | req | §3 | Filters combine; a filter change resets to page 1. Accept: collection plus network plus price narrows results; changing any removes `page` | test | done | Combination untested |
| CAT-3 | M4 | req | §3 | The query reflects the parameters sent to the API. Accept: the request URL contains exactly the active params | test | done | |
| CAT-4 | M1 | req | §3 | Empty results and failures are handled with a retry. Accept: empty shows a message and "Limpar filtros"; a 5xx shows an alert and "Tentar novamente" that recovers | test | done | Failure untested |
| CAT-5 | M5 | req | §3, §6 | An older response never overwrites a newer one. Accept: with the out-of-order scenario, the last typed search wins | test | done | |
| CAT-6 | M1 | req | §3 | Home shows highlights, catalog, search, filters, sort and a link to the NFT. Accept: hero, 9 cards, sidebar and sort render; a card opens its detail | test | done | Detail is a stub until M2; highlights are the hero and the featured banner |
| CAT-7 | M4 | req | §3 | Sort options are defined and documented. Accept: each option orders results as labelled | test | done | D-07 |
| CAT-8 | M4 | req | §3 | Pagination offers previous and next. Accept: previous appears from page 2; links keep other params | test | done | D-08 |
| CAT-9 | M4 | opt | none | The price filter accepts exact min and max values. Accept: typing `0.10` and `2.00` filters inclusively | test | todo | Slider today; D-06 |
| CAT-10 | M5 | opt | none | Active filters show as removable chips. Accept: removing a chip removes its param | test | todo | D-20 |
| DET-1 | M2 | req | §3 | Detail opens by direct URL; a missing NFT shows not-found. Accept: `/nfts/nft-001` loads; `/nfts/nope` shows not-found | test | done | Stub route |
| DET-2 | M2 | req | §3 | Detail shows gallery, info, editions, quantity, favorite and buy. Accept: tiers `1/1`, `1/10`, `1/50` show their status; choosing one updates stock and token id shown | test | done | |
| DET-3 | M2 | req | §3 | A sold-out edition cannot be bought. Accept: the tier is marked unavailable and buy is disabled for it | test | done | |
| DET-4 | M2 | req | §3 | Quantity is an integer limited by stock. Accept: stepper stops at stock; decrement is disabled at 1; the server rejects more | test | done | |
| ED-1 | M2 | req | §3 | Edition, unit and token id follow one definition from detail to receipt. Accept: the token id on detail, cart, payment and receipt is identical and equals the NFT number padded to 4 | test | done | See `ARCHITECTURE.md` §1 |
| FAV-1 | M4 | req | §3 | Favorites persist per user. Accept: a favorite survives reload and is not visible to another user | test | done | |
| FAV-2 | M4 | req | §4 | Favorite toggles optimistically and rolls back on failure. Accept: the heart changes at once; on a 5xx it returns and an error is announced | test | done | |

## 5. Cart, quote, money

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CART-1 | M2 | req | §3 | Add, change and remove items respecting stock per NFT and edition. Accept: add creates a line; set changes quantity; remove deletes; above stock returns `availability_conflict` and the cart is unchanged | test | done | |
| CART-2 | M2 | req | §3 | The cart persists after refresh. Accept: after reload the same lines show for the same user | test | done | |
| CART-3 | M4 | req | §3 | Visitor items merge once on login. Accept: items appear after login; a replayed merge adds nothing; another user logging in receives none; lines of another network are skipped and listed | test | done | |
| CART-4 | M2 | req | §3 | A coupon can be applied and removed; invalid and expired codes are handled. Accept: valid code lowers the total; invalid and expired codes show their reason and no discount; removal restores the total | test | done | |
| CART-5 | M2 | req | §3 | Subtotal, discount, network fee and total are exactly the quote. Accept: the four values on screen equal the quote response | test | done | |
| CART-6 | M3 | req | §3, §7 | A price or stock change received while the cart is open updates the summary and informs the user. Accept: after the event the total changes without reload; a status message names the NFT; checkout is blocked until the new quote is confirmed | test | done | |
| CART-7 | M2 | req | §3 | Cart and checkout reject a second network. Accept: adding an NFT of another network shows the conflict and the option to empty the cart | test | done | The cart offers "Esvaziar carrinho e adicionar" when the network differs |
| MON-1 | M1 | req | §3 | ETH is a decimal string with exact math and display. Accept: unit tests of parse, add, multiply and format on values with up to 18 decimals; no `Number` on money | test | done | `src/lib/eth.ts`; display keeps at least 2 decimals and never rounds (Figma shows `0.016` and `26.846`) |
| MON-2 | M2 | req | §3 | Quantities are integers. Accept: non-integer and zero are refused by the UI and the API | test | done | |
| MON-3 | M2 | req | §3 | The API quote is the reference to finalize. Accept: the order total equals its quote; a client-side total never reaches the API | test | done | |

## 6. Checkout and orders

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CHK-1 | M2 | req | §3 | Validate the layout's fields and offer a review before submit. Accept: invalid fields block with field errors; a review step shows items, totals, wallet and network | test | done | Desktop and mobile layouts differ on purpose; D-04 |
| CHK-2 | M2 | req | §3 | Use registered wallets with network selection; simulate connect, refusal and disconnect. Accept: only wallets of the cart network are selectable; a refused connection shows an error and allows retry; disconnect returns to selection | test | done | Wallet connection, refusal (`wallet-refused` scenario) and disconnection are simulated by the mock API |
| CHK-3 | M3 | req | §3 | Price, stock, coupon and fees are revalidated before confirming. Accept: a change of price, stock, coupon status, discount, network or fee between review and click returns `quote_stale` and creates no order, one test per input | test | done | |
| CHK-4 | M3 | req | §3 | Any change needs a new explicit confirmation. Accept: after `quote_stale` the button asks to confirm the new total; no order is created until it is pressed | test | done | |
| CHK-5 | M2 | req | §3 | Repeated clicks and resubmits never create a second order. Accept: five rapid clicks produce one order; two direct API calls with the button bypassed still produce one order; after a reload the persisted attempt replays the same key and returns the same order id | test | done | |
| ORD-1 | M2 | req | §3, §7 | States pending, confirmed and refused; the last two are terminal. Accept: unit tests of the state machine; a late event cannot change a terminal order | test | done | |
| ORD-2 | M3 | req | §3, §7 | A pending order is recovered after refresh or reconnection. Accept: reload during pending shows the same pending order and ends in its final state; starting checkout again opens that order instead of creating another; with storage cleared the pending order is still found; after 60 s without an answer the screen offers refresh only | test | done | |
| ORD-3 | M2 | req | §3 | The confirmation shows only for an order the simulation confirmed. Accept: `/pedido/:id` of a pending or refused order never shows the success screen; a `201` from order creation with status pending shows the pending screen, never a receipt; the receipt appears only after a read returns status confirmed with a receipt | test | done | |
| ORD-4 | M2 | req | §3 | On failure items stay; on success only purchased quantities leave. Accept: after refusal the cart is unchanged, and a line removed while pending is not restored; after confirmation lines added after submit remain; a line removed and added again while pending keeps its quantity; a line raised while pending loses only the purchased part | test | done | |
| ORD-5 | M2 | req | §3 | The receipt is an immutable snapshot. Accept: after a price change the receipt still shows the original values | test | done | |
| ORD-6 | M2 | req | §3 | The receipt shows result, transaction id, items, fees and total; refs and links are simulated. Accept: each field matches the order snapshot; the explorer link is inert or simulated | test | done | |
| ORD-7 | M2 | req | §5 | Order creation takes an idempotency key; the same key returns the same order. Accept: two POSTs with one key return one order id | test | done | |
| ORD-8 | M2 | req | §5 | The same key with different content is a conflict. Accept: the second POST returns `idempotency_conflict` | test | done | |
| ORD-9 | M3 | req | §6 | A timeout after creation is recovered with the same key. Accept: the timeout scenario creates the order; the UI shows checking; the replay returns it; one order exists | test | done | |
| ORD-10 | M3 | req | §7 | A late event never moves an order out of a terminal state. Accept: a pending event delivered after confirmation leaves it confirmed even with a higher version; a terminal event applies to a pending order even with a lower version; a refused event never replaces a confirmed order; a read made while pending never undoes a confirmation, but a read of the same final status may add the receipt | test | done | |
| ORD-11 | M2 | req | §3 | A refused order can be retried as a new attempt. Accept: "Tentar novamente" uses a new key and cart items are still there | test | done | |
| UND-1 | M2 | req | §1 | Pending and refused screens exist and reuse the confirmation's visual language. Accept: both render with status text and icon (not color only) at 390 and 1440 | manual | done | Checked at 390 and 1440 on 2026-10-17: pending, confirmed and refused share one card with an icon, a title and text; D-01 |

## 7. Profile, wallets, forms

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WAL-1 | M1 | req | §3 | Register and edit primary and secondary wallets with validation. Accept: required fields error; EVM address format enforced; saved wallets appear on reload | test | done | Validation rules shared by the form and the mock (`src/lib/wallet-rules.ts`); the mock has the last word |
| WAL-2 | M4 | req | §3 | Confirmed wallet changes survive a refresh. Accept: edit, reload, same values | test | done | |
| PRO-1 | M4 | req | §3 | Edit profile data and avatar; changes survive a refresh. Accept: name, username, e-mail and avatar persist; conflicts show on the field | test | done | |
| PRO-2 | M4 | req | §3 | Change password with validation. Accept: wrong current password errors; success lets the user log in with the new one only | test | done | |
| FRM-1 | M4 | req | §3 | Forms show validation errors, including API errors. Accept: errors are linked to fields and announced | test | done | |
| FRM-2 | M4 | req | §3 | Profile, wallets and confirmation work on mobile. Accept: the three screens work at 390 | test | done | No mobile frame; D-12 |
| WAL-3 | M5 | opt | none | The ENS name is required only on Ethereum. Accept: it is hidden for other networks | test | todo | D-11 |

## 8. Data layer

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| API-1 | M1 | req | §4 | Routes, search params and private-route guards use TanStack Router. Accept: guards and params covered by ROUTE-3 and CAT-1 | test | part | |
| API-2 | M1 | req | §4 | Queries, mutations and cache sync use TanStack Query. Accept: all server state comes from Query | manual | part | Queries only |
| API-3 | M1 | req | §4 | Every REST call goes through Axios. Accept: a lint rule or test fails on `fetch` in `src` | test | part | |
| API-4 | M1 | req | §4 | Contracts are typed between transport, state and UI. Accept: `tsc` strict passes with the `ARCHITECTURE.md` types | config | part | `src/api/types.ts` now holds the full contract set of `ARCHITECTURE.md` §2; UI uses catalog and auth types so far |
| API-5 | M2 | req | §4 | Loading, empty, error, success and background-refresh states exist per screen. Accept: each screen has a test or checklist entry for the five | test | part | Catalog only |
| API-6 | M3 | req | §4 | The cache is invalidated coherently after mutations and events. Accept: after a cart mutation and after `nft.updated` dependent views update without reload | test | done | |
| API-7 | M1 | req | §4 | Stale responses are cancelled or discarded. Accept: changing params aborts the older request | test | part | `signal` passed |
| API-8 | M3 | req | §4 | Data is isolated per user and per query parameters. Accept: query keys include the user id; a user switch shows no old data | test | done | |
| API-9 | M3 | req | §4 | Failures recover without duplicating operations. Accept: retries of idempotent calls do not duplicate | test | done | |
| API-10 | M4 | req | §4 | At least one optimistic update with rollback. Accept: FAV-2 | test | done | |
| API-11 | M6 | req | §4 | Cache, retry and sync policy is documented. Accept: `ARCHITECTURE.md` §6 matches the code | manual | part | |
| API-12 | M2 | req | §5 | The REST resources exist: session, NFTs, favorites, cart, quote, orders, profile, wallets. Accept: one handler test per row of `ARCHITECTURE.md` §2 | test | part | NFTs, auth and wallets exist; favorites, cart, quote, orders and profile follow |
| API-13 | M2 | req | §5 | Errors cover validation, session, forbidden, not found, availability conflict and transient failure. Accept: each code is returned by a scenario and shown by the UI | test | part | |

## 9. Mocking and real time

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MOCK-1 | M1 | req | §6 | Mocks live in the network layer; no fake data in components, hooks or the Axios client. Accept: no import of `src/mocks` outside the mock entry | test | part | |
| MOCK-2 | M1 | req | §6 | State is consistent across catalog, favorites, cart, profile, wallets and orders. Accept: a purchase lowers stock seen by the catalog | test | done | |
| MOCK-3 | M1 | req | §6 | State persists locally; reset restores a known scenario fully. Accept: `?reset=1` clears sessions, carts, favorites, orders, idempotency keys, wallets, profiles, the scenario and client storage, then restores fixtures, users and counters | test | done | Reset on boot (`?reset=1`) wipes the mock state and the app storage, then reloads without the parameter |
| MOCK-12 | M2 | req | §7 | Order progression is stored in the mock state with a due time and settles on its own, independent of the socket and the open screen. Accept: an order created, then the socket dropped or the page reloaded before its due time, reaches its final state; the result is the same without any connection | test | done | Settle on read and on boot; `ARCHITECTURE.md` §7 |
| MOCK-13 | M1 | req | §6, §9 | Reset also cancels pending events and timers. Accept: an event or transition scheduled before `?reset=1` never fires afterward; a test that resets between runs sees no leftover | test | done | Generation counter plus a scheduler that cancels on reset (`src/mocks/scheduler.ts`); orders will use it in M2 |
| MOCK-14 | M1 | req | §6, §12 | An evaluator can activate, observe and reset each scenario on the deployed build without code or hidden test setup. Accept: opening `?scenario=<name>` on the public URL reproduces it; a visible reset exists; the README states the exact steps | manual | part | Parameters and the Demo panel work on the deployed build; the README steps come with DEL-3 |
| MOCK-4 | M3 | req | §6 | Latency, timeouts, offline and HTTP errors are configurable and reproducible. Accept: a scenario name yields the same behavior on every run | test | done | |
| MOCK-5 | M1 | req | §6 | Fixtures vary enough and include two users. Accept: 48+ NFTs across collections and networks; two seeded users | test | done | 48 NFTs over 9 collections and 3 networks; users `ana` and `bruno` (credentials in `src/mocks/fixtures/users.ts`) |
| MOCK-7 | M0 | req | §6 | Socket.IO runs through MSW with a compatible binding; transport and limits documented. Accept: a test connects `socket.io-client` and receives an event on the published build | test | done | Verified on https://jungle-gaming-challenge.pages.dev at 5d5d35d (2026-10-16). Limits in `ARCHITECTURE.md` §5 |
| MOCK-8 | M0 | req | §6 | Mocks switch on by configuration and ship in the demo build. Accept: the deployed build answers `/api/nfts` from MSW | test | done | Verified on https://jungle-gaming-challenge.pages.dev at 5d5d35d (2026-10-16) |
| MOCK-9 | M2 | req | §6 | A data change appears both in REST responses and in the event. Accept: after a price change, REST and the event carry the same version and value | test | done | |
| MOCK-10 | M1 | req | §6 | Dev, demo and tests share handlers and scenarios. Accept: Playwright uses the same handler module as the dev server | test | part | Dev, preview and the deployed build run the same handler module; a test that proves it is still to write |
| MOCK-11 | M1 | req | §9 | Ids, timestamps and transaction refs are deterministic. Accept: two runs produce identical order ids and refs | test | done | |
| MOCK-S01 | M1 | req | §6 | Scenario success. Accept: default flows work | test | done | |
| MOCK-S02 | M5 | req | §6 | Scenario empty result. Accept: catalog empty state shows | test | done | |
| MOCK-S03 | M5 | req | §6 | Scenario variable latency. Accept: skeleton shows during slow loads | test | done | |
| MOCK-S04 | M5 | req | §6 | Scenario out-of-order responses. Accept: CAT-5 | test | done | |
| MOCK-S05 | M5 | req | §6 | Scenario connection failure. Accept: error with retry | test | done | |
| MOCK-S06 | M5 | req | §6 | Scenario HTTP 4xx. Accept: the matching message shows | test | done | |
| MOCK-S07 | M5 | req | §6 | Scenario HTTP 5xx. Accept: error with retry | test | done | |
| MOCK-S08 | M3 | req | §6 | Scenario expired session. Accept: AUTH-6 | test | done | |
| MOCK-S09 | M5 | req | §6 | Scenario unauthorized access. Accept: 403 page or message | test | done | |
| MOCK-S10 | M1 | req | §6 | Scenario signup or validation conflict. Accept: AUTH-1 | test | done | |
| MOCK-S11 | M2 | req | §6 | Scenario invalid coupon. Accept: CART-4 | test | done | |
| MOCK-S12 | M2 | req | §6 | Scenario expired coupon. Accept: CART-4 | test | done | |
| MOCK-S13 | M3 | req | §6 | Scenario price changed during purchase. Accept: CHK-3 | test | done | |
| MOCK-S14 | M3 | req | §6 | Scenario edition sold out during purchase. Accept: the quote lists the issue and checkout is blocked | test | done | |
| MOCK-S15 | M3 | req | §6 | Scenario timeout after order creation. Accept: ORD-9 | test | done | |
| MOCK-S16 | M2 | req | §6 | Scenario payment confirmed. Accept: ORD-3 | test | done | |
| MOCK-S17 | M2 | req | §6 | Scenario payment refused. Accept: ORD-11 | test | done | |
| RT-1 | M2 | req | §7 | `nft.updated` updates price and stock in catalog, detail and cart. Accept: one event changes the value in the three places without reload | test | done | M0 has a smoke event |
| RT-2 | M2 | req | §7 | `order.updated` updates the order and shows confirmation or refusal. Accept: the pending screen moves to the receipt or refusal | test | done | |
| RT-3 | M2 | req | §7 | Events carry stable id, resource and version. Accept: payloads match `ARCHITECTURE.md` §5 | test | done | |
| RT-4 | M3 | req | §7 | Duplicate and old events are tolerated. Accept: a duplicate changes nothing and repeats no announcement; an older version does not regress state; a REST answer read before a newer event does not replace it | test | done | |
| RT-5 | M3 | req | §7 | After reconnect, active resources are reconciled with REST. Accept: an update missed while offline appears after reconnect; a terminal order does not regress | test | done | |
| RT-6 | M3 | req | §7 | Events of a previous session never update another user. Accept: AUTH-5 | test | done | |
| RT-7 | M3 | req | §7 | Listeners and subscriptions are released with their lifecycle. Accept: after leaving a screen or logging out no handler remains | test | done | |
| RT-8 | M3 | req | §7 | Cart item changes during navigation: the UI informs, the summary updates, checkout blocks the stale quote. Accept: CART-6 and CHK-3 together | test | done | |
| RT-9 | M3 | req | §7 | A dropped connection with a pending order recovers on reconnect or reload with no second purchase. Accept: one order exists at the end | test | done | |

## 10. Interface, accessibility, tests, performance

| ID | M | Kind | Src | Requirement | Verify | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UI-1 | each | req | §8 | Each screen follows the Figma frame (type, color, spacing, proportions, images) at desktop and mobile as drawn. Accept: a per-screen checklist is ticked against the frame; intended desktop/mobile differences are kept | manual | part | Home only |
| UI-2 | each | req | §8 | Each screen works at 390, 768 and 1440. Accept: no horizontal overflow and no lost content at the three widths | test | part | No 768 project |
| UI-3 | each | req | §8 | Data components show skeletons with shimmer: catalog, detail, cart summary. Accept: dimensions equal the loaded content; no layout shift; animation off under reduced motion | test | done | Catalog skeleton |
| UI-4 | each | req | §3 | Out-of-scope actions never look functional. Accept: each inert control is labelled "Em breve" or disabled | manual | part | |
| UI-5 | M6 | req | §8 | Asset swaps and accessibility changes versus the Figma are documented. Accept: listed in `ARCHITECTURE.md` | manual | todo | |
| UI-6 | M2 | req | §1 | States the Figma does not draw follow the same pattern. Accept: empty, error, pending and refused use existing tokens and components | manual | done | Cart empty and payment empty states, the error cards and the order states reuse the same tokens and shadcn components |
| A11Y-1 | each | req | §8 | Keyboard operation with visible focus. Accept: each flow completes by keyboard | test | part | |
| A11Y-2 | each | req | §8 | Dialogs and drawers trap and restore focus. Accept: focus enters, cycles and returns on close | test | part | |
| A11Y-3 | each | req | §8 | Labels, semantics and field errors linked. Accept: every input has a label; errors use `aria-describedby` | test | part | |
| A11Y-4 | each | req | §8 | Relevant images have text alternatives. Accept: NFT art has alt text; decorative images are hidden | test | part | |
| A11Y-5 | each | req | §8 | Readable contrast and states not by color alone. Accept: selected, error and sold-out carry text or icon | manual | part | |
| A11Y-6 | M3 | req | §8 | Mutations and real-time changes are announced. Accept: a `role="status"` message appears for cart, favorite and event changes | test | done | |
| A11Y-7 | each | req | §8 | No horizontal overflow; no loss at zoom. Accept: UI-2 plus 200% zoom keeps content | test | part | |
| A11Y-8 | M5 | opt | none | An axe scan finds no serious or critical issue per screen. Accept: zero violations | test | todo | |
| TEST-1 | M5 | req | §9 | The 12 scenarios of §9 pass. Accept: each maps to the rows in `design-decisions.md` appendix | test | part | |
| TEST-2 | M0 | req | §9 | Main flows run on Chromium at desktop and mobile. Accept: both projects run in CI | config | part | |
| TEST-3 | M5 | req | §9 | Visual regression of home, detail, cart and payment with versioned baselines. Accept: each baseline is committed only after its screen was compared with the Figma frame and the check is recorded; the run is stable twice | test | todo | Baselines prove stability, not fidelity |
| TEST-4 | M1 | req | §9 | Each test starts isolated. Accept: no test depends on another's state | test | part | |
| TEST-5 | M3 | req | §9 | Clock, latency and event firing are controlled where time matters. Accept: no `waitForTimeout` in time-sensitive tests | test | done | |
| TEST-6 | M0 | req | §9 | HTML report and traces of failures are produced. Accept: report folder and traces appear on failure | config | done | |
| TEST-7 | M0 | req | §9 | Real-time tests pass through the Socket.IO client; REST tests through MSW handlers. Accept: no test calls a store setter to simulate an event | test | part | `MOCK-7#1` drives events through the mock backend and `socket.io-client`; no store setter is used |
| TEST-8 | M1 | opt | none | Unit tests cover pure rules: money, quote, idempotency, state machine. Accept: Vitest suite is green | test | part | Vitest installed; money rules covered; quote, idempotency and state machine follow in M1 and M2 |
| PERF-1 | M0 | req | §10 | Lighthouse runs on home and detail, mobile and desktop, on the optimized build. Accept: an initial measurement report (one run) exists at M0 | audit | part | Initial single-run measurements of home in `reports/lighthouse/` (local) and `reports/lighthouse/public/` (published); detail joins at M2 |
| PERF-2 | M6 | req | §10 | Targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Accept: medians meet them or the gap is justified | audit | todo | |
| PERF-3 | M6 | req | §10 | Three runs per page and profile; the median is reported. Accept: for each of home and detail, at mobile and desktop, the report lists three runs and their median | audit | todo | |
| PERF-4 | M6 | req | §10 | Config versioned; HTML and JSON reports, tool versions and conditions delivered. Accept: files exist in the repo | audit | todo | |
| PERF-5 | M6 | req | §10 | LCP, CLS and TBT are recorded and any gap explained. Accept: values in the report | audit | todo | |
| PERF-6 | M6 | req | §10 | No simplification exists only to raise the score. Accept: the audited build equals the delivered one | manual | todo | |
| UI-7 | M5 | opt | none | Footer feature icons replace letters that no longer match the pt-BR titles. Accept: three icons in place | manual | todo | D-13 |
| UI-8 | M5 | opt | none | Brand and contact text are consistent. Accept: "Kurio" and one contact string everywhere | manual | todo | D-14 |

## 11. Scoring map (§11)

| Criterion | Points | Carried by |
| --- | ---: | --- |
| Visual fidelity and responsiveness | 20 | UI-*, ASSET-1, A11Y-7, TEST-3 |
| Flows and UX | 20 | AUTH-*, CAT-*, DET-*, CART-*, CHK-*, ORD-*, WAL-*, PRO-* |
| Integration and state | 15 | API-*, MON-*, ROUTE-* |
| Real time | 10 | RT-* |
| Mocking | 10 | MOCK-* |
| Tests | 10 | TEST-* |
| Accessibility | 5 | A11Y-* |
| Performance | 5 | PERF-* |
| Architecture and docs | 5 | DEL-*, `ARCHITECTURE.md`, `design-decisions.md` |
