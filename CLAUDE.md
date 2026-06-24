# CLAUDE.md — Empora for WooCommerce Docs

Last updated: 2026-06-24

Public Docusaurus 3 documentation site for **Empora for WooCommerce**. This repo is the SEPARATE, **PUBLIC** docs repo for the (private) app repo `aoneahsan/all-in-one-woocommerce`.

## What this is

- Docusaurus 3 + React 19 + TypeScript. `docs/` holds markdown (routeBasePath `/`); `src/pages/index.tsx` is the home page.
- Live domain: `docs.empora.aoneahsan.com`. Product: `empora.aoneahsan.com`. Plugin: WordPress.org.
- Dual-hosting: `firebase.json` + `.firebaserc` (Firebase project `empora-for-woocommerce-docs`) AND `.github/workflows/deploy-pages.yml` (GitHub Pages). `static/CNAME` = `docs.empora.aoneahsan.com`. Pick ONE live host.

## Rules

- **PUBLIC repo — NO secrets.** Never commit `.env`, keys, tokens, or service accounts. `.gitignore` ignores env files; keep it that way.
- Local installs use **yarn** only (never npm/pnpm). `yarn.lock` is the only lock file.
- **Never run dev/preview servers** as a task side effect; verify with one-shot `yarn build` + `yarn typecheck`.
- Content must be **accurate to the real plugin** — free core (7 modules) vs premium (license-gated); HPOS-compatible; WP 6.0+, WooCommerce 8.0+, PHP 8.1+. No fabricated features, stats, or claims.
- SEO floor must stay intact: robots.txt AI-bot allowlist, sitemap.xml, llms.txt, per-page meta/OG, JSON-LD. Keep `lastmod` fresh.
- Deploy is **USER-ONLY** (needs Firebase project / Pages enablement + DNS).

## Verify

```bash
yarn install
yarn build       # must exit 0; emits ./build with sitemap.xml
yarn typecheck   # tsc --noEmit
```

## Content enrichment

Long-tail SEO batches tracked in `tracking/empora-for-woocommerce-docs-content-tracker.json` (per the global SEO playbook `~/.claude/rules/seo-aeo-ranking.md`).

## Sync rule

Every rule here is mirrored in `AGENTS.md`. Update both together.
