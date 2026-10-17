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
| D-13 | Header divider | Component note: the divider exists on home, profile and wallets and the two auth screens' backdrop; market screens use a bare header. Payment frame has no divider and "Mercado" active | Follow it: divider on home, profile, wallets, auth; none on detail, cart, payment, confirmation, where "Mercado" is highlighted. **Current code differs** (divider everywhere, only "Início" active): fix under UI-1 |
| D-16 | NFT card background | Desktop: a flat `surface-card` box of 300 px with the art inside. Mobile: a rounded-20 gradient card with a heart button | Follow each frame. **Current code uses the mobile card on desktop**: fix under UI-1. The difference is intentional, so it is not unified |
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
| D-32 | Visitor cart | Adding to the cart needs a session: an anonymous visitor is sent to sign in and returns to the NFT. The server merge rule exists and is tested; the client-side visitor cart (CART-3) moves to M4 |
| D-33 | Wallet connection | Connecting, refusing and disconnecting a wallet app are simulated by `POST /api/wallet-connections` (the `wallet-refused` scenario makes it refuse); the client holds the connected state. Real wallet extensions are out of scope (§1) |
| D-34 | Payment screen | One screen for both sizes: saved wallets (those on another network are disabled with the reason), the read-only "Perfil do colecionador" fields on desktop, "Usar outra carteira?" for a one-off wallet, a review dialog before the order is sent |
| D-35 | Detail screen | The NFT has one artwork, so the gallery thumbnails repeat it and are decorative; rating, attributes and the reviews tab of the frame are not reproduced because the data does not exist. Favorites stay disabled until M4 |
| D-25 | Copy language | Strings left in English in the frames (profile tabs, "Transaction confirmed on Ethereum…", "User Name") are written in pt-BR |

## 3. Optional (never blocking)

| ID | Item | Rows |
| --- | --- | --- |
| D-06 | Price filter as two exact text fields; the slider may stay as an extra | CAT-9 |
| D-11 | ENS name required only on Ethereum | WAL-3 |
| D-15 | Vitest for pure rules | TEST-8 |
| D-20 | Removable chips for active filters | CAT-10 |
| D-26 | Footer medallion letters replaced by icons | UI-7 |

## 4. Open

| ID | Question | Needed from | Default if unanswered |
| --- | --- | --- | --- |
| Q-1 | Create the repository and pick the host for the M0 deploy (`CLAUDE.md` says to ask first) | Rafael | Wait; M0 cannot finish without it |
| Q-2 | Is a one-network cart acceptable, or must mixed-network carts be possible? | Rafael | One network |
| Q-3 | Should the desktop "Usar outra carteira?" wallet be saved or used only for that order? | Rafael | Used only for that order |
| Q-4 | Are Vitest and a Lighthouse dev dependency acceptable? (§2 allows complementary libraries) | Rafael | Yes |
| Q-5 | Desktop cart rows, steppers and remove control: exact layout | Figma, when building the cart | Follow the frame |
| Q-6 | The first wallet option on desktop payment is a chip row "MetaMask · WalletConnect · Coinbase" as one radio | Figma and judgment | Three separate options |
| Q-7 | Mobile detail shows tiers `1/10, 1/10, 1/50`; desktop shows `1/1, 1/10, 1/50` | Figma | Use the desktop set |
| Q-8 | Fee values for Polygon and Solana | Nobody (invented) | Mock constants, documented as invented |
| Q-9 | Referral code is a required field with no valid list | Nobody | 4 to 12 letters or digits |

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
