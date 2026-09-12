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

## Sync rule

Every rule here is mirrored in `CLAUDE.md`. Update both together.

## Sub-agents & Skills — Main-Context-First (IRON-SOLID)

Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)

<!-- RULE:main-context-model-workflow v2026-07-16 -->

## Main-Context + Skills + Model Workflow (IRON-SOLID — CRITICAL)

1. **NO default/built-in sub-agents** (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) for ANY work in
   this project — they cannot invoke /skills, which RULE #0 makes mandatory. Do ALL work (planning, implementation,
   review, exploration) in the MAIN context. A sub-agent is allowed ONLY when a CUSTOM agent exists in
   `.claude/agents/` for that exact job.
2. **Skills always:** before any task, scan the available-skills list and invoke EVERY relevant skill; if a needed
   skill is missing, download/enable/install it (or use the nearest installed equivalent and say so) — never
   proceed skill-less.
3. **Model workflow:** the planning/execution split and the minimum model version are defined once, globally
   — follow `~/.claude/rules/01-authorizations.md` rather than any version pinned in this file. Plans live in
   `~/.claude/plans/`; multi-phase features keep a resumable tracker (`docs/features/<slug>/00-tracker.json`),
   resumed rather than re-planned from zero.

Global records (rules, policy, audit reports) are auto-loaded from `~/.claude/rules/`; full text:
`~/.claude/CLAUDE.md`. This repo is PUBLIC — never name a private repo, host, or internal tool in it.
(Owner directives 2026-07-11 / 2026-07-14; fleet-rolled 2026-07-16.)
