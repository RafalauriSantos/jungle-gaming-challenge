# Jungle Gaming Frontend Challenge
Statement, stack and scoring: `docs/ENUNCIADO.md`. Read it first, then `docs/spec/README.md` (milestones, done rule), `ARCHITECTURE.md` (contracts and rules) and `docs/spec/requirements.md`.
- Deadline: "2 days from sending" the email, sent Fri 2026-10-16 11:29 BRT. Literal reading: Sun 2026-10-18 11:29 BRT. The hour is not confirmed in writing; Rafael may ask the recruiter. Deliver repo link + public deploy URL.
- The email's submission link is an IP disguised as a domain (sslip.io). Paste only the repo and deploy URLs there, never passwords or documents.
- Order: the milestones M0 to M6 in `docs/spec/README.md` (M0 proof and deploy, M1 foundations, M2 purchase slice, M3 hardening, then the rest). If time runs out, ship less but working and say what was left out.
- Never edit the lockfile or `routeTree.gen.ts` by hand; regenerate them.
- Verify with `pnpm verify` (typecheck, lint, unit tests, build, spec:check) and `pnpm test:e2e`. The command table and the done rule live in `docs/spec/README.md`. pnpm lives in ~/.local/bin; add it to PATH.
- Figma: read the user's copy, file key `f9lfuco4JIdAgFX0anlQbZ` (the original `Ff0Sks...` is not readable). Desktop frames 1440 wide, mobile 414 wide; root node `0:1`.
- Deploy: Cloudflare Pages project `jungle-gaming-challenge`; the command, the URL and an observed problem with `wrangler@latest` are in `ARCHITECTURE.md` §9. Use `wrangler@4.20.0`, which worked. Check the public URL with `BASE_URL=<url> pnpm test:e2e`.
- IMPORTANT: production is published only by the CI deploy job on `main`, and only when every check is green (verify, E2E and the other gates). Never deploy from this machine, and never skip, weaken or retry-until-green a check to get a deploy. If CI is red, running or skipped, there is no deploy. A manual deploy is allowed only when Rafael approves it in that same message.
