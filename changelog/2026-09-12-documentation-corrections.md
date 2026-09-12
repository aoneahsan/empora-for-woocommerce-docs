---
title: Documentation corrections — all 78 modules, and the new plan limits
description: Three modules were documented as unavailable in 1.0 after they had already been enabled. That is corrected across the site, along with the free, Starter and Professional record limits.
slug: documentation-corrections-2026-09-12
authors: [aoneahsan]
tags: [documentation]
date: 2026-09-12
---

This site said three modules could not be enabled in version 1.0. That stopped being true when they were
registered, and the pages were not updated with them. Corrected today, along with the plan limits.

<!-- truncate -->

## All 78 modules register

`inventory` (Advanced Inventory Management), `livechat` (Live Chat & Customer Support) and `store_credit`
(Store Credit & Wallet) were described across this site as being in the catalogue but impossible to switch
on. They were registered on 2 September, and the documentation kept saying otherwise.

Every one of the 78 modules in the plugin's manifest registers and can be enabled. The only thing deciding
whether you can switch a module on is whether your plan includes it.

The three modules' reference pages were rewritten from the code they actually run, rather than described as
unreleased work:

- [Advanced Inventory Management](/modules/reference/inventory) — stock per location, transfers with their
  own lifecycle, an audit log, and the daily low-stock alert.
- [Live Chat & Customer Support](/modules/reference/livechat) — the storefront widget, the agent roster,
  session assignment and transfer, and message polling.
- [Store Credit & Wallet](/modules/reference/store-credit) — the issued-credit ledger, and how it sits
  beside Wallet.

## Wallet and Store Credit are two ledgers, not two versions of one feature

Documentation that treated Store Credit as a dropped duplicate of Wallet was wrong about what the two
modules are for. **Wallet** holds money the customer paid in; **Store Credit** holds value the store issued —
goodwill, compensation, the value of a return. They keep separate ledgers because they are not the same
money. At checkout the customer sees one combined balance, and the issued credit is spent first, because it
is the store's own liability and it can expire.

## Free, Starter and Professional no longer cap records

The product limits on how many products, orders and customers Empora's modules will process have been
removed from the Free, Starter and Professional plans. All five tiers are now unlimited on those three
counts.

Prices, site counts and module counts are unchanged: Free $0 (1 site, 7 modules), Starter $19 (27 modules),
Professional $49 (48 modules), Business $99 (3 sites, 68 modules), Enterprise $299 (unlimited sites, all 78).
Import and export allowances are unchanged too — they remain the practical difference between the tiers. See
[Plans & pricing](/pricing).

## Also corrected

- The [modules overview](/modules/overview) listed module names that no longer exist beside their
  replacements, and claimed the plugin carried "90+ module directories". It now lists the 78 real modules by
  area, with the key each one uses.
- The [referral program](/modules/reference/referral-program) page said neither reward type had anything
  listening for it, so no payout was ever delivered. Both types now have a listener, and a referral is marked
  paid only once delivery is confirmed. A store-credit reward is credited to the customer's wallet, so it
  needs the Wallet module enabled.
- `llms.txt`, which is what AI assistants read, carried the same false module claim and the old plan limits.
