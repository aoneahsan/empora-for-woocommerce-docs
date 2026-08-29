---
id: wallet
title: "Wallet / Store Credit"
description: "Give customers a balance they top up, spend at checkout and watch expire, with a ledger recording the balance each movement produced."
keywords:
  - woocommerce wallet
  - store credit balance
  - customer top-up
  - credit ledger
format: md
---
## Overview

The Wallet module gives every customer a balance they can top up, spend at checkout and watch expire. Money moves through one service that writes the transaction and the resulting balance together, so the ledger always carries the balance each movement produced.

A customer tops up by paying a WooCommerce order the module creates for the purpose; when that order completes, the credit lands. At checkout they can tick a box to pay with their balance, and a refund can optionally be returned as credit rather than to the original payment method.

It is for stores running prepaid balances, deposit schemes or goodwill credit. It is the registered module for stored value in this release — the separate [Store Credit](/modules/reference/store-credit) module is present in the repository but does not load.

## Availability

| Item            | Value                                               |
| --------------- | --------------------------------------------------- |
| Module key      | `wallet`                                            |
| Tier            | Premium                                             |
| Entitlement key | `wallet`                                            |
| Admin tab       | `wallet`, under **Loyalty & Customers**             |
| Enabled option  | `aiowc_module_enabled_wallet` (off until turned on) |
| REST namespace  | `aiowc/v1`                                          |

Enabling the module creates the two tables below, seeds the defaults and schedules both jobs. `registerHooks()` returns early twice: once when the licence does not grant `wallet`, and again when `enable_wallet` is off — so switching that setting off takes the REST routes and every hook out of the request entirely.

On each request the module also runs `WalletSchema::upgradeIfNeeded()` on `init` at priority 5, which brings an older ledger up to the current schema version and backfills reference keys.

## Settings

Stored in the bundled option row `aiowc_wal_settings`.

| Stored key           | Default | Meaning                                                                         |
| -------------------- | ------- | ------------------------------------------------------------------------------- |
| `enable_wallet`      | `true`  | Master switch. Off means no hooks, no routes and no wallet UI.                  |
| `min_top_up`         | `5.0`   | Smallest top-up accepted; a smaller amount produces no order.                   |
| `refund_as_credit`   | `false` | Return a WooCommerce refund to the wallet instead of leaving it to the gateway. |
| `credit_expiry_days` | `365`   | Life of credited amounts, used when an expiry date is set on a transaction.     |

## Idempotency

Every transaction may carry a `reference_key`, unique across the table. `WalletService::credit()` refuses to write a second transaction for a key that already exists, which is what stops a repeated webhook or a re-fired order hook crediting a customer twice.

Older ledgers written before that column are backfilled by the schema upgrade: the first row of each `(type, source, source_ref)` group is given the key it would have had, and later rows of the same group — the exact duplicates the key exists to prevent — are marked rather than deleted, so they stay visible in the ledger.

## Top-ups

`TopUpService::createTopUpOrder()` creates a pending WooCommerce order carrying a single **fee** line for the amount, with no product and no tax, flagged with `_aiowc_wallet_topup` and `_aiowc_wallet_topup_amount`. The customer pays it like any other order. On `woocommerce_order_status_completed` the service reads the flag and credits the wallet, keyed `topup:order:{order_id}` so a re-fired completion cannot credit twice.

An amount below `min_top_up` produces no order at all.

## Spending at checkout

When a signed-in customer has a positive balance, a **Use wallet credit** checkbox is drawn after the payment section. If it is ticked, `woocommerce_checkout_order_processed` debits the smaller of the balance and the order total.

## Expiry and reminders

`ExpiryService` walks credits whose `expires_at` has passed and debits them, capping each debit at the wallet's current balance so a wallet cannot go negative, and recording the movement as type `expire`. It counts what has already been expired for a reference so the same credit is not expired twice.

`RemindersJob` looks 30 days ahead, takes one row per customer with a positive balance, and emails a reminder that credit is due to expire.

## Admin screen

The **Wallet** tab adjusts one customer's balance: a user id, an amount whose **sign is the operation** — positive credits, negative debits — and a reason. Zero is refused, as is a user id of zero, both with the code `adjust_invalid`. The change is recorded against the acting administrator as `admin:{id}` and takes effect immediately; there is no reversal route, so a mistake is corrected by posting the opposite adjustment.

**Check the balance** reads that customer's current balance and paged history over `GET /wallet/admin/balance`, and the confirmation then states the balance before and after. When the balance cannot be read the screen says so rather than implying it knows what the adjustment will produce.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                       | Purpose                                                                       | Permission           | Required args       |
| ------ | -------------------------- | ----------------------------------------------------------------------------- | -------------------- | ------------------- |
| GET    | `/wallet/balance`          | The signed-in customer's balance.                                             | Signed-in user       | –                   |
| GET    | `/wallet/history`          | The signed-in customer's ledger; `page`, `per_page`, `type`.                  | Signed-in user       | –                   |
| POST   | `/wallet/add`              | Create a top-up order for the signed-in customer and return its checkout URL. | Signed-in user       | `amount`            |
| POST   | `/wallet/spend`            | Debit the signed-in customer's wallet, optionally against an `order_id`.      | Signed-in user       | `amount`            |
| GET    | `/wallet/admin/balance`    | A named customer's balance and paged history. `per_page` capped at 50.        | `manage_woocommerce` | `user_id`           |
| POST   | `/wallet/{user_id}/adjust` | Credit or debit a customer. The sign of `amount` is the operation.            | `manage_woocommerce` | `user_id`, `amount` |

The three customer-facing reads resolve the user from `get_current_user_id()`, so they always describe the caller and never another customer.

## WooCommerce integration

| Hook                                     | What the module does                                                 |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `woocommerce_review_order_after_payment` | Draws the "use wallet credit" checkbox when the balance is positive. |
| `woocommerce_checkout_order_processed`   | Debits the wallet when the box was ticked.                           |
| `woocommerce_order_refunded`             | Credits the refund back to the wallet when `refund_as_credit` is on. |
| `woocommerce_order_status_completed`     | Credits a completed top-up order.                                    |
| `woocommerce_account_menu_items`         | Adds **Wallet** to My Account after the dashboard item.              |
| `woocommerce_account_wallet_endpoint`    | Renders the wallet page: balance, history and the top-up form.       |
| `template_redirect`                      | Handles the top-up form submission, behind a verified nonce.         |
| `init`                                   | Registers the `wallet` account endpoint and runs the schema upgrade. |

**Shortcode** `[aiowc_wallet_balance]` prints the signed-in customer's balance.

## Database schema

| Table                               | Holds                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_wallets`             | One row per customer: balance, lifetime credited and debited, a lock flag. Unique on user id.                            |
| `{prefix}aiowc_wallet_transactions` | Every movement: amount, resulting balance, type, source and source reference, unique reference key, description, expiry. |

## Background jobs

| Hook                          | Interval | Work                                                                     |
| ----------------------------- | -------- | ------------------------------------------------------------------------ |
| `aiowc_wallet_expire_credits` | daily    | Expires credits past their date, capped at the current balance.          |
| `aiowc_wallet_reminders`      | weekly   | Emails customers whose credit expires within 30 days, once per customer. |

## Action hooks for integrators

| Hook                    | Fired when                                                         |
| ----------------------- | ------------------------------------------------------------------ |
| `aiowc_wallet_credited` | A wallet is credited, with the user, amount, new balance and type. |
| `aiowc_wallet_debited`  | A wallet is debited, with the same arguments.                      |

## Entitlement limits

`wallet` is an on/off grant with no cap on balances or transactions. The numeric limits are store settings — the minimum top-up and the expiry window — plus the 50-row page cap on the two paged reads.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- **No payment provider is involved in a top-up beyond WooCommerce itself.** The module creates an order with a fee line; whatever gateway the store already has takes the payment.
- There is no admin list of wallets — the administrator read is per customer, by id, so finding who holds a balance means knowing the user id already.
- There is no reversal route for an adjustment; corrections are made by posting the opposite amount.
- A rejected adjustment answers `adjust_invalid` for both a zero amount and a zero user id, so the caller cannot tell which was wrong.
