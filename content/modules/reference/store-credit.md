---
id: store-credit
title: "Store Credit & Wallet"
description: "A balance the store issues — goodwill, compensation or a returns credit — with a ledger recording the balance each movement produced, spent at checkout before the customer's own wallet money."
keywords:
  - woocommerce store credit
  - customer balance
  - credit ledger
  - goodwill credit
format: md
---
## Overview

Store Credit holds a per-customer balance the **store** issued: goodwill, compensation, a promotion, or the
value of a return. Beside it sits an append-only transaction ledger. Credit is added or deducted through one
service that writes the transaction and the resulting balance together, so every movement carries the balance
it produced.

It is a premium module. Enable it from **Empora → Modules** once your license includes `store_credit`;
enabling it creates its two tables, writes the default settings and schedules the expiry job.

## Availability

| Item            | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Module key      | `store_credit`                                          |
| Tier            | Premium                                                 |
| Entitlement key | `store_credit`                                          |
| Admin tab       | `store-credit`, under **Pricing & Promotions**          |
| Enabled option  | `aiowc_module_enabled_store_credit` (off until enabled) |
| REST namespace  | `aiowc/v1`                                              |

## Store Credit and Wallet are two ledgers

Both modules ship, and a store can run either or both.

- **Wallet** holds money the **customer** paid in — a top-up they made themselves.
- **Store Credit** holds value the **store** issued. The shopper never paid for it.

They keep their own tables and their own ledgers, because they are not the same money and an accountant needs
to tell them apart. What they share is the moment of spending: checkout shows the customer **one combined
balance**, and the order needs one decision about where the money came from.

:::note Issued credit is spent first
When a customer pays with their balance, Store Credit is drawn down before Wallet. Issued credit is the
store's own liability and often carries an expiry; wallet money is the customer's and does not. Spending the
customer's own money while issued credit sits expiring would be the wrong way round.
:::

Partial application is a normal outcome, not a failure: a customer with 5.00 of credit against a 30.00 order
pays the remaining 25.00 by the usual method. Neither ledger can go below zero — each debit is capped at that
ledger's own balance.

Because either module may be switched off, every balance read is guarded twice: the module must be present
**and** enabled. A missing ledger contributes zero rather than failing. See
[Wallet](/modules/reference/wallet) for the other half.

## What the module does

`StoreCreditService` implements: read a wallet, read a balance, add credit, deduct credit, apply credit to an
order, refund credit against an order, an administrator adjustment recorded with the acting admin's id,
expiry processing, transaction history, and a checkout calculation that works out how much of an order total
the customer's credit may cover.

## Settings

Stored in the bundled option row `aiowc_storecredit_settings` and written when the module is enabled: a
checkout switch, a minimum amount to apply, a maximum percentage of an order that credit may cover, account
and header display switches, an expiry window in days, partial payment, a balance email, and whether a
negative balance is allowed.

## REST API endpoints

Registered by `StoreCreditRest::register_routes()` on `rest_api_init`. The customer routes read the signed-in customer's own balance; the rest require an administrator.

| Method             | Path                                | Purpose                                                |
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

## Database schema

Created by `Schema/DatabaseSchema.php` when the module is enabled.

| Table                               | Holds                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_store_credit`        | One row per customer: balance, lifetime credit and debit, currency, active flag.           |
| `{prefix}aiowc_credit_transactions` | Every movement: amount, type, reference, resulting balance, description, admin id, expiry. |

## WooCommerce integration

`CreditDisplayHandler` adds a balance banner to the cart and checkout, a **Store Credit** page in My Account, a credit option in the checkout order review, the balance in order emails, and the credit used on the order details page. Each group is behind its own display setting.

| Hook                                          | Adds                                   |
| --------------------------------------------- | -------------------------------------- |
| `woocommerce_before_cart`                     | Balance banner on the cart             |
| `woocommerce_before_checkout_form`            | Balance banner on checkout             |
| `woocommerce_account_menu_items`              | **Store Credit** entry in My Account   |
| `woocommerce_account_store-credit_endpoint`   | The My Account credit page             |
| `woocommerce_review_order_before_payment`     | The credit option in the order review  |
| `woocommerce_email_order_meta`                | Credit used, in order emails           |
| `woocommerce_order_details_after_order_table` | Credit used, on the order details page |

## Background jobs

`CreditExpiryJob` (`aiowc_store_credit_expiry`) expires credit on a schedule, and is unscheduled when the module is disabled.

## Entitlement limits

The entitlement is a single on/off grant: without `store_credit` the module stays locked, and while it is absent none of the above loads. No per-customer or per-balance quota is applied by the license.
