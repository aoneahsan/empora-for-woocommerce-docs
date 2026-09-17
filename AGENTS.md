# AGENTS.md — Empora for WooCommerce Docs

Last updated: 2026-09-12

Public Docusaurus 3 documentation site for **Empora for WooCommerce**. This repo is the SEPARATE, **PUBLIC** docs repo; the product itself lives in a separate private repository, which is never named here.

## What this is

- Docusaurus 3 + React 19 + TypeScript. **`content/` holds the published markdown** (routeBasePath `/`);
  `src/pages/index.tsx` is the home page; `changelog/` holds release posts (the blog plugin, which is what
  generates the RSS feed).
- 🔴 **`docs/` is NOT published.** It holds only the internal fixed-path `docs/MANUAL-TASKS.md`. The
  published content dir is `content/`, so nothing in `docs/` can reach the public site — this repo is
  public and that separation is the safeguard. Never point `docs.path` back at `docs/`.
- `src/data/*.json` is generated from the product repo's module manifest and plan catalog; the module
  reference and pricing tables render from it. Never hand-edit those files or type a module or price into
  a page — regenerate instead, or the docs and the software drift.
- Live domain: `empora-docs.aoneahsan.com`. Product: `empora.aoneahsan.com`. The plugin is not published on
  WordPress.org yet — do not link a listing that does not exist.
- 🔴 **Hosting is GitHub Pages, and only GitHub Pages.** `.github/workflows/deploy-pages.yml` builds and
  deploys on every push to `main`; `static/CNAME` = `empora-docs.aoneahsan.com` pins the domain. There is no
  Firebase project, no `firebase.json` and no `.firebaserc` — a docs site never gets one. Do not add a second
  host.

## Rules

- 🔴 **FilesHub IS named on the privacy page here, deliberately** (owner decision, 2026-08-30;
  recorded as D-035 in the product repo). The global rule bans naming it in a CLIENT project,
  where it is private tooling the client never agreed to. On this product it is a genuine
  **subprocessor** — uploaded files and transactional email flow through it — and the product's own
  legal pages have always listed `FilesHub (fileshub.zaions.com)` in their subprocessor table.
  Removing it from this site made the two disagree about the same service while keeping nothing
  private. Do not strip it again.
  ⚠️ It is named only as a service in the data flow — never as tooling, never a token, never a
  Management API or vault reference.

- **PUBLIC repo — NO secrets.** Never commit `.env`, keys, tokens, or service accounts. `.gitignore` ignores env files; keep it that way.
- Local installs use **yarn** only (never npm/pnpm). `yarn.lock` is the only lock file.
- **Never run dev/preview servers** as a task side effect; verify with one-shot `yarn build` + `yarn typecheck`.
- Content must be **accurate to the real plugin** — 78 modules, all of which register and can be enabled;
  free core (7 modules) vs premium (71, license-gated); HPOS-compatible; WP 6.2+, WooCommerce 8.0+, PHP 8.1+.
  No fabricated features, stats, or claims. Never state or imply that a module in the manifest cannot be
  enabled.
- SEO floor must stay intact: robots.txt AI-bot allowlist, sitemap.xml, llms.txt, per-page meta/OG, JSON-LD. Keep `lastmod` fresh.
- **Pushing `main` here is pre-authorised** — this is an ordinary public docs site for an own product, so it
  is committed and pushed without asking. The push triggers the Pages deploy; there is no separate deploy
  step. DNS and the Pages custom-domain setting remain owner-only and belong in `docs/MANUAL-TASKS.md`.

## Verify

```bash
yarn install
yarn build       # must exit 0; emits ./build with sitemap.xml
yarn typecheck   # tsc --noEmit
```

## Content enrichment

Long-tail SEO batches tracked in `tracking/empora-for-woocommerce-docs-content-tracker.json` (per the global SEO playbook `~/.claude/rules/seo-aeo-ranking.md`).

## Fleet law and the guide pair

Global rules auto-load from `~/.claude/rules/` — never copied here, and never restated on this public
surface. The three sections that used to repeat them (sync rule, sub-agents, model workflow) were removed on
2026-09-17; their verbatim text lives in the private product repo's `docs/PROJECT-RULES.md`. This file and
`AGENTS.md` are one pair, identical apart from the first line; edit both in the same change.

| Context budget | Value |
| --- | --- |
| Last optimized | 2026-09-17 |
| Next routine optimization eligible | 2026-10-17 |
| Guide bytes | 4,677 B |
| Covered subtree | this repo's root pair (it has no nested guides) |
| Method | Three fleet-law restatements replaced by one pointer; nothing project-specific removed |
| Fleet record | `D:/work/my-work/docs/tracking/project-context-budget-tracker.json` |
