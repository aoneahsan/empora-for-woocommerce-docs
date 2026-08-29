# Manual / User-Only Tasks — Empora for WooCommerce Docs

> The ONE place for everything only you (the human) can do. Fixed path: `docs/MANUAL-TASKS.md`.
> Global spec: `~/.claude/rules/manual-tasks.md`. Excluded from the published site (see
> `docusaurus.config.ts` → `docs.exclude`) because this repo is public.
> Last updated: 2026-08-29

## ⏳ Pending manual tasks

| # | Task | Why only you | Status |
|---|------|--------------|--------|
| — | Nothing pending. | — | — |

## ✅ Completed manual tasks

| # | Task | Resolution | Date |
|---|------|-----------|------|
| 1 | **Add DNS.** `CNAME` record `empora-docs` → `aoneahsan.github.io` on `aoneahsan.com`. | Done — `https://empora-docs.aoneahsan.com` resolves and answers HTTP 200. | 2026-08-29 (verified) |
| 2 | **Configure GitHub Pages** — source = GitHub Actions, custom domain, Enforce HTTPS. | Done — the custom domain serves over HTTPS. | 2026-08-29 (verified) |

`static/CNAME` ships `empora-docs.aoneahsan.com` inside `build/`, and `.github/workflows/deploy-pages.yml`
builds and publishes on every push to `main`.
