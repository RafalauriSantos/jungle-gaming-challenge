# Lighthouse report

Command: `pnpm build && pnpm preview --port 4173`, then `node scripts/lighthouse.mjs --runs 3 --out reports/lighthouse/local`. The script runs Lighthouse 3 times for each of home (`/`) and detail (`/nfts/nft-004`), on the mobile profile (Lighthouse default: simulated slow 4G at 1.6 Mbps, 150 ms RTT, CPU 4x slower) and on the desktop preset, and reports the median. HTML and JSON of every run are in `local/`; `local/summary.md` has the table with the tool versions and conditions. The deployed site is audited in `public/`; the earlier local run is in `local/`.

## Result (median of 3, the deployed site)

Measured on 2026-10-18 against https://jungle-gaming-challenge.pages.dev, which is the build of commit `2276d3c`, published by the CI run 39104037184 after every check (verify, E2E on the build and on a test copy, production smoke) passed. HTML and JSON of every run are in `public/`.

| page | profile | performance | accessibility | best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | mobile | 76 | 100 | 100 | 100 | 4499 ms | 0.000 | 102 ms |
| home | desktop | 98 | 100 | 100 | 100 | 1033 ms | 0.000 | 3 ms |
| detail | mobile | 77 | 100 | 100 | 100 | 4509 ms | 0.000 | 48 ms |
| detail | desktop | 98 | 100 | 100 | 100 | 1044 ms | 0.000 | 0 ms |

Every target is met (performance ≥ 90, accessibility ≥ 95, best practices ≥ 95, SEO ≥ 90) except **mobile performance (76 and 77)**.

`local/` is the same run on the local optimized build, taken earlier in the day (mobile 78 and 79, desktop 99), before the first page got the Figma data and the card buttons. It is kept as the development reference; the figures above are the ones for the delivered site.

## The mobile gap, explained

- LCP is 4.3 s because first paint is 3.2 s: the page cannot draw before the JavaScript arrives and runs. The page ships about 423 KB of JavaScript (compressed). About 160 KB of it is the mock backend (MSW, its Socket.IO binding and the handlers), which the statement requires in the published build and which must start before the first request.
- CLS is 0 and TBT is under 100 ms, so the page is stable and responsive once it draws. Without the simulated throttling the first paint is about 350 ms.
- Four optimizations were measured earlier in the project; only turning off automatic route code splitting helped (+4 points on mobile, +2 on desktop), and that is the setting delivered (`vite.config.ts`).
- A real gain would need the page to draw before the mock backend is ready. That changes boot order and the session and reset flow, which carries more risk than a performance score is worth here, so the gap is reported and not hidden.

## Fixes the audit produced

- Detail page on desktop had CLS 0.148: the footer moved when the content replaced the skeleton. The skeleton now reserves the content height (CLS 0).

## What was not done to raise the score

No audit flag, test-only build or special page. The audited build is the one CI publishes, and `public/` is a run against the published URL.
