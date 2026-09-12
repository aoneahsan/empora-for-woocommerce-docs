---
id: rewards-points
title: "Rewards & Points"
description: "A loyalty points ledger with earning rules for purchases, signups, reviews and referrals, tier multipliers, expiry and checkout redemption."
keywords:
  - woocommerce loyalty points
  - rewards program
  - points redemption
  - loyalty tiers
format: md
---
## Overview

Rewards & Points gives customers points for what they do — buying, signing up, leaving a review, referring someone — and lets them spend those points as a discount at checkout.

Points are a ledger. Every movement writes a row recording the type, the number of points, the balance before and after, where it came from and when it expires. A per-customer balance row is kept alongside as a running total, so a cart does not have to sum the whole ledger to know what a customer has.

**Tiers** sit on top: a tier is a points threshold with a multiplier, so a customer who has earned more earns faster. Moving between tiers fires its own events.

It is for stores running a loyalty programme.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `rewards_points`                                                |
| Tier            | Premium                                                         |
| Entitlement key | `rewards_points`                                                |
| Admin tab       | `rewards-points`                                                |
| Enabled option  | `aiowc_module_enabled_rewards_points` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the four tables below and schedules the three jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it. It also registers the module's **email automation triggers**, so points events can drive the Email Automation module's sequences.

## Settings

This module declares no `DEFAULTS` constant. Its settings are read and written through `GET`/`PUT /rewards/settings` rather than being declared in the module class, so the admin screen is the place they are defined.

## Earning

An earning rule decides what a customer gets:

| Field                 | Meaning                                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| `rule_type`           | What the rule rewards — a purchase, a signup, a review, a referral.         |
| `points_per_currency` | Points awarded per unit of order value, to four decimal places.             |
| `bonus_points`        | A flat award, for rules that are not proportional to spend.                 |
| `multiplier`          | Applied on top of the base award.                                           |
| `target_type`, `target_ids` | Narrows the rule to particular products or categories.                |
| `min_order_value`     | A floor below which the rule does not fire.                                 |
| `valid_from`, `valid_until` | The window the rule is live in.                                       |
| `priority`, `is_active` | Ordering, and whether the rule runs.                                      |

Awards are driven by real events: `woocommerce_order_status_completed` for a purchase, `user_register` for a signup, and `comment_post` plus `wp_set_comment_status` for a review — so review points are awarded on the **moderated** status, not merely on submission.

Points are taken back when an order stops being valid: the module hooks `woocommerce_order_status_cancelled`, `_failed` and `woocommerce_order_refunded`, and fires `aiowc_rp_order_points_reversed` when it does.

## Tiers

| Field                     | Meaning                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| `tier_id`, `name`         | The tier's key and its display name.                               |
| `min_points`, `max_points`| The band of lifetime points it covers.                             |
| `multiplier`              | How much faster this tier earns.                                   |
| `benefits`                | What the tier gives, as text.                                      |
| `color`, `icon`           | How the tier is presented.                                         |

Crossing a boundary fires `aiowc_rp_tier_upgraded` or `aiowc_rp_tier_downgraded` — downgrades included, so a tier is not permanent unless the store's thresholds make it so.

## Redeeming

A signed-in customer applies points at the cart and the module converts them to a discount on `woocommerce_cart_calculate_fees`. `/public/rewards/max-redeemable` says how many points may be spent on the current cart, so the control can cap itself rather than failing after the fact.

## Expiry

Points carry an `expires_at`. A daily job expires those past their date and a weekly job recalculates balances, which is what keeps the per-customer total honest against the ledger. Customers are warned first — the balance row carries `expiring_soon` and `next_expiry_date`, and a reminder job emails them.

## Admin screen

The **Rewards & Points** tab shows an overview, the customer list with balances, top earners and the distribution across tiers; manages earning rules and tiers; adjusts one customer's points with an audit trail; shows recent activity and a customer's own transactions; and carries a **diagnostics** endpoint for checking the module's configuration on a given store.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

### Administrator routes — `manage_woocommerce`

| Method            | Path                                     | Purpose                                    |
| ----------------- | ---------------------------------------- | -------------------------------------------- |
| GET               | `/rewards/overview`                      | Programme totals.                           |
| GET               | `/rewards/customers`                     | Customers and their balances.               |
| GET               | `/rewards/customers/{id}`                | One customer.                               |
| GET               | `/rewards/customers/{id}/transactions`   | That customer's ledger.                     |
| POST              | `/rewards/customers/{id}/adjust`         | Add or remove points (`points`).            |
| GET               | `/rewards/top-earners`                   | The highest balances.                       |
| GET               | `/rewards/activity`                      | Recent movements across all customers.      |
| GET / POST        | `/rewards/earning-rules`                 | List and create earning rules.              |
| GET / PATCH / PUT / POST / DELETE | `/rewards/earning-rules/{id}` | Manage one rule.               |
| GET / POST        | `/rewards/tiers`                         | List and create tiers.                      |
| GET / PATCH / PUT / POST / DELETE | `/rewards/tiers/{id}`    | Manage one tier.                            |
| GET               | `/rewards/tiers/distribution`            | How customers are spread across tiers.      |
| GET               | `/rewards/diagnostics`                   | The module's own health detail.             |
| GET / PATCH / PUT / POST | `/rewards/settings`               | Read and write the settings.                |

### Customer routes

| Method | Path                              | Purpose                                        | Permission           |
| ------ | --------------------------------- | ------------------------------------------------ | -------------------- |
| GET    | `/public/rewards/balance`         | The caller's balance.                           | Signed-in customer   |
| GET    | `/public/rewards/transactions`    | The caller's ledger.                            | Signed-in customer   |
| GET    | `/public/rewards/tier`            | The caller's tier.                              | Signed-in customer   |
| GET    | `/public/rewards/expiring`        | Points about to lapse.                          | Signed-in customer   |
| GET    | `/public/rewards/max-redeemable`  | The most that may be spent on this cart.        | Signed-in customer   |
| POST   | `/public/rewards/apply`           | Spend points on the cart (`points`).            | Signed-in customer   |
| DELETE | `/public/rewards/remove`          | Take applied points off the cart.               | Signed-in customer   |
| GET    | `/public/rewards/applied`         | What is applied to this cart.                   | Signed-in customer   |
| GET    | `/public/rewards/calculate`       | What an order would earn — usable signed out.   | Public, rate-limited |

Every route that touches a balance resolves the customer from the session, so one customer's routes can never describe another's. `/calculate` is the only exception and reads nothing personal — it answers "what would this earn", which is what lets the product page advertise points to a visitor who has not signed in.

## WooCommerce integration

| Area          | Hooks                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Earning       | `woocommerce_order_status_completed`, `_processing`, `user_register`, `comment_post`, `wp_set_comment_status` |
| Reversal      | `woocommerce_order_status_cancelled`, `_failed`, `woocommerce_order_refunded`                 |
| Cart          | `woocommerce_cart_calculate_fees`, `_before_cart_totals`, `_cart_totals_before_order_total`, `_cart_emptied` |
| Checkout      | `woocommerce_checkout_order_processed`                                                        |
| Display       | `woocommerce_single_product_summary`, `_after_shop_loop_item_title`, `woocommerce_thankyou`    |
| Account       | `woocommerce_account_menu_items`, `woocommerce_account_dashboard`                              |
| Order display | `woocommerce_order_details_after_order_table`, `woocommerce_email_after_order_table`           |
| AJAX          | `wp_ajax_aiowc_rp_apply_points`, `wp_ajax_aiowc_rp_remove_points`                             |

The AJAX handlers have **no `nopriv` counterpart**, which matches the module's design: points belong to an account, so a signed-out visitor has none to apply.

## Database schema

| Table                                  | Holds                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_points_ledger`          | Every movement: customer, type, points, balance before and after, source and source id, description, expiry, who made it. |
| `{prefix}aiowc_points_earning_rules`   | The rules: type, name, points per currency, targeting, multiplier, minimum order value, bonus points, validity window. |
| `{prefix}aiowc_points_user_balance`    | One row per customer: totals earned, redeemed and expired, current balance, points expiring soon and when, their tier, last activity. |
| `{prefix}aiowc_points_tiers`           | The tiers: key, name, points band, multiplier, benefits, colour and icon.                              |

The balance row is a **running total kept alongside the ledger**, not the source of truth. The weekly recalculation job exists to bring it back in line with the ledger if the two ever diverge.

## Background jobs

| Hook                             | Interval | Work                                                              |
| -------------------------------- | -------- | ------------------------------------------------------------------- |
| `aiowc_rp_expire_points`         | daily    | Expires points past their date and writes the ledger rows for it.  |
| `aiowc_rp_expiration_reminder`   | daily    | Emails customers whose points are about to lapse.                  |
| `aiowc_rp_balance_recalc`        | weekly   | Rebuilds each balance row from the ledger.                         |

Each job fires its own completion event — `aiowc_rp_expiration_job_completed`, `_reminder_job_completed`, `_recalc_job_completed` — so a store can monitor that they actually ran.

## Action hooks for integrators

Points events: `aiowc_rp_points_added`, `_subtracted`, `_redeemed`, `_refunded`, `_expiring`, `_expired`, `_balance_adjusted`, `_applied_to_cart`, `_removed_from_cart`.

Award events: `aiowc_rp_order_points_awarded`, `_order_points_reversed`, `_signup_bonus_awarded`, `_review_bonus_awarded`, `_referral_bonus_awarded`.

Tier events: `aiowc_rp_tier_upgraded`, `aiowc_rp_tier_downgraded`.

Also `aiowc_rp_earning_rule_created`, `aiowc_rp_settings_updated`, the three job-completion events above, and `aiowc_ea_fire_trigger` for email automation.

## Entitlement limits

`rewards_points` is an on/off grant with no cap on the number of rules, tiers, customers or ledger rows. The point values and thresholds are store settings.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. The `/rewards/diagnostics` route gives more detail than the health check alone.

## Known gaps

- **The per-customer balance is a cached total reconciled weekly.** Between reconciliations it is what the cart and the customer see, so a balance that drifts stays wrong for up to a week unless the recalculation is triggered sooner. There is no admin control to run it on demand.
- **A referral bonus event is fired but the module has no referral mechanism of its own** — `aiowc_rp_referral_bonus_awarded` exists for something else to call, so referral points depend on another module or on custom code supplying the referral.
- Settings are not declared as defaults on the module, so there is no single place in the code stating what they are and what they default to.
- Tier assignment is stored on the balance row, so it is refreshed on the same cadence as the balance rather than the instant a threshold is crossed.
- Points are a discount at the cart; there is no way to spend them on a specific product or to convert them into store credit.
