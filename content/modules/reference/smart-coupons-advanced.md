---
id: smart-coupons-advanced
title: "Smart Coupons Advanced"
description: "Auto-applying coupons, URL coupons and BOGO built on WooCommerce's own coupons, plus a per-customer store credit balance."
keywords:
  - woocommerce auto apply coupon
  - url coupon
  - bogo coupon
  - store credit balance
format: md
---
## Overview

Smart Coupons Advanced extends WooCommerce's own coupons rather than replacing them. A WooCommerce coupon gains a row in this module's table that says how it should behave: apply itself automatically when the cart qualifies, be applied by a link, or act as a buy-one-get-one offer.

It also carries a **store credit** balance per customer, spendable at checkout and expirable, plus a configurable reward percentage that turns completed orders into credit.

Because it builds on WooCommerce coupons, the discount logic, usage limits and restrictions a store already knows continue to work; this module decides when and how the coupon reaches the cart.

It is for stores running promotions that should not require the customer to know a code.

## Availability

| Item            | Value                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| Module key      | `smart-coupons-advanced`                                                 |
| Tier            | Premium                                                                  |
| Entitlement key | `smart-coupons-advanced`                                                 |
| Admin tab       | `smart-coupons`                                                          |
| Enabled option  | `aiowc_module_enabled_smart-coupons-advanced` (off until turned on)      |
| REST namespace  | `aiowc/v1`                                                               |

Enabling the module creates the four tables below, seeds the defaults and schedules the three jobs.

`registerHooks()` returns early when the licence does not grant `smart-coupons-advanced`. Each feature is then constructed with its setting passed in, so a feature switched off is inert inside the service rather than merely hidden.

## Settings

Stored in the bundled option row `aiowc_sc_settings`.

| Stored key                 | Default | Meaning                                                                         |
| -------------------------- | ------- | --------------------------------------------------------------------------------- |
| `enable_auto_apply`        | `true`  | Whether qualifying coupons apply themselves.                                     |
| `enable_url_coupons`       | `true`  | Whether a coupon can be applied by visiting a link.                              |
| `enable_bogo`              | `true`  | Whether buy-one-get-one coupons are processed.                                   |
| `enable_store_credit`      | `true`  | Whether the store credit balance is offered at checkout.                         |
| `allow_coupon_stacking`    | `false` | Whether several coupons may apply at once. **Off by default.**                   |
| `show_coupon_notification` | `true`  | Whether the customer is told a coupon was applied for them.                      |
| `reminder_days_before`     | `3`     | How far ahead of expiry a reminder is sent.                                      |
| `credit_expiry_days`       | `365`   | How long issued store credit lasts.                                              |
| `reward_percent`           | `0.0`   | Percentage of a completed order returned as store credit. **Zero by default — the reward feature is off until a store sets it.** |

## Coupon behaviours

| `coupon_type` / flag | Behaviour                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `auto_apply`         | The coupon applies itself when the cart matches its restrictions. The default type.   |
| `url_coupon`         | The coupon is applied when the customer arrives on a link carrying its code.          |
| BOGO                 | Configured in `bogo_config`, giving an item when a qualifying item is bought.          |

`restrictions` holds the module's own extra conditions, and `expires_at` gives a smart coupon its own expiry independent of the WooCommerce coupon's.

Whether two coupons may apply together is governed by `allow_coupon_stacking`, which is **off** by default — so without changing it, one coupon applies at a time.

## Store credit

A credit row carries a balance, a source (`admin` by default), the order it came from, and an expiry. Spending writes a transaction row with the amount, the type, a description and the order.

With `reward_percent` above zero, a completed order issues credit worth that percentage of the order back to the customer, expiring after `credit_expiry_days`.

🔴 **This is the plugin's second store-credit ledger.** Its tables are `aiowc_store_credits` and `aiowc_store_credit_transactions`; the separate [Store Credit](/modules/reference/store-credit) module owns `aiowc_store_credit` and `aiowc_credit_transactions`. **The names differ only by a plural**, the two are not connected, and a balance in one is invisible to the other. See the limits below.

## Admin screen

The **Smart Coupons** tab lists the smart coupon rows and creates, edits and deletes them, shows per-coupon analytics, and edits the module's nine settings.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                        | Purpose                                             | Permission           | Required args |
| ----------------- | --------------------------- | ----------------------------------------------------- | -------------------- | ------------- |
| GET               | `/coupons/smart`            | Every smart coupon row.                              | `manage_woocommerce` | –             |
| POST              | `/coupons/smart`            | Attach smart behaviour to a coupon.                  | `manage_woocommerce` | `coupon_type` |
| PATCH             | `/coupons/smart/{id}`       | Update it.                                           | `manage_woocommerce` | `id`          |
| DELETE            | `/coupons/smart/{id}`       | Remove it.                                           | `manage_woocommerce` | `id`          |
| GET               | `/coupons/{id}/analytics`   | How often the coupon has been used, and for how much.| `manage_woocommerce` | `id`          |
| GET / PATCH / PUT / POST | `/coupons/settings`  | Read and write the settings.                         | `manage_woocommerce` | –             |
| GET               | `/coupons/auto-apply`       | The coupons that would apply to this cart.           | Public, rate-limited | –             |
| POST              | `/coupons/url-apply/{code}` | Apply a coupon by code from a link.                  | Nonce, rate-limited  | –             |
| GET               | `/store-credits/balance`    | The signed-in customer's credit balance.             | Signed-in user       | –             |
| POST              | `/store-credits/apply`      | Spend credit on the current cart.                    | Signed-in user       | –             |

The two store-credit routes require a signed-in customer, so a balance is always read for the caller rather than for a named user id.

## WooCommerce integration

| Hook                                    | What the module does                                                    |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `init`                                  | Registers the URL-coupon handler, so a link applies its coupon on arrival. |
| `woocommerce_before_calculate_totals`   | Applies auto-apply coupons, BOGO and store credit to the cart.           |
| `woocommerce_applied_coupon`            | Reacts when a coupon is applied, including by the customer.               |
| `woocommerce_checkout_order_processed`  | Records usage against the coupon.                                        |
| `woocommerce_order_status_completed`    | Issues the reward credit, where `reward_percent` is set.                 |

**Shortcodes** `[aiowc_my_coupons]` lists the customer's available coupons, and `[aiowc_store_credit]` prints their credit balance.

## Database schema

| Table                                        | Holds                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_smart_coupons`                | The behaviour attached to a WooCommerce coupon: type, auto-apply and URL flags, BOGO configuration, restrictions, its own expiry. |
| `{prefix}aiowc_coupon_usage_log`             | One row per use: the coupon, customer, order and amount discounted.                       |
| `{prefix}aiowc_store_credits`                | A customer's credit: balance, source, originating order, expiry.                          |
| `{prefix}aiowc_store_credit_transactions`    | Movements against a credit: amount, type, description, order.                             |

## Background jobs

| Hook                             | Interval | Work                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------- |
| `aiowc_coupons_expire_check`     | daily    | Expires smart coupons past their date.                       |
| `aiowc_coupons_send_reminders`   | daily    | Warns customers about a coupon expiring in `reminder_days_before` days. |
| `aiowc_store_credits_expire`     | daily    | Expires store credit past `credit_expiry_days`.              |

All three run on WP-Cron, first scheduled an hour after the module is enabled.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module fires no coupon or credit lifecycle events, so an integration cannot react to a coupon applying itself or to credit being issued or spent.

## Entitlement limits

`smart-coupons-advanced` is an on/off grant with no cap on the number of smart coupons, credits or transactions.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- 🔴 **Store credit is implemented three times across the plugin and the implementations do not talk to each other.** Here (`aiowc_store_credits`), in the [Store Credit](/modules/reference/store-credit) module (`aiowc_store_credit` — differing by one letter), and in [Gift Cards & Store Credit](/modules/reference/gift-cards) as a card of type `store_credit`. A customer can hold a balance in more than one, checkout will not combine them, and no screen shows the total. A store should decide which one it uses and leave the other modules off.
- `reward_percent` defaults to `0.0`, so the order-reward feature appears to do nothing until a store notices the setting.
- No lifecycle hooks are fired, so an integration cannot observe a coupon auto-applying or credit being issued.
- Analytics are per coupon; there is no store-wide view of what the auto-apply feature has cost.
- The module extends WooCommerce coupons, so a smart coupon row whose underlying WooCommerce coupon is deleted is left without its coupon. Nothing cleans those rows up.
