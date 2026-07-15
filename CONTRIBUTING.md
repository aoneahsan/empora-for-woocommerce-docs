# Contributing to Empora for WooCommerce Docs

Thanks for helping improve the documentation at [empora-docs.aoneahsan.com](https://empora-docs.aoneahsan.com).

## Governance

- `main` is protected by a repository ruleset: changes land via **pull request with at least 1 approving review**; force-pushes and branch deletion are blocked.
- Only the repository owner ([aoneahsan](https://github.com/aoneahsan)) can push to `main` directly (admin bypass, used for maintenance).
- Merged changes deploy automatically to GitHub Pages via `.github/workflows/deploy-pages.yml`.

## How to contribute

1. **Fork + PR** — anyone can do this, no access needed. Fork the repo, branch, edit, open a pull request.
2. **Collaborator (write) access** — open an issue requesting it or email `aoneahsan@gmail.com`. Granted at the owner's discretion; write access still cannot bypass PR review on `main`.

## Dev setup

```bash
yarn install --frozen-lockfile
yarn start        # local dev server
yarn build        # production build (must pass before a PR)
```

## Standards

- Docusaurus 3, TypeScript config. Content lives in `docs/`; site chrome in `src/` + `docusaurus.config.ts`.
- Keep pages factual and in sync with the actual product (Empora for WooCommerce). No fabricated claims or stats.
- Conventional Commits for commit messages (e.g. `docs: clarify license activation steps`).
- `yarn build` must exit clean before requesting review.

## Reporting problems

Open a [GitHub issue](https://github.com/aoneahsan/empora-for-woocommerce-docs/issues).

## Support

If this project helps you, you can support the developer at [aoneahsan.com/payment](https://aoneahsan.com/payment?project-id=empora-for-woocommerce-docs&project-identifier=empora-docs.aoneahsan.com).
