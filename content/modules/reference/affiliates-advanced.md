---
id: affiliates-advanced
title: "Affiliates (Advanced)"
description: "Run a referral programme inside your own store: affiliate signup, referral codes, click tracking, commission on completed orders and payouts."
keywords:
  - woocommerce affiliates
  - affiliate commission
  - affiliate payouts
  - referral tracking
format: md
---
## Overview

The Affiliates module lets signed-in customers sign up as affiliates, gives each one a referral code, records clicks on their links and credits a commission when a referred order completes. Store staff approve affiliates, publish promotional material and mark payout requests as paid from the admin screen.

It is for stores running a referral or partner programme themselves. Nothing pays an affiliate automatically: the module records what is owed and what has been requested, and a person settles it outside the plugin.

## Availability

| Item            | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `affiliates-advanced`                                            |
| Tier            | Premium                                                          |
| Entitlement key | `affiliates-advanced`                                            |
| Admin tab       | `affiliates`, under **Marketing & Email**                        |
| Enabled option  | `aiowc_module_enabled_affiliates-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                       |

`registerHooks()` re-checks the licence entitlement and returns immediately when it is absent, so tracking, shortcodes, jobs and REST routes only exist while the module is both enabled and entitled. Enabling it creates the five tables below and schedules the three jobs; disabling it unschedules them. Uninstalling drops the tables.

## Settings

Stored in the bundled option row `aiowc_aff_settings`; legacy per-key options `aiowc_aff_<key>` are migrated on first read.

| Stored key                | Default  | Meaning                                                                            |
| ------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `require_approval`        | `true`   | Whether a new affiliate starts `pending` rather than `approved`.                   |
| `default_commission_rate` | `10.0`   | Percentage applied to the order total when the affiliate has no rate of their own. |
| `cookie_duration`         | `30`     | Days the referral cookie lives.                                                    |
| `min_payout_amount`       | `50.0`   | Balance an affiliate needs before a payout request is accepted.                    |
| `exclude_coupon_orders`   | `false`  | When on, an order that used any coupon earns no commission.                        |
| `two_tier_enabled`        | `false`  | When on, a referring affiliate's parent also earns half of the child commission.   |
| `commission_on_refund`    | `deduct` | Stored policy for a refunded order.                                                |
| `click_retention_days`    | `180`    | Age at which click rows are deleted by the cleanup job.                            |

Two settings do not reach the REST path. `AffiliatesController` builds its own `AffiliateService` and `PayoutService` without arguments, so `POST /affiliates/register` always behaves as if `require_approval` were `true`, and `POST /affiliates/request-payout` always applies the service's own default minimum of 50. `commission_on_refund` is read into the commission service and exposed by `commissionOnRefundPolicy()`, but no refund hook is registered and `markRefunded()` has no caller, so the setting currently changes nothing.

## Admin screen

The **Affiliates** tab is a partner directory:

- A status filter — active, pending approval, suspended, rejected — driving `GET /affiliates/admin/affiliates?status=…`.
- A table of affiliates with the partner, their code, commission rate, approved earnings and status.
- Per-row approve, suspend and reject actions, each a `PATCH` to the affiliate.
- A summary figure for approved commissions.

Promotional material and payouts have admin REST routes but no screen; they are reachable only by calling the API directly.

## REST API endpoints

All routes are on `aiowc/v1`. "Manage" means `manage_woocommerce` plus a REST nonce on cookie-authenticated requests.

### Affiliate-facing

| Method | Path                         | Purpose                                                                                                                                  | Required args | Permission         |
| ------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| POST   | `/affiliates/register`       | Register the current user as an affiliate; accepts `payment_email` and `tax_info`.                                                       | –             | Signed in          |
| GET    | `/affiliates/dashboard`      | Totals for the current user's affiliate account.                                                                                         | –             | Signed in          |
| GET    | `/affiliates/commissions`    | The current user's commission rows.                                                                                                      | –             | Signed in          |
| POST   | `/affiliates/generate-link`  | Build a referral URL; `target_url` defaults to the site home.                                                                            | –             | Signed in          |
| POST   | `/affiliates/request-payout` | Request a payout. `payment_method` is a label stored on the request and defaults to `paypal`; no payment is taken or sent by the plugin. | –             | Signed in          |
| GET    | `/affiliates/materials`      | List active promotional material (up to 100).                                                                                            | –             | Open, rate limited |

`request-payout` refuses an affiliate whose status is not `approved`, and refuses when the balance is under the minimum.

### Administration

| Method             | Path                                | Purpose                                                            | Required args |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------ | ------------- |
| GET                | `/affiliates/admin/affiliates`      | List affiliates; reads a `status` filter, defaulting to `pending`. | –             |
| PUT / PATCH / POST | `/affiliates/admin/affiliates/{id}` | Change an affiliate's status.                                      | `status`      |
| GET                | `/affiliates/admin/materials`       | List promotional material.                                         | –             |
| POST               | `/affiliates/admin/materials`       | Create a material record.                                          | –             |
| PUT / PATCH / POST | `/affiliates/admin/materials/{id}`  | Update a material record.                                          | –             |
| DELETE             | `/affiliates/admin/materials/{id}`  | Delete a material record.                                          | –             |
| GET                | `/affiliates/admin/payouts`         | List payout requests.                                              | –             |
| PUT / PATCH / POST | `/affiliates/admin/payouts/{id}`    | Change a payout's status; accepts a `note`.                        | `status`      |

## WooCommerce integration

| Hook                                 | What the module does                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init` (priority 5)                  | Reads `ref` or `aff` from the query string, records a click row, and writes an `aiowc_aff` cookie holding the code and click id for `cookie_duration` days. |
| `woocommerce_order_status_completed` | Reads the cookie, checks the affiliate is approved, records the conversion against the click and creates the commission row.                                |
| `cron_schedules`                     | Registers a weekly interval for the payouts job.                                                                                                            |

Commission is calculated from the order total. When `exclude_coupon_orders` is on and the order used any coupon, nothing is credited. When `two_tier_enabled` is on and the affiliate has a parent, the parent is credited half the child's amount — but no shipped route sets a parent, so this path is unreachable through the API.

### Shortcodes

| Shortcode                     | Renders                                  |
| ----------------------------- | ---------------------------------------- |
| `[aiowc_affiliate_dashboard]` | The signed-in affiliate's own dashboard. |
| `[aiowc_affiliate_register]`  | The affiliate sign-up form.              |

## Database schema

| Table                                 | Holds                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `{prefix}aiowc_affiliates`            | Affiliate accounts: user, code, status, payment email, tax details, optional parent. |
| `{prefix}aiowc_affiliate_commissions` | Commission rows per order, with tier and status.                                     |
| `{prefix}aiowc_affiliate_clicks`      | Referral clicks with IP, user agent, referrer and landing URL.                       |
| `{prefix}aiowc_affiliate_payouts`     | Payout requests and their status.                                                    |
| `{prefix}aiowc_affiliate_materials`   | Promotional material records.                                                        |

## Background jobs

WP-Cron events, scheduled on enable and removed on disable.

| Hook                                  | Schedule | Work                                                                                                                             |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_affiliate_process_commissions` | Daily    | Approves pending commissions whose order is complete, in batches of 500. Skips entirely while `require_approval` is on.          |
| `aiowc_affiliate_payouts`             | Weekly   | Counts requested payouts and fires `aiowc_affiliate_payouts_pending_notice`. It does not move money or change a payout's status. |
| `aiowc_affiliate_cleanup_clicks`      | Daily    | Deletes click rows older than `click_retention_days`.                                                                            |

## Entitlement limits

`affiliates-advanced` is an on/off grant checked twice — once before the module can be enabled and again inside `registerHooks()`. There is no per-affiliate, per-click or per-commission quota in the licence. The only numeric bounds in the module are its own settings and the batch sizes above (500 commissions per run, 500 payout requests read, 100 materials listed, 200 affiliates per admin list call).

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
