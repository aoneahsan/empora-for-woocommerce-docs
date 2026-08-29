---
id: store-credit
title: "Store Credit & Wallet"
description: "A customer credit balance. This module is in the catalogue but does not register in 1.0 and cannot be enabled; the Wallet module ships instead."
keywords:
  - woocommerce store credit
  - customer balance
  - not in 1.0
  - wallet alternative
format: md
---
:::warning This module does not ship in 1.0
`store_credit` (Store Credit & Wallet) is part of the catalogue but does not run in 1.0: it is not
registered, so it cannot be enabled and nothing described below is active on a live site. The
separate [Wallet](/modules/reference/wallet) module covers the same ground and is available. See the
[module reference](/modules/reference).
:::

## Not available in this release

**This module does not load.** Its manifest row carries `register: false` and `status: "unregistered"`, so `ModuleRegistry::registerFromManifest()` skips it: the class is never constructed, `registerHooks()` is never called, and nothing it contains reaches a running site.

In practice that means:

- Its REST routes are **not registered**. Every path under `/aiowc/v1/store-credit/` answers `404` on a live install.
- Its front-end hooks do not run — no balance banner, no My Account page, no checkout credit option.
- Its tables are never created, because `onEnable()` is unreachable.
- It cannot be switched on from the Modules screen, because it is not in the registry to be switched on.

The **Store Credit** admin tab is still present in the admin app and still calls those routes, which is the defect the August audit recorded as _"advertised (admin page) but never registered"_. Opening the tab produces request failures rather than data.

**Use the [Wallet](/modules/reference/wallet) module instead.** It is registered, it covers the same ground — a per-customer balance, top-ups, spending at checkout, expiry — and it is what the release ships for stored value.

Everything below describes code that exists in the repository. It is a record of what the module would do if it were registered, not a description of behaviour available today, and it is deliberately not written as a setup guide.

## Manifest row

| Item            | Value                                              |
| --------------- | -------------------------------------------------- |
| Module key      | `store_credit`                                     |
| Tier            | Premium                                            |
| Entitlement key | `store_credit`                                     |
| Registers       | **No** — `register: false`, `status: unregistered` |
| Admin tab       | `store-credit`, under **Pricing & Promotions**     |
| Recorded issue  | "advertised (admin page) but never registered"     |

## What the code would do

The module holds a per-customer credit balance and an append-only transaction ledger beside it. Credit is added or deducted through a service that writes the transaction and the resulting balance together, so every movement carries the balance it produced.

`StoreCreditService` implements: read a wallet, read a balance, add credit, deduct credit, apply credit to an order, refund credit against an order, an administrator adjustment recorded with the acting admin's id, expiry processing, transaction history, and a checkout calculation that works out how much of an order total the customer's credit may cover.

Settings exist in the source as a `DEFAULTS` array — a checkout switch, a minimum amount to apply, a maximum percentage of an order that credit may cover, account and header display switches, an expiry window in days, partial payment, a balance email, and whether a negative balance is allowed. None of them are written anywhere today, because the code that seeds them does not run.

## Routes that exist in the source but are not served

These are declared by `StoreCreditRest::register_routes()`. They are listed for completeness; on a running site they are not reachable.

| Method             | Path                                | Would do                                               |
| ------------------ | ----------------------------------- | ------------------------------------------------------ |
| GET                | `/store-credit/wallet`              | The signed-in customer's balance.                      |
| GET                | `/store-credit/transactions`        | The signed-in customer's ledger.                       |
| GET                | `/store-credit/checkout-info`       | How much credit may be applied to a given order total. |
| POST               | `/store-credit/apply`               | Apply credit to an order.                              |
| GET                | `/store-credit/overview`            | Totals for an administrator overview.                  |
| GET                | `/store-credit/users`               | Customers with a balance.                              |
| GET                | `/store-credit/users/{user_id}`     | One customer's wallet, read by an administrator.       |
| POST               | `/store-credit/adjust`              | Adjust one customer's balance.                         |
| POST               | `/store-credit/bulk-adjust`         | Adjust several customers at once.                      |
| GET                | `/store-credit/recent-transactions` | The most recent ledger entries across customers.       |
| GET                | `/store-credit/settings`            | Read the settings.                                     |
| PUT / PATCH / POST | `/store-credit/settings`            | Update the settings.                                   |

## Tables that would be created

| Table                               | Would hold                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_store_credit`        | One row per customer: balance, lifetime credit and debit, currency, active flag.           |
| `{prefix}aiowc_credit_transactions` | Every movement: amount, type, reference, resulting balance, description, admin id, expiry. |

Neither table is created on a current install.

## Front-end integration that would apply

`CreditDisplayHandler` would add a balance banner to the cart and checkout, a **Store Credit** page in My Account, a credit option in the checkout order review, the balance in order emails, and the credit used on the order details page. `CreditExpiryJob` (`aiowc_store_credit_expiry`) would expire credit on a schedule.

None of these hooks are attached today.

## Relationship to Wallet

[Wallet](/modules/reference/wallet) is the registered module covering stored value in this release. The two overlap heavily — both keep a per-customer balance with a transaction ledger, apply it at checkout and expire it on a schedule — and only Wallet actually loads. Nothing migrates data between them, because Store Credit has never written any.
