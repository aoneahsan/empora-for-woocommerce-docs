---
id: changelog
title: Developers changelog
description: Changes to the Empora API, the address for assistants, webhooks and two-factor sign-in, newest first, with the date each one reached your account.
sidebar_position: 7
keywords:
  - empora api changelog
  - empora webhooks changes
last_update:
  date: 2026-11-21
---

# Developers changelog

**Changes to the API, the address for assistants, webhooks and two-factor sign-in, newest first.** Each entry
carries the date it reached your account. Plugin releases have their own [changelog](/changelog).

## 2026-11-21 {#2026-11-21}

Your Empora account opens to tools you connect yourself, on every plan.

- **[Access keys](./access-keys.md).** Keys that start `em_pat_`, each reaching only what you tick, with an expiry of
  30, 90 or 365 days, or never for a key that only reads. Older keys made before this are listed under
  **Older keys** and keep working until you replace or remove them.
- **[The API](./api.md)** at `https://empora-api.aoneahsan.com/api/v1`: read your licences, sites, plan and store
  connections, deactivate a site, rename a connection, and ask to disconnect a store, which waits for your yes.
  Described in OpenAPI 3.1 at `/api/v1/openapi.json`.
- **[Assistants](./assistants.md).** Claude, ChatGPT, Claude Code and Cursor connect at
  `https://empora-api.aoneahsan.com/mcp`, with eleven tools and the same ticks as a key.
- **[Webhooks](./webhooks.md).** Sixteen events about licences, sites, your plan and store connections, signed to the
  Standard Webhooks format, with retries over about a day and a delivery log for 30 days.
- **[Two-factor sign-in](./two-factor.md).** A code from your phone after Google, ten recovery codes, and an
  opt-in 7 days without the code on a browser you trust.
- **Limits on each plan** for keys, requests a day, webhook addresses and assistant connections, listed in
  [the overview](./index.md#limits-on-each-plan).
