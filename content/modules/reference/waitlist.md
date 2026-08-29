---
id: waitlist
title: "Product Waitlist"
description: "Let shoppers register interest in an out-of-stock product or variation, and email them when it returns, automatically or on demand."
keywords:
  - woocommerce waitlist
  - out of stock
  - back in stock email
  - product interest
format: md
---
## Overview

The Waitlist module lets a shopper register interest in an out-of-stock product and be emailed when it returns. A join form is drawn on the product page, entries are held per product or variation, and the emails go out either automatically when stock returns or on demand from the admin screen.

It is for stores that want a queue on their out-of-stock lines and want to control when the "it's back" email is sent — the delay setting exists so a restock can be checked before hundreds of customers are told.

It overlaps with [Back-in-Stock Notifications](/modules/reference/stock-alerts), which does the same job with double opt-in, demand analytics and a notification log. This module is the simpler of the two: consent is a single required checkbox, and there is no opt-in confirmation step.

## Availability

| Item            | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Module key      | `waitlist`                                            |
| Tier            | Premium                                               |
| Entitlement key | `waitlist`                                            |
| Admin tab       | `waitlist`, under **Product Experience**              |
| Enabled option  | `aiowc_module_enabled_waitlist` (off until turned on) |
| REST namespace  | `aiowc/v1`                                            |

Enabling the module creates the two tables below, seeds the defaults and schedules both jobs. Disabling it unschedules them.

## Settings

Stored in the option row `aiowc_wl_settings`, written with autoload off. They are seeded only when that row is empty.

| Stored key              | Default | Meaning                                                                                                            |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `enable_waitlist`       | `true`  | Accept new entries. Off makes every join attempt fail with `waitlist_disabled`.                                    |
| `require_login`         | `false` | Refuse a guest join with `login_required`.                                                                         |
| `auto_notify`           | `true`  | Send automatically when stock returns. Off means only the admin control sends.                                     |
| `notification_delay`    | `0`     | Minutes to wait after a restock before sending. Above zero, a single event is scheduled instead of sending inline. |
| `max_waitlist_size`     | `0`     | Cap per product; `0` means no cap. A full list refuses with `waitlist_full`.                                       |
| `priority_window_hours` | `24`    | Seeded but read nowhere — see [Known gaps](#known-gaps).                                                           |

> The settings prefix `aiowc_wl_` is shared with the [Wishlist](/modules/reference/wishlist) module, so both write to the same `aiowc_wl_settings` row. See [Known gaps](#known-gaps).

## Joining

`WaitlistService::joinWaitlist()` refuses in this order, each with its own error code: an invalid email address, missing consent, the module being disabled, a guest when `require_login` is on, an unknown product, a product that is **already in stock**, an address already on that product's list, and a list that has reached `max_waitlist_size`. Only then is the entry written, with status `active` and consent recorded.

## Admin screen

The **Product Waitlist** tab sends the back-in-stock emails. You enter a product id and an optional variation id, then either **Show who is waiting** — which reads `GET /waitlist/entries` for that product — or **Notify everyone waiting**, which goes out after a confirmation. The screen states plainly that real email reaches real customers with no undo, and reports how many were sent and how many failed.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                   | Purpose                                                                                         | Permission                                       | Required args                    |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------- |
| POST   | `/waitlist/join`       | Join the waitlist for a product or variation.                                                   | Open to guests, REST nonce, 30 requests a minute | `product_id`, `email`, `consent` |
| DELETE | `/waitlist/{id}/leave` | Leave an entry. Ownership is checked against the signed-in user.                                | Signed-in user                                   | `id`                             |
| GET    | `/waitlist/my-items`   | The signed-in user's own entries.                                                               | Signed-in user                                   | –                                |
| GET    | `/waitlist/entries`    | A page of entries, optionally narrowed by `product_id`. `per_page` is capped at 50, default 20. | `manage_woocommerce`                             | –                                |
| POST   | `/waitlist/notify-all` | Email everyone waiting for a product. Sends immediately; returns `sent` and `failed`.           | `manage_woocommerce`                             | `product_id`                     |

`notify-all` does nothing and reports zero when the product is not in stock at the time it runs.

## WooCommerce integration

| Hook                                     | Priority | What the module does                                                            |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `woocommerce_single_product_summary`     | 32       | Draws the join form.                                                            |
| `woocommerce_product_set_stock_status`   | 10       | On `instock`, triggers notifications for that product.                          |
| `woocommerce_variation_set_stock_status` | 10       | On `instock`, triggers notifications for that variation's parent and variation. |

Both stock hooks respect `auto_notify`. When `notification_delay` is above zero they schedule a single `aiowc_waitlist_check_stock` event instead of sending inline.

**Shortcode** `[aiowc_waitlist_form]` renders the join form outside the product page.

Email is sent with `wp_mail()`.

## Database schema

| Table                                  | Holds                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_waitlists`              | One row per waiting shopper: product, variation, user id, email, status, consent, notified date. |
| `{prefix}aiowc_waitlist_notifications` | One row per notification sent, with an `opened_at` column.                                       |

## Background jobs

| Hook                         | Interval | Work                                                                                                                       |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_waitlist_check_stock` | hourly   | Walks the products with active entries and notifies the ones back in stock. Returns immediately when `auto_notify` is off. |
| `aiowc_waitlist_cleanup`     | daily    | Removes stale entries.                                                                                                     |

## Entitlement limits

`waitlist` is an on/off grant with no numeric cap. The one numeric limit is `max_waitlist_size`, a store setting, and the 50-row page cap on the entries route.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- **The settings prefix collides with Wishlist.** Both modules declare `SETTINGS_PREFIX = 'aiowc_wl_'` and both persist to `aiowc_wl_settings`. Waitlist only seeds its defaults when that row is empty, so if Wishlist is enabled first the row already exists and Waitlist's keys are never written — its service then falls back to its own hardcoded defaults and the admin cannot change them.
- **No settings route and no settings screen.** The six settings have no endpoint and no form, so they can only be changed in the database.
- `priority_window_hours` is seeded and never read.
- The notifications table has an `opened_at` column, but nothing writes it — there is no open tracking.
- The delayed path schedules the hourly job's hook as a one-off, so it notifies every product that is back in stock, not only the one that triggered it.
