---
id: subscriptions
title: "Subscriptions"
description: "Recurring billing with trials, signup fees, scheduled renewals, a recorded retry schedule, a guarded status machine and customer self-management."
keywords:
  - woocommerce subscriptions
  - recurring payments
  - subscription renewals
  - payment retries
format: md
---
## Overview

Subscriptions adds a subscription product type and the machinery that keeps a recurring payment running: a billing period and interval, an optional free trial, an optional signup fee, and a next-payment date the renewal job works from.

A renewal creates a new WooCommerce order and takes payment against the stored gateway token. When that fails, the subscription does not simply stop — a **retry schedule** makes further attempts, each one recorded with its result and the gateway's response, so a failure has a history rather than a single outcome.

Every status change is written to its own log with the reason and who made it, and status transitions go through a guard rather than being set freely.

Customers manage their own subscriptions from their account: cancel, pause, resume, and update the billing or shipping address on a live subscription.

It is for stores selling anything on a recurring basis.

## Availability

| Item            | Value                                                           |
| --------------- | ----------------------------------------------------------------- |
| Module key      | `subscriptions`                                                  |
| Tier            | Premium                                                          |
| Entitlement key | `subscriptions`                                                  |
| Admin tab       | `subscriptions`                                                  |
| Enabled option  | `aiowc_module_enabled_subscriptions` (off until turned on)       |
| REST namespace  | `aiowc/v1`                                                       |
| Product type    | Subscription                                                     |

Enabling the module creates the four tables below and schedules its jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally. It registers the product type, the frontend, the jobs and the email-automation triggers.

## Settings

This module declares no `DEFAULTS` constant. Its settings are read and written through `GET`/`PUT /subscriptions/settings`.

## The subscription

| Field                                            | Meaning                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `status`                                         | Where it is in its life. `pending` at creation.                         |
| `parent_order_id`, `last_order_id`               | The order that created it, and the most recent renewal.                 |
| `start_date`, `trial_end_date`, `next_payment_date`, `end_date` | The schedule.                                            |
| `billing_period`, `billing_interval`             | `month` every `1` by default — so "every 3 months" is period plus interval. |
| `recurring_total`, `recurring_tax`, `recurring_shipping` | What recurs, held apart from the signup fee.                     |
| `signup_fee`                                     | Charged once, at the start.                                             |
| `payment_method`, `payment_token`                | The gateway and **its token** — not card details.                       |
| `billing_address`, `shipping_address`            | Held on the subscription, so a change applies to future renewals without touching past orders. |
| `requires_manual_renewal`                        | Set where the gateway cannot charge automatically.                      |
| `retry_count`                                    | How many recovery attempts have been made.                              |

Storing `payment_token` rather than card data is the right shape: the token is what the gateway issued, and the plugin never holds the instrument itself.

## Renewals and retries

The renewal job creates a renewal order and charges it. On failure the retry table takes over: each attempt records its number, when it was scheduled and attempted, the result and the gateway's response.

`requires_manual_renewal` is the honest escape hatch — a gateway with no token-based charging cannot be billed automatically, and the subscription says so rather than failing silently every period.

A renewal can also be forced from the admin with `POST /subscriptions/{id}/force-renewal`, which is what an administrator uses to recover a subscription by hand.

## Status handling

Transitions are guarded by the `aiowc_subscription_can_transition` filter, so a store can refuse a transition its own rules do not allow. Every change writes a row to the status log with the old and new status, a reason and who made it.

Payment gateways can be filtered per subscription through `aiowc_subscription_filter_payment_gateways`, and the module also filters `woocommerce_available_payment_gateways` — so a gateway that cannot support recurring payments is not offered for a subscription purchase.

## Reporting

`GET /subscriptions/overview` computes **monthly recurring revenue** and a **churn rate** from the subscription book — cancellations measured against cancellations plus active subscriptions — alongside counts by status. That is real reporting derived from the data rather than a count of rows.

## Admin screen

The **Subscriptions** tab lists subscriptions and shows the overview with MRR and churn; cancels, pauses, resumes, reschedules and force-renews one; reads its orders, its status history and its retry history; and edits the settings. A **diagnostics** route reports the module's own configuration state.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

### Administrator routes — `manage_woocommerce`

| Method | Path                                    | Purpose                                   | Required args              |
| ------ | --------------------------------------- | ------------------------------------------- | -------------------------- |
| GET    | `/subscriptions`                        | Every subscription.                        | –                          |
| GET    | `/subscriptions/{id}`                   | One subscription.                          | `id`                       |
| POST   | `/subscriptions/{id}/cancel`            | Cancel it.                                 | `id`                       |
| POST   | `/subscriptions/{id}/pause`             | Pause it.                                  | `id`                       |
| POST   | `/subscriptions/{id}/resume`            | Resume it.                                 | `id`                       |
| POST   | `/subscriptions/{id}/reschedule`        | Move the next payment.                     | `id`, `next_payment_date`  |
| POST   | `/subscriptions/{id}/force-renewal`     | Renew it now.                              | `id`                       |
| GET    | `/subscriptions/{id}/orders`            | Its orders.                                | `id`                       |
| GET    | `/subscriptions/{id}/status-history`    | Its status log.                            | `id`                       |
| GET    | `/subscriptions/{id}/retry-history`     | Its payment attempts.                      | `id`                       |
| GET    | `/subscriptions/overview`               | MRR, churn and status counts.              | –                          |
| GET    | `/subscriptions/diagnostics`            | The module's own health detail.            | –                          |
| GET / PATCH / PUT / POST | `/subscriptions/settings` | Read and write the settings.             | –                          |

### Customer routes — customer permission check

| Method | Path                                              | Purpose                                    |
| ------ | ------------------------------------------------- | -------------------------------------------- |
| GET    | `/subscriptions/me`                               | The caller's subscriptions.                 |
| GET    | `/subscriptions/me/{id}`                          | One of their subscriptions.                 |
| POST   | `/subscriptions/me/{id}/cancel`                   | Cancel their own.                           |
| POST   | `/subscriptions/me/{id}/pause`                    | Pause their own.                            |
| POST   | `/subscriptions/me/{id}/resume`                   | Resume their own.                           |
| PATCH / PUT / POST | `/subscriptions/me/{id}/billing-address`  | Update the billing address.         |
| PATCH / PUT / POST | `/subscriptions/me/{id}/shipping-address` | Update the shipping address.        |

The customer routes are a separate `/me/` branch behind a customer permission check, rather than the administrator routes with a looser permission. That separation is what prevents one customer reading another's subscription by guessing an id.

## WooCommerce integration

| Area          | Hooks                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Product type  | `product_type_selector`, `woocommerce_product_class`, `woocommerce_product_data_tabs` / `_panels`, `woocommerce_product_options_general_product_data`, `woocommerce_process_product_meta_subscription` |
| Product page  | `woocommerce_subscription_add_to_cart`                                                             |
| Cart          | `woocommerce_add_cart_item_data`, `_get_cart_item_from_session`, `_add_to_cart_validation`, `_get_item_data`, `_cart_item_price`, `_cart_item_subtotal`, `_cart_calculate_fees`, `_cart_totals_after_order_total` |
| Checkout      | `woocommerce_checkout_process`, `_checkout_create_order_line_item`, `_checkout_order_created`, `woocommerce_checkout_registration_required`, `woocommerce_review_order_before_submit`, `_review_order_after_order_total` |
| Gateways      | `woocommerce_available_payment_gateways`, `woocommerce_before_pay_action`                           |
| Payment       | `woocommerce_payment_complete`, `woocommerce_order_status_pending_to_processing`                     |
| Order status  | `woocommerce_order_status_processing`, `_completed`, `_cancelled`, `_failed`                        |
| Account       | `woocommerce_account_menu_items` and the module's own account endpoint                               |

`woocommerce_checkout_registration_required` is notable: a subscription needs an account to manage it later, so the module forces registration for a cart containing one.

The module registers **no shortcode**.

## Database schema

| Table                                       | Holds                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_subscriptions`               | The subscription, as described above.                                                    |
| `{prefix}aiowc_subscription_items`          | What is subscribed to: product, variation, name, quantity and recurring amounts.         |
| `{prefix}aiowc_subscription_status_log`     | Every status change: old and new status, reason, who made it.                            |
| `{prefix}aiowc_subscription_retry_log`      | Every recovery attempt: attempt number, when scheduled and attempted, result and gateway response. |

Items carry their own `name` and recurring amounts, so a subscription still describes what was bought at the price agreed, even after the product is renamed or repriced.

## Background jobs

| Hook                                     | Work                                                              |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `aiowc_subscription_renewal`             | Creates and charges renewal orders that are due.                   |
| `aiowc_subscription_retry`               | Re-attempts a failed renewal on the retry schedule.                |
| `aiowc_subscription_renewal_reminder`    | Warns a customer that a renewal is coming.                         |
| `aiowc_subscription_cleanup`             | Prunes old rows.                                                   |

## Action hooks for integrators

Lifecycle: `aiowc_subscription_created`, `_activated`, `_cancelled`, `_pending_cancel`, `_paused`, `_resumed`, `_reactivated`, `_on_hold`, `_expired`, `_rescheduled`, `_status_changed`.

Payments: `aiowc_subscription_payment_failed`, `_renewal_order_created`, `_renewal_payment_complete`, `_payment_method_updated`, `_manual_renewal_required`, and `aiowc_process_subscription_payment`.

Filters: `aiowc_subscription_can_transition`, `_filter_payment_gateways`, `_allow_cart_mixing`, `_price_html`, `_add_to_cart_text`, `_single_add_to_cart_text`, `_add_to_cart_url`, `_customer_action`.

`aiowc_subscription_allow_cart_mixing` decides whether a subscription and a one-off product may share a cart, which is a store policy rather than a technical constraint — so it is a filter.

## Entitlement limits

`subscriptions` is an on/off grant with no cap on the number of subscriptions, items or renewals.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. The diagnostics route gives more detail.

## Known gaps

- **There is no variable subscription product type.** A subscription is a single product type; a plan with several billing options is modelled as separate products rather than as variations of one.
- **A customer cannot change their payment method through the module's own routes.** They can cancel, pause, resume and update addresses; updating the stored payment token depends on the gateway's own flows, and `aiowc_subscription_payment_method_updated` exists for something else to fire.
- Automatic renewal depends on the gateway supporting token-based charging. Where it does not, `requires_manual_renewal` is set and the customer must pay each renewal by hand — an honest fallback, but one that should be understood before choosing a gateway.
- The module has no settings constant, so the defaults are not stated in one place in the code.
- MRR and churn are computed over the whole subscription book rather than for a chosen period, so they answer "where does the book stand" rather than "how did last month compare".
