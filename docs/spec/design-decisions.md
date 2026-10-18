# Design decisions

Gaps and contradictions in the statement and the Figma, the decision taken, and what is still open. Decisions that shape behavior live in `/ARCHITECTURE.md`; this file records why and what changed.

**Evidence rule.** A decision cites the statement (`§n`) or a Figma frame. Comments left by other candidates on the Figma are hints only; they are used to know where to look, never as a requirement.

Status: **decided** (evidence in hand) · **adopted** (own choice, reversible, listed so it can be challenged) · **open** (needs an answer).

## 1. Decided by evidence

| ID | Topic | Evidence | Decision |
| --- | --- | --- | --- |
| D-02 | Edition, unit, token id | Detail frame lists tiers `1/1`, `1/10`, `1/50` with "ABERTA"; the cart column "Edições" holds a quantity; detail and receipt show token `#0042` for NFT #042 and `#0314` for #314 | Edition = supply tier with its own stock. Unit = one purchased copy. Token id = NFT number padded to 4, one per NFT. Full definition in `ARCHITECTURE.md` §1 |
| D-02b | Token ids in the cart frame | The cart frame shows `#0009` for Violet Nomad #314 and `#0552` for Ivory Baron #088, which are other NFTs' numbers | Figma error. The rule above wins; the cart shows the same id as detail and receipt |
| D-04 | Payment: desktop and mobile differ | Desktop frame: a "Perfil do colecionador" form with 10 fields, an optional note, "Usar outra carteira?", an order summary and a wallet choice. Mobile frame: no form; saved-wallet cards (Reserva, Principal), a wallet-type choice, total, "Confirmar compra" | Keep both as drawn; they are not unified. Both produce the same request: a saved wallet (`walletId`) or, on desktop with "Usar outra carteira?", an inline wallet for this order only. Desktop pre-fills the form from the selected saved wallet |
| D-10 | Collection order | The Figma lists Arte digital, Fotografia, Música, Arte 3D, Colecionáveis, Generativa, Jogos, Assinaturas, Utilidade | Withdrawn: keep the Figma order. Reordering would be an unnecessary deviation |
| D-13 | Header divider | Component note: the divider exists on home, profile and wallets and the two auth screens' backdrop; market screens use a bare header. Payment frame has no divider and "Mercado" active | Follow it: divider on home, profile, wallets, auth; none on detail, cart, payment, confirmation, where "Mercado" is highlighted. Implemented in `Header.tsx` and tested in `e2e/shell.spec.ts` |
| D-16 | NFT card background | Desktop: a flat `surface-card` box of 300 px with the art inside. Mobile: a rounded-20 gradient card with a heart button | Follow each frame. Implemented in `NftCard.tsx`. The difference is intentional, so it is not unified. The desktop card shows three buttons on hover (cart, favorite, view), as the frame does on its second card |
| D-17 | Theme tokens | Figma variables carry hex values; dark only | Implemented in `src/index.css` |
| D-18 | Quantity stepper and remove control | Frames draw them differently on desktop and mobile | Keep each frame's look; share only the logic (limits, disabled at the minimum). Check both frames when building the cart |

## 2. Adopted choices

| ID | Topic | Choice and reason |
| --- | --- | --- |
| D-01 | Pending and refused screens | Only "confirmed" is drawn (§1 says undrawn states follow the same visual pattern). Reuse the confirmation card, type and tokens; status text and icon, not color alone |
| D-03 | Visitor cart merge | One merge, claimed by the first user to log in, idempotent by `mergeId`. `ARCHITECTURE.md` §4 |
| D-05 | Account and logout | Figma draws none; §3 requires logout. After login "Entrar" becomes an account control built from existing styles |
| D-07 | Sort options | Recent, price ascending, price descending, name. Figma defines none |
| D-08 | Pagination | Previous from page 2, next until the last, page links keep other params |
| D-09 | Return after login | `redirect` search param, same-origin paths only |
| D-12 | Frames that do not exist | Mobile confirmation, profile and wallets, and tablet: derive from the desktop frames and the mobile payment and login patterns; tablet is the fluid range |
| D-14 | Brand | "Kurio". The file title says "GreenMint" and a footer link points to `contact@besa.com`; the visible text `contato@email.com` is used |
| D-19 | Inert controls | "Esqueceu a senha?", social login, nav items "Mercado", "Criadores", "Aprenda", profile tabs other than Profile and Wallets, and blog and footer links are inert and marked "Em breve" |
| D-21 | Network compatibility | One network per cart; wallets must match; one fee per network. `ARCHITECTURE.md` §1 |
| D-22 | One pending order per user | Makes duplicates impossible even if the client loses its key. `ARCHITECTURE.md` §3 |
| D-23 | Coupons | Invalid and expired codes are quote results, not HTTP errors |
| D-24 | Price per edition | One price per NFT; the frames show one price |
| D-27 | Order progression | Persisted due time and `settle(now)`, independent of the socket and the open screen. `ARCHITECTURE.md` §7 |
| D-28 | Reset | Clears all state, timers and queued events; a generation counter drops stale ones. `ARCHITECTURE.md` §7 |
| D-29 | Authorization | Enforced in the handlers by ownership, never by the page alone. `ARCHITECTURE.md` §4 |
| D-30 | Demo panel | A small "Demo" control (bottom-left, collapsed) lists the scenarios and resets the state, on the deployed build too, so an evaluator does not need the URL parameters. Scenarios not wired yet are listed as "em breve" and disabled |
| D-31 | Wallets screen | The principal wallet form is always open, as in the frame, so the "Adicionar" link next to its title is not reproduced; "Adicionar" for the secondary wallet is. "Igual à carteira principal" starts the new wallet from the principal's data |
| D-32 | Visitor cart | An anonymous visitor's cart lives in this browser (`kurio.visitor.cart`); "COMPRAR" then sends them to sign in and on to the cart. The first sign-in claims it and merges it once (CART-3). Favorites still need a session: the heart sends a visitor to sign in and back |
| D-33 | Wallet connection | Connecting, refusing and disconnecting a wallet app are simulated by `POST /api/wallet-connections` (the `wallet-refused` scenario makes it refuse); the client holds the connected state. Real wallet extensions are out of scope (§1) |
| D-34 | Payment screen | Two layouts over one set of rules (D-04). Desktop: the collector form (read-only for a saved wallet, editable with "Usar outra carteira?", which is valid for that order only), a "Carteira salva" list above it (not drawn; needed to choose between saved wallets), the optional note (sent with the order, up to 280 characters), and the summary with wallet app and "Confirmar compra". Mobile: saved-wallet cards ("Trocar carteira" opens Carteiras), wallet app cards, the total and "Confirmar compra"; the item list and the one-off wallet are not drawn there. "Confirmar compra" opens the review dialog, whose button is "Enviar pedido". Connecting, refusing and disconnecting the wallet app (not drawn) stay as a small row under the wallet apps |
| D-35 | Detail screen | The NFT has one artwork, so the gallery thumbnails repeat it and are decorative. Rating, series, attributes and the long description come from the API (fixtures), as the frame shows them. The "Avaliações de colecionadores" tab is inert ("Em breve"): the frame draws only its label and the statement has no reviews. Share links open the real LinkedIn, e-mail and Twitter share addresses with this page's URL. The image zoom of the frame is not drawn (no zoom exists). Two desktop and mobile layouts share one set of choices (`useBuy`) |
| D-36 | First-page catalog data | The 9 cards of the Figma home keep the frame's names, numbers and prices (Emerald Ape #042 1.19 ETH, Sage Nomad #009 1.69 ETH, Neon Vessel #552 1.99 ETH with 2.29 before and the RARO tag, and so on). They are the newest listings, so the default sort starts with them; the 48 generated ones follow, with their sold-out and multi-network variety for filters and tests (`src/mocks/fixtures/nfts.ts`) |
| D-37 | Demo panel as an edge tab | Idea of Rafael Lauri, in review: the "Demo" button becomes a small tab with an arrow docked on the left edge of the screen, closed by default; a click or Enter opens the panel and Escape closes it. It leaves the bottom of the phone (the tab bar and the footer) free. Instead of reminding the user every few minutes, the tab pulses twice, softly, on the first visit only (remembered in `localStorage`, and silent when the system asks for reduced motion): a repeating nudge distracts a person who is evaluating a flow and makes timed tests less predictable. Replaces the floating button of D-30. Deviation from the Figma: the panel is not drawn there |
| D-25 | Copy language | Strings left in English in the frames (profile tabs, "Transaction confirmed on Ethereum…", "User Name") are written in pt-BR |

## 3. Optional (never blocking)

| ID | Item | Rows |
| --- | --- | --- |
| D-06 | Price filter as two exact text fields; the slider may stay as an extra (it has one handle, the maximum: a second handle was judged unnecessary in review) | CAT-9 |
| D-11 | ENS name required only on Ethereum | WAL-3 |
| D-15 | Vitest for pure rules | TEST-8 |
| D-20 | Removable chips for active filters | CAT-10 |
| D-26 | Footer medallion letters replaced by icons | UI-7 |

## 4. Questions and how they were closed

All were answered by the default, none needed Rafael's call except Q-1.

| ID | Question | Closed as |
| --- | --- | --- |
| Q-1 | Repository and M0 host | Done: GitHub repo and Cloudflare Pages, published only by CI |
| Q-2 | One-network cart | Adopted: one network per cart (D-21) |
| Q-3 | "Usar outra carteira?" wallet | Adopted: used only for that order |
| Q-4 | Vitest and Lighthouse as dev dependencies | Adopted: both in use (§2 allows complementary libraries) |
| Q-5 | Desktop cart rows | Resolved: follows the frame (D-18) |
| Q-6 | First wallet option as one radio | Adopted: three separate options |
| Q-7 | Mobile detail tiers `1/10, 1/10, 1/50` | Adopted: the desktop set `1/1, 1/10, 1/50` |
| Q-8 | Fees for Polygon and Solana | Invented constants, documented in `ARCHITECTURE.md` §8 |
| Q-9 | Referral code validity | Adopted: 4 to 12 letters or digits |

## 5. Contradictions found

| Where | Contradiction | Resolution |
| --- | --- | --- |
| Figma | Same NFT carries different token ids across cart, payment and receipt | D-02b |
| Figma | Mobile detail repeats tier `1/10` | Q-7 |
| Figma | Page named "GreenMint", wordmark "KURIO", footer mailto `besa.com` | D-14 |
| Figma | Some strings are English in a Portuguese UI | D-25 |
| Figma | "Dados do colecionador" on desktop payment repeats the wallet form fields | D-04 |
| Statement | §6 lists 17 scenarios, §9 lists 12 tests; "out-of-order responses" has no test of its own | CAT-5 and MOCK-S04 get their own test |
| Statement | §3 asks for "Dados do colecionador" in payment and for saved wallets | D-04 serves both |
| Statement | §7 requires recovery of a pending order but §3 requires login for orders | Recovery reads the server list after login; `ARCHITECTURE.md` §3 |
| This spec, before | One P0 mixed gates, deliverables and order | Split in `requirements.md` and `README.md` |
| This spec, before | Decisions D-10, D-16, D-18 flattened intentional Figma differences | Items 1.D-10, 1.D-16, 1.D-18 above |

## Appendix A: §9 scenarios to requirements

| § 9 | Scenario | Requirements |
| --- | --- | --- |
| E1 | Search, combined filters, sort, pagination, history | CAT-1, CAT-2, CAT-3, CAT-6, CAT-7, CAT-8 |
| E2 | Direct detail, missing resource | ROUTE-1, ROUTE-2, DET-1 |
| E3 | Signup, login, expiry, logout, user switch | AUTH-1..9, ROUTE-3, AUTH-5, RT-6, API-8, MOCK-3 |
| E4 | Favorites, mutation failure, recovery | FAV-1, FAV-2, API-10 |
| E5 | Cart, quantities, removal, coupon, persistence | CART-1..5, CART-7, MOCK-S11, MOCK-S12 |
| E6 | Full purchase to receipt | DET-2..4, ED-1, ORD-3..6, MOCK-S16 |
| E7 | Payment failure, repeated click, timeout recovery | CHK-2, CHK-5, ORD-7..9, ORD-11, AUTH-7, MOCK-S15, MOCK-S17 |
| E8 | Profile, avatar, password, wallets with errors | PRO-1, PRO-2, WAL-1, WAL-2, FRM-1, FRM-2 |
| E9 | Price or stock change by Socket.IO during checkout | RT-1, RT-8, CART-6, CHK-3, CHK-4, MOCK-S13, MOCK-S14, MOCK-9 |
| E10 | Duplicate and old events, disconnect, pending recovery | RT-2, RT-4, RT-5, RT-9, ORD-2, ORD-10 |
| E11 | Keyboard, dialog focus, form validation | A11Y-1..3, A11Y-6, A11Y-8, CHK-1 |
| E12 | Skeletons under slow load, failure, retry | UI-3, CAT-4, API-5, MOCK-S03, MOCK-S05..S07 |
| none | Out-of-order responses | CAT-5, MOCK-S04 |

## 6. Visual review log

Each screen is compared with its Figma frame before it is changed, and a baseline is created only afterwards (UI-1, TEST-3). Frames are read from the copy `f9lfuco4JIdAgFX0anlQbZ` (geometry, type styles and colors from the design context; picture from the screenshot). The original file could not be read, so fidelity to it is not checked.

| Date | Screen | Frames | Result | Deliberate differences |
| --- | --- | --- | --- | --- |
| 2026-10-17 | Desktop header | `Header Row` (70486:560), `Header With Divider` (70522:3240) | Matches: 1200 content width, 16 px nav at 40 px gaps, 3 px active underline, cart with count badge, 100x35 sign-in button, divider only on the "Início" group | After sign-in the button is the account menu (D-05). The search field is not drawn: the icon opens a field styled like the other inputs |
| 2026-10-17 | Desktop payment | `Checkout Page` (70522:3321) in `Desktop / Pagamento` (11:2862) | Matches: breadcrumb, 17 px headings, 15 px labels with the coral asterisk, 40 px controls with 3 px radius, 405 px summary column, 70 px item rows, totals, three wallet app rows, 45 px button | The "Carteira salva" list; the third row of wallet apps are separate options (Q-6); "(-) 0.00 ETH" keeps the unit; the label of the second field is "Apelido da carteira" while the frame says "Nome de usuário" (open: the Wallets frame has to be read first) |
| 2026-10-17 | Mobile payment | `Mobile / Pagamento` (16:748) | Matches: 28 px gutter, 35 px back button, wallet cards (93 px, radius 14), wallet app cards (65 px, radius 15, letter or wallet icon), total row, 60 px gradient button | Primary wallet is listed first; an incompatible wallet grows to show why; the connect row is added |
| 2026-10-17 | Desktop cart | `Desktop / Carrinho de NFTs` (11:1278) | Matches: breadcrumb, 782 px table (NFTs, Preço, Edições, Total), 70 px rows with 70 px art, pill steppers, 332 px summary with the coupon field, totals and the 40 px button, and the "Colecionadores também viram" suggestions (5 per page, dots are real pages) | The edition (tier) is shown under the token id, because the frame's "Edições" column holds the quantity and the tier would otherwise be lost (D-02). Suggestions are the newest listings not in the cart |
| 2026-10-17 | Mobile cart | `Mobile / Carrinho de NFTs` (16:360) | Matches: 100 px item cards (art on the left, edition, price, round stepper), summary as a bottom sheet with the pill coupon field and the 60 px gradient button | A remove button sits at the card's top right (the frame does not draw one); the token id and suggestions are desktop only, as in the frames |
| 2026-10-17 | Desktop detail | `Desktop / Detalhes do NFT` (10:244), `Main` (70362:239), `Description` (70342:2780) | Matches: 573 px gallery, 444 px image box, 28 px title, 22 px price with stars, edition pills, 33x49.5 steppers, 130x40 buy and favorite buttons, token lines, share row, tabs and description, "Mais desta coleção" (5 per page) | The frame's labels under "Contrato:" and "Direitos autorais:" are swapped against their texts (a Figma slip); here each label has its own text. Reviews tab inert |
| 2026-10-17 | Mobile detail | `Mobile / Detalhes do NFT` (15:5536) | Matches: 506 px hero with back and heart, details sheet with rounded top, rating pill, edition pills, fixed buy bar with quantity, price, gradient button and cart button | Button reads "Comprar NFT" as drawn; desktop reads "COMPRAR" |
| 2026-10-17 | Desktop home | `Desktop / Início` (2:2), `Hero` (70347:239), `Toolbar` (70351:239), product card (70342:2681) | Hero without a panel, two-line title, 140x40 button; flat 300 px cards with the 250 px art and the previous price in the secondary color; toolbar with borderless sort and a chevron; slider with orange track and knobs (D-16 resolved) | The hero's three carousel dots are not drawn (there is no carousel); facet counts are the real ones; RARO and Esgotado tags stay on the card because they state facts |
| 2026-10-17 | Mobile home | `Mobile / Início` (14:5226), `Hero Banner` (70395:240) | 24 px gutter, banner with the gradient mask and the second overlapping artwork, 35 px heart on the cards | The sort row (not drawn) sits under the tabs because sorting is required; the bottom tab bar is now the frame's notched bar (see the footer row) |
| 2026-10-17 | Order confirmation (desktop) | `Order Confirmation Modal` (70376:239) in `Desktop / Confirmação de Pedido` (11:4385) | Matches: 578 px card, thank-you icon and title, the four-part transaction strip with separators, 70 px item rows, fee and total, note, button, 10 px bottom bar, close mark | It is a page (`/pedido/:id`), not a modal over the dimmed checkout; the date reads "17 Out, 2026"; "Ver no Etherscan" stays inert (simulated link). No mobile frame: the same card is fluid (D-12) |
| 2026-10-17 | Sign in and sign up (desktop modal, mobile page) | `Sign In Modal` (70381:239), `Sign Up Modal` (70383:239), `Mobile / Login` (16:1022) | Compared: same fields, labels, buttons and order. Close, with small residual differences | Divider "Ou continue com" is inset instead of full width; the modal is 30 px shorter on sign in; the mobile primary button is 58 px (frame 60) |
| 2026-10-17 | Desktop profile | `Body` (70386:263) in `Desktop / Perfil do Colecionador` (9:1238) | Matches: 310 px account menu with the 6 px active mark, one form with the five fields (name, username, e-mail, ENS name, wallet nickname), the avatar row ("Alterar", "Remover"), the password block with show/hide toggles, and a single "Salvar" that saves the data and, when the password fields are filled, the password too | "Nome ENS" and "Apelido da carteira" are now real profile fields (validated; a new account starts with its username and "Principal"); the menu's inert items are dimmed and labelled "Em breve". Mobile has no frame: the same form is fluid under the menu (D-12) |
| 2026-10-17 | Desktop wallets | `Desktop / Carteiras` (9:1670) | Compared: same fields and order as the payment form; the label is "Apelido da carteira" here while the payment frame says "Nome de usuário" for the same slot (a Figma inconsistency; "Apelido da carteira" is kept) | The "Adicionar" link of the principal wallet is not drawn (D-31) |
| 2026-10-17 | Footer and mobile tab bar | `Footer` (70491:1286); `Tab Bar` (70395:245) | Footer columns on the frame's positions (265 px features, 124 px link gaps, the brand band's explicit two-line text); the tab bar is the frame's card with the round notch, the 65 px gradient button and filled icons | The footer's links are plain text (out of scope); the newsletter field is disabled (no sign-up flow); the notch's dark ring around the button is not drawn |
| 2026-10-18 | All 15 frames, second pass | The 9 desktop and 6 mobile frames of the Figma copy; side by side with the build. Mobile Início, Detalhe, Pagamento, Login and Cadastro at 414 px; desktop frames from the thumbnails (the Figma tool limit was reached before Mobile Carrinho could be exported again) | Layout and composition match on every screen. Fixed: mobile sign-up fields without fill, 60 px button 40 px below the fields, struck eye icon while a password is hidden (also on the profile), plain "Entre" link, social buttons without fill, back arrow as a chevron and the cart icon (not a bag) on mobile | Closed on 2026-10-18: the first-page card data now follows the frame (D-36) and the desktop card has its hover buttons. Open: mobile hero dots stay out (no carousel) |

## Screen states (API-5)

Queries do not refetch on window focus (`query-client.ts`), so a background refresh is a real-time event, a mutation or a quote recalculation, never a reload of the screen. In all of them the old content stays on screen: no skeleton comes back.

| Screen | Loading | Error + retry | Empty | Background refresh |
| --- | --- | --- | --- | --- |
| Home / catalog | `network.spec.ts` MOCK-S03 | `network.spec.ts` MOCK-S05..S07 | MOCK-S02 | list dims with `aria-busy` while a new search loads |
| NFT detail | `states.spec.ts` | `states.spec.ts` | n/a (a missing NFT is a 404 page) | price and stock events update in place (`events.spec.ts`, `realtime.spec.ts`) |
| Cart | `states.spec.ts` (items and summary) | `states.spec.ts` | `states.spec.ts` | summary keeps its numbers with `aria-busy` while updating (`CartDesktop.tsx`, `CartMobile.tsx`; no dedicated test) |
| Payment | `states.spec.ts` | `states.spec.ts` | `states.spec.ts` (no items, no wallet) | quote recalculates with `aria-busy`; a changed price asks for a new confirmation (`events.spec.ts` MOCK-S13) |
| Order | `states.spec.ts` | `states.spec.ts` (403, 404, other) | n/a | status moves by event (`events.spec.ts` RT-5, `recovery.spec.ts`) |
| Favorites | `states.spec.ts` | `states.spec.ts` | `states.spec.ts` | optimistic toggle with rollback (`favorites.spec.ts`) |
| Profile | `states.spec.ts` | `states.spec.ts` | n/a (always a profile) | saving keeps the form on screen (`ProfileScreen.tsx`; no dedicated test) |
| Wallets | `states.spec.ts` | `states.spec.ts` | `wallets.spec.ts` (no secondary wallet) | list updates after add or remove (`wallets.spec.ts`) |
| Login / sign-up | n/a (no server read) | `auth.spec.ts` (field and form errors) | n/a | n/a |


## Contrast and non-color states (A11Y-5)

Contrast: axe runs the WCAG AA `color-contrast` rule on every screen on desktop and mobile (`e2e/a11y.spec.ts`) and finds no serious violation; token colors are the Figma values.

| State | Not by color alone | Where |
| --- | --- | --- |
| Selected edition | Weight and border change, `aria-checked`, and the line "Restam n de m" refers to the selected tier | `DetailParts.tsx` |
| Sold-out edition | Strike-through, the label "ESGOTADA", `aria-label` "esgotada" and the message "Esta edição está esgotada." | `DetailParts.tsx` |
| Sold-out card | The text "Esgotado" | `NftCard.tsx` |
| Field error | Message text linked by `aria-describedby`, `aria-invalid`, focus on the first invalid field | `AuthForms.tsx`, `WalletFields.tsx`, `ProfileField.tsx` |
| Failure and recovery | Alert text and a "Tentar novamente" button | every screen (see "Screen states") |
| Favorite | `aria-pressed`, a name with the NFT and an announced message | `FavoriteButton.tsx` |
| Active nav item | Underline plus color | `Header.tsx` |
