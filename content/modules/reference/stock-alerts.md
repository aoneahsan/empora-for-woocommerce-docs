---
id: stock-alerts
title: "Back-in-Stock Notifications"
description: "Put a notify-me form on out-of-stock products, keep the waiting list, email it when stock returns, and see which products people wait for."
keywords:
  - woocommerce back in stock
  - notify me
  - stock alerts
  - restock email
format: md
---
## Overview

The Stock Alerts module puts a "notify me" form on out-of-stock products, keeps the list of people waiting, and emails them when the product comes back. It works for simple products and for individual variations of a variable product.

It is for stores that lose sales to out-of-stock pages and want to know which products people are actually waiting for — the module also aggregates that demand, so the waiting list doubles as a restocking signal.

Subscriptions can require a confirmation click before they count (double opt-in, on by default), and every notification email carries an unsubscribe link that works without a login.

## Availability

| Item            | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Module key      | `stock_alerts`                                            |
| Tier            | Premium                                                   |
| Entitlement key | `stock_alerts`                                            |
| Admin tab       | `stock-alerts`, under **Product Experience**              |
| Enabled option  | `aiowc_module_enabled_stock_alerts` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                |

Enabling the module creates the two tables below, seeds the defaults and schedules both jobs through Action Scheduler in the `aiowc` group. Disabling it cancels them.

## Settings

Stored in the bundled option row `aiowc_bis_settings`, written with autoload off.

| Stored key                    | Default   | Meaning                                                                    |
| ----------------------------- | --------- | -------------------------------------------------------------------------- |
| `enable_guest_subscriptions`  | `true`    | Accept subscriptions from shoppers who are not signed in.                  |
| `require_double_optin`        | `true`    | A subscription only counts once the emailed confirmation link is followed. |
| `notification_email_template` | `default` | Which template the notification email uses.                                |
| `batch_size`                  | `50`      | Maximum notifications sent in one pass for one product.                    |
| `auto_unsubscribe_after_days` | `90`      | Age at which the cleanup job removes stale subscriptions.                  |
| `show_waitlist_count`         | `false`   | Show how many people are already waiting on the product page.              |

## Admin screen

The **Stock Alerts** tab is one screen: a paginated table of restock subscriptions with a search box on email address and a status filter over _Waiting for restock_, _Notified_, _Unsubscribed_ and _All_. Each row shows when the subscription was made, the product (with the variation id where there is one), the customer's email, the status and the notified date.

It calls `GET /stock-alerts/subscriptions` with `page`, `per_page`, `status` and `search`. The demand analytics and notification history routes below have no screen.

## Subscription states

| Status         | Meaning                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `active`       | Waiting for the product to come back.                                  |
| `notified`     | The back-in-stock email has been sent.                                 |
| `unsubscribed` | Removed by the customer, or by the cleanup job after the stale window. |

With double opt-in on, a new row is written with an `optin_token` and is not notified until `optin_confirmed_at` is set. `NotificationService` reads only confirmed subscriptions when double opt-in is required.

## Unsubscribe and confirmation links

An unsubscribe link is followed from an email client, so it cannot carry a WordPress nonce — nonces are tied to a session and expire within a day. The module derives a token instead, with `wp_hash()` under the `nonce` scheme, over the email address, product id and variation id. The token is the credential: without it the handler would accept an address and a product id straight from the query string, which would let anyone unsubscribe anyone else.

Both sides normalise the address with `sanitize_email()` and cast the ids to integers before hashing, because the handler receives the address URL-decoded and the builder receives it as stored.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. Administrator routes require `manage_woocommerce` plus a REST nonce on cookie-authenticated requests.

| Method             | Path                                | Purpose                                                                   | Permission                                       | Required args         |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ | --------------------- |
| GET                | `/stock-alerts/subscriptions`       | Paginated subscriptions; filters `status`, `product_id`, `search`.        | `manage_woocommerce`                             | –                     |
| GET                | `/stock-alerts/subscriptions/{id}`  | Read one subscription.                                                    | `manage_woocommerce`                             | –                     |
| DELETE             | `/stock-alerts/subscriptions/{id}`  | Delete one subscription.                                                  | `manage_woocommerce`                             | –                     |
| GET                | `/stock-alerts/demand`              | Demand across products: top products, totals and notification statistics. | `manage_woocommerce`                             | –                     |
| GET                | `/stock-alerts/demand/{product_id}` | Demand for one product: waiting count, stock status, conversion, trend.   | `manage_woocommerce`                             | –                     |
| GET                | `/stock-alerts/notifications`       | Notification history; filters `status`, `product_id`, `search`.           | `manage_woocommerce`                             | –                     |
| GET                | `/stock-alerts/settings`            | Read the settings above.                                                  | `manage_woocommerce`                             | –                     |
| PUT / PATCH / POST | `/stock-alerts/settings`            | Update the settings above.                                                | `manage_woocommerce`                             | –                     |
| POST               | `/stock-alerts/subscribe`           | Subscribe an address to a product or variation. Answers `201`.            | Open to guests, REST nonce, 30 requests a minute | `product_id`, `email` |
| POST               | `/stock-alerts/unsubscribe`         | Unsubscribe an address from a product.                                    | Open read, 120 requests a minute                 | `email`, `product_id` |
| POST               | `/stock-alerts/confirm`             | Confirm a double opt-in subscription from its token.                      | Open read, 120 requests a minute                 | `token`               |

## WooCommerce integration

| Hook                                                                 | Priority | What the module does                                                         |
| -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `woocommerce_single_product_summary`                                 | 31       | Draws the notify form, but only when the product is simple and out of stock. |
| `woocommerce_after_variations_form`                                  | 10       | Draws the variation notify form on variable products.                        |
| `wp_enqueue_scripts`                                                 | 10       | Enqueues the front-end assets.                                               |
| `wp_loaded`                                                          | 10       | Handles a non-JavaScript form submission.                                    |
| `wp_ajax_aiowc_bis_subscribe` / `wp_ajax_nopriv_aiowc_bis_subscribe` | 10       | Handles the AJAX subscribe for signed-in and guest shoppers.                 |
| `init`                                                               | 10       | Handles the emailed unsubscribe and confirmation links.                      |

Notification email is sent with `wp_mail()`, so it goes out through whatever mail transport the store already uses.

## Database schema

| Table                                  | Holds                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_stock_subscriptions`    | One row per waiting shopper: product, variation, email, user id, status, opt-in token and confirmation, notified date. |
| `{prefix}aiowc_stock_notification_log` | Every notification attempt with its status and error message.                                                          |

## Background jobs

| Hook                    | Interval   | Group   | Work                                                                                |
| ----------------------- | ---------- | ------- | ----------------------------------------------------------------------------------- |
| `aiowc_bis_stock_check` | 30 minutes | `aiowc` | Finds products with waiting subscribers that are back in stock and sends the batch. |
| `aiowc_bis_cleanup`     | daily      | `aiowc` | Removes subscriptions older than `auto_unsubscribe_after_days`.                     |

## Entitlement limits

`stock_alerts` is an on/off grant with no numeric cap. The only numeric limit is `batch_size`, which is a store setting rather than a licence one, and it bounds how many emails one pass sends for one product.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- The admin screen lists subscriptions only. The demand analytics and the notification history are reachable over REST but have no screen.
- `notification_email_template` accepts a value, but the notification email is composed in `NotificationService` rather than selected from a set of templates.
- `StockCheckJob` also carries its own `schedule()` helper that would register an hourly `wp_schedule_event`. The module does not call it — scheduling goes through the job queue at 30 minutes — so the helper is unused.
