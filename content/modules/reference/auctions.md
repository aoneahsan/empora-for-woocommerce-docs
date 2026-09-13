---
id: auctions
title: "Auctions"
description: "Standard, proxy and sealed auctions with reserve and buy-now prices, tiered bid increments, anti-sniping extensions, winner payment windows and relisting."
keywords:
  - woocommerce auctions
  - proxy bidding
  - sealed bid auction
  - anti sniping
format: md
---
## Overview

Auctions adds an auction product type with three bidding models. A **standard** auction takes the highest bid. A **proxy** auction takes a customer's maximum and bids on their behalf up to it, so they win at the smallest increment over the next bidder rather than at their ceiling. A **sealed** auction hides every bid until the auction closes.

Around that sit the mechanics a real auction needs: a reserve price that must be met, an optional buy-now price, bid increments that can be fixed or tiered by value, and **anti-sniping** — a bid placed in the final minutes extends the auction, up to a cap, so an auction cannot be won by being last rather than highest.

When an auction ends, a winner is resolved, given a payment window and reminded; if they do not pay, the runner-up can be offered a second chance and the auction can be relisted.

It is for stores selling by competitive bidding.

## Availability

| Item            | Value                                                      |
| --------------- | ------------------------------------------------------------ |
| Module key      | `auctions`                                                  |
| Tier            | Premium                                                     |
| Entitlement key | `auctions`                                                  |
| Admin tab       | `auctions`                                                  |
| Enabled option  | `aiowc_module_enabled_auctions` (off until turned on)       |
| REST namespace  | `aiowc/v1`                                                  |
| Product type    | Auction                                                     |

Enabling the module creates the four tables below and schedules five jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally. It registers the product type, the frontend, the jobs and the WooCommerce email classes.

## Settings

This module declares no `DEFAULTS` constant. Settings are read and written through `GET`/`PUT /auctions/settings`, and most of what governs an auction lives on the auction row itself.

## The auction

| Field                                              | Meaning                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `auction_type`                                     | `standard`, `proxy` or `sealed`.                                             |
| `status`                                           | `draft`, `scheduled`, `active`, `ended`, `closed` or `cancelled`.            |
| `start_datetime`, `end_datetime`, `original_end_datetime` | When it runs, and when it was **originally** due to end before extensions. |
| `timezone`                                         | Stored per auction rather than assumed.                                      |
| `starting_price`                                   | Where bidding opens.                                                         |
| `reserve_price`, `reserve_met`                     | A floor below which the item is not sold, and whether it has been reached.   |
| `buy_now_price`, `buy_now_enabled`                 | An immediate purchase price.                                                 |
| `current_bid`, `bid_count`                         | The running state.                                                           |
| `increment_type`, `increment_value`, `increment_tiers` | `fixed` or `tiered`; tiers let the step grow with the price.              |
| `anti_sniping_enabled`, `_minutes`, `_extension`, `extension_count`, `max_extensions` | The sniping guard and how often it has fired. |
| `winner_user_id`, `winner_bid_id`, `winning_price` | The outcome.                                                                 |
| `payment_due_hours`                                | How long the winner has to pay. Defaults to 48.                              |
| `pay_now_token`, `pay_now_expires`                 | A one-off link letting the winner pay, with its own expiry.                  |
| `allow_auto_relist`                                | Whether an unsold auction relists itself.                                    |
| `featured`                                         | Whether it is promoted in listings.                                          |

Keeping `original_end_datetime` alongside `end_datetime` is what makes an extended auction auditable — you can see it was extended, and by how much.

## Bids

| Field                              | Meaning                                                             |
| ---------------------------------- | --------------------------------------------------------------------- |
| `bid_amount`, `max_bid`            | The bid placed, and the ceiling for a proxy bid.                     |
| `is_proxy`, `is_sealed`, `is_winning` | What kind of bid it is and whether it currently leads.            |
| `user_id`, `user_email`, `user_name` | Who placed it.                                                     |
| `ip_address`, `user_agent`         | **Recorded for every bid.** See the limits below.                    |
| `triggered_extension`              | Whether this bid caused an anti-sniping extension.                   |

Bidding is rate-limited, through the `aiowc_auction_max_bids_per_minute` filter.

## Ending an auction

A closing job runs **every minute**, which is what makes an auction end at its stated time rather than at the next hourly tick. It resolves the winner, sets the winning price, and issues the pay-now token.

Where no bid met the reserve, the auction ends with no winner and — if `allow_auto_relist` is set — relists itself. Where the winner does not pay within `payment_due_hours`, reminders go out on configurable thresholds and the store can offer the item to the next bidder.

## Admin screen

The **Auctions** tab lists and manages auctions — start, end, cancel, relist, in bulk or one at a time — shows statistics and a winners list, offers a second chance or sends a payment reminder, browses bids by auction or by user, exports auctions, and reads an auction's log.

It also carries **diagnostics with a repair action**: `GET /auctions/diagnostics` reports inconsistencies and `POST /auctions/diagnostics/repair` fixes named ones. That is unusual in this plugin and useful for a module whose state is driven by timed jobs.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. All the administrator routes require `manage_woocommerce`.

| Method            | Path                                        | Purpose                                              | Required args                              |
| ----------------- | ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| GET / POST        | `/auctions`                                 | List and create auctions.                             | `product_id`, `end_datetime`, `starting_price` on create |
| GET / PATCH / PUT / POST / DELETE | `/auctions/{id}`            | Manage one auction.                                   | `id`                                       |
| POST              | `/auctions/{id}/start` / `/end`             | Start or end it now.                                  | `id`                                       |
| POST              | `/auctions/{id}/cancel`                     | Cancel it, with a reason.                             | `id`, `reason`                             |
| POST              | `/auctions/{id}/relist`                     | Relist it with a new end time.                        | `id`, `end_datetime`                       |
| GET               | `/auctions/{id}/logs`                       | Its history.                                          | `id`                                       |
| POST              | `/auctions/bulk/end` / `/bulk/cancel`       | Act on several at once.                               | `ids`                                      |
| GET               | `/auctions/{auction_id}/bids`               | Bids on one auction.                                  | `auction_id`                               |
| DELETE            | `/auctions/{auction_id}/bids/{bid_id}`      | Retract a bid — **a reason is required.**             | `auction_id`, `bid_id`, `reason`           |
| GET               | `/auctions/winners`                         | Auctions with a winner.                               | –                                          |
| POST              | `/auctions/winners/{id}/remind`             | Remind a winner to pay.                               | `id`                                       |
| POST              | `/auctions/winners/{id}/offer-second`       | Offer the item to the next bidder.                    | `id`                                       |
| GET               | `/auctions/statistics` / `/export`          | Reporting and export.                                 | –                                          |
| GET               | `/auctions/diagnostics`                     | Detected inconsistencies.                             | –                                          |
| POST              | `/auctions/diagnostics/repair`              | Repair named inconsistencies.                         | `repairs`                                  |
| GET / PATCH / PUT / POST | `/auctions/settings`                 | Read and write the settings.                          | –                                          |
| GET               | `/bids`, `/bids/{id}`, `/bids/recent`, `/bids/statistics`, `/bids/user/{user_id}` | Browse bids across auctions. | –                       |
| GET               | `/public/auctions`                          | The public auction listing.                           | Public, rate-limited                       |

Requiring a `reason` to retract a bid or cancel an auction is a deliberate choice: both are interventions in a competitive process, and the reason is recorded.

## WooCommerce integration

| Area          | Hooks                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Product type  | `product_type_selector`, `woocommerce_product_class`, `woocommerce_product_data_tabs` / `_panels`, `woocommerce_process_product_meta_auction` |
| Product page  | `woocommerce_single_product_summary`, `woocommerce_product_tabs`, `woocommerce_get_price_html`      |
| Cart          | `woocommerce_add_to_cart_validation`, `woocommerce_cart_item_class`, `_cart_item_name`, `_cart_item_quantity`, `woocommerce_before_calculate_totals` |
| Checkout      | `woocommerce_checkout_process`, `_checkout_create_order_line_item`, `_checkout_order_processed`     |
| Order status  | `woocommerce_order_status_processing`, `_completed`, `_cancelled`, `_refunded`                      |
| Order display | `woocommerce_order_item_meta_start`, `woocommerce_admin_order_item_headers` / `_values`             |
| Account       | `woocommerce_account_menu_items`                                                                   |
| Emails        | `woocommerce_email_classes` — seven auction emails ship as real WooCommerce email classes           |
| Admin list    | `manage_product_posts_custom_column`                                                               |
| Other         | `query_vars`, `template_redirect`, `body_class`                                                    |

**Shortcodes** `[aiowc_active_auctions]`, `[aiowc_auction_search]`, `[aiowc_my_auction_bids]` and `[aiowc_my_watchlist]`.

The cart hooks matter because an auction win is not an ordinary add-to-cart: the quantity is fixed at one and the price is the winning price, so the customer cannot change either.

## Database schema

| Table                                | Holds                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_auctions`             | The auction, as described above.                                                          |
| `{prefix}aiowc_auction_bids`         | Every bid: amount, proxy ceiling, flags, bidder identity, IP address and user agent, whether it triggered an extension. |
| `{prefix}aiowc_auction_watchlist`    | Which customers are watching which auctions.                                              |
| `{prefix}aiowc_auction_logs`         | The auction's history, pruned on a retention filter.                                      |

## Background jobs

| Hook                              | Interval         | Work                                                          |
| --------------------------------- | ---------------- | --------------------------------------------------------------- |
| `aiowc_auction_closing`           | every minute     | Ends auctions at their stated time and resolves the winner.    |
| `aiowc_auction_start`             | every 15 minutes | Starts scheduled auctions.                                     |
| `aiowc_auction_ending_soon`       | every 15 minutes | Notifies watchers and bidders that an auction is closing.      |
| `aiowc_auction_payment_reminder`  | hourly           | Chases winners who have not paid.                              |
| `aiowc_auction_cleanup`           | daily            | Prunes logs past the retention window.                         |

The every-minute closing job is the one to check first when auctions do not end on time: it depends on WP-Cron actually firing, which on a low-traffic site means a real system cron rather than page-visit-triggered cron.

## Action hooks for integrators

Lifecycle: `aiowc_auction_created`, `_updated`, `_deleted`, `_status_changed`, `_extended`, `_bid_placed`, `_user_outbid`, `_buy_now`, `_auto_relist`, `aiowc_sealed_bids_revealed`.

Notifications: `aiowc_auction_started_notification`, `_ended_notification`, `_ended_seller_notification`, `_no_winner_notification`, `_winner_notification`, `_second_chance_notification`, `_cancelled_notify`, `_payment_reminder`, `_payment_overdue`, `_payment_confirmation`, and the two sealed-auction notifications.

Filters: `aiowc_auction_max_bids_per_minute`, `aiowc_auction_log_retention_days`, `aiowc_ending_soon_notification_windows`, `aiowc_payment_reminder_thresholds`.

## Entitlement limits

`auctions` is an on/off grant with no cap on auctions, bids or watchlist entries. The bid rate limit is a filter.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. The diagnostics route gives considerably more detail, including inconsistencies it can repair.

## Known gaps

- **Every bid stores the bidder's IP address and user agent.** That is defensible for an auction — it is the record that makes shill bidding and disputes investigable — and it must appear in the store's privacy notice. Since 2026-09-13 it is bounded: the cleanup job nulls `ip_address` and `user_agent` on bids older than `aiowc_auction_bid_retention_days`, which defaults to whatever `aiowc_auction_log_retention_days` resolves to, so a store has one retention knob unless it deliberately wants two.
- 🔴 **The bid row itself is kept, and only the two identifying columns are cleared.** The row is the auction's record of a completed sale; deleting it would rewrite a settled result.
- 🔴 **The closing job runs every minute, and WP-Cron only fires on a page request.** On a quiet store the sweep runs when the next visitor arrives, so an auction can accept bids past its end time. A store selling by auction needs a real system cron plus `DISABLE_WP_CRON`; this is a deployment requirement, not a setting.
- **The closing job runs every minute and the module's correctness depends on it.** On a site where WP-Cron only fires on page visits, a quiet period means auctions close late. A real system cron is effectively required.
- The module has no settings constant, so the defaults for a new auction are not stated in one place in the code.
- A sealed auction's bids are hidden from customers, but they are readable by any administrator through the bids routes while the auction is still running.
- Second-chance offers and relisting are manual actions, except where `allow_auto_relist` is set on the auction.
