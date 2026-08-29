---
id: vendor-management
title: "Vendor Management"
description: "Turn one store into a marketplace: vendors own products, orders split into per-vendor lines, commission on completion, and payouts an admin runs."
keywords:
  - woocommerce marketplace
  - multi vendor
  - vendor commission
  - vendor payouts
format: md
---
## Overview

The Vendor module turns a single store into a marketplace. Vendors own products, an order is split into per-vendor lines when it is placed, commission is calculated when the order completes, and the balance owed is settled through payouts an administrator opens and marks complete.

Each vendor gets a public store page at `/vendor/{slug}/`, a **Vendor Dashboard** page in My Account, and a "sold by" line on their products. Applications can be taken through a shortcode and approved by an administrator.

It is for stores selling other people's stock. Money movement is recorded, not executed: the module opens a payout, records a transaction reference and marks it complete or failed — no payment provider ships with it.

## Availability

| Item            | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| Module key      | `vendor_management`                                            |
| Tier            | Premium                                                        |
| Entitlement key | `vendor_management`                                            |
| Admin tab       | `vendors`, under **Operations**                                |
| Enabled option  | `aiowc_module_enabled_vendor_management` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                     |

Enabling the module creates the five tables below, seeds the defaults, adds the `aiowc_vendor` role, schedules both jobs and flags the rewrite rules to be flushed on the next `init`. Disabling it unschedules the jobs.

## The vendor role

`onEnable()` adds an `aiowc_vendor` WordPress role with `read`, `edit_products`, `delete_products` and `upload_files`, and explicitly **without** `publish_products`, `edit_posts`, `delete_posts` or `view_woocommerce_reports`. A vendor can therefore draft and edit products but not publish them, which is what makes approval meaningful.

## Settings

Stored in the bundled option row `aiowc_vm_settings`; legacy per-key options are migrated on first read.

| Stored key                  | Default      | Meaning                                                                                                     |
| --------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `enable_registration`       | `true`       | Accept vendor applications.                                                                                 |
| `registration_approval`     | `true`       | A new vendor lands as `pending` and must be approved.                                                       |
| `default_commission_rate`   | `10`         | Commission used when a vendor or product has no rate of its own.                                            |
| `commission_type`           | `percentage` | `percentage`, `fixed` or `tiered`.                                                                          |
| `minimum_payout_amount`     | `50`         | A vendor below this balance is skipped by the payout cycle.                                                 |
| `payout_schedule`           | `monthly`    | `weekly`, `biweekly` or `monthly` — when the payout job considers itself due.                               |
| `auto_approve_products`     | `false`      | Read when a product is assigned, but both branches produce the same result — see [Known gaps](#known-gaps). |
| `vendor_dashboard_page`     | `0`          | Page id holding the dashboard shortcode.                                                                    |
| `enable_vendor_ratings`     | `true`       | Stored, but nothing writes a rating — see [Known gaps](#known-gaps).                                        |
| `show_vendor_on_product`    | `true`       | Draw the "sold by" line on the product page.                                                                |
| `vendor_store_page_enabled` | `true`       | Serve the `/vendor/{slug}/` store archive.                                                                  |

The last two are read once, when hooks are registered: turning either off means the matching hooks are never attached.

## Admin screen

The **Multi-Vendor Management** tab is one screen with two tables.

**Vendors** lists every vendor with their store, commission rate, pending earnings and status, and offers approve, suspend, open-a-payout and remove actions, plus an **Add vendor** dialogue taking an email, contact name, store name and an optional commission rate.

**Pending payouts** lists open payouts and takes a transaction reference to mark one complete, or marks it failed.

## Order flow

1. **`woocommerce_checkout_order_processed`** — the order is split into one vendor-order line per item that belongs to a vendor.
2. **`woocommerce_order_status_completed`** — the split is re-run (it is idempotent) and each pending line has its commission calculated: the commission amount and the vendor's earning are written onto the line and into the commission table, and the vendor's totals are updated.
3. **Reconciliation** — the hourly job walks up to 100 lines still marked pending, looks up each order, and either calculates it (order completed) or voids it (order cancelled, refunded, failed or trashed). Voiding reverses earnings already credited and marks the lines cancelled, skipping anything already paid out.

Voiding happens only through that hourly pass. No hook fires on `woocommerce_order_status_cancelled` or `_refunded`, so a cancelled order's commission is reversed at the next reconciliation rather than immediately.

## Payouts

`createPayout()` opens a payout for a vendor's unpaid balance. `runPayoutCycle()` walks the vendors whose balance is at or above `minimum_payout_amount`, skipping any vendor that already has a pending payout, and opens one each. A payout is then completed with a transaction reference, or failed with a note; both record the acting administrator and the time.

The payout job is scheduled daily but only acts when `payout_schedule` says it is due, comparing against the last run in the site's timezone.

## REST API endpoints

All routes are on `aiowc/v1`. The vendor CRUD routes answer **bare** rather than in the envelope; the rest use `{ success, data, message }`.

| Method             | Path                                  | Purpose                                                                      | Permission           | Required args      |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------- | -------------------- | ------------------ |
| GET                | `/vendors`                            | List vendors; filters `status`, `search`, `page`, `per_page`.                | `manage_woocommerce` | –                  |
| POST               | `/vendors`                            | Create a vendor.                                                             | `manage_woocommerce` | `store_name`       |
| GET                | `/vendors/{id}`                       | Read one vendor.                                                             | `manage_woocommerce` | `id`               |
| PUT / PATCH / POST | `/vendors/{id}`                       | Update a vendor.                                                             | `manage_woocommerce` | `id`               |
| DELETE             | `/vendors/{id}`                       | Delete a vendor.                                                             | `manage_woocommerce` | `id`               |
| POST               | `/vendors/{id}/status`                | Set a vendor's status — this is how an application is approved or suspended. | `manage_woocommerce` | `id`, `status`     |
| GET                | `/vendors/{id}/products`              | Products assigned to a vendor.                                               | `manage_woocommerce` | `id`               |
| POST               | `/vendors/{id}/products`              | Assign a product, optionally with its own commission rate and type.          | `manage_woocommerce` | `id`, `product_id` |
| DELETE             | `/vendors/{id}/products/{product_id}` | Unassign a product.                                                          | `manage_woocommerce` | `id`, `product_id` |
| GET                | `/vendors/{id}/orders`                | A vendor's order lines.                                                      | `manage_woocommerce` | `id`               |
| GET                | `/vendors/{id}/payouts`               | A vendor's payouts.                                                          | `manage_woocommerce` | `id`               |
| POST               | `/vendors/{id}/payouts`               | Open a payout for a vendor.                                                  | `manage_woocommerce` | `id`               |
| GET                | `/vendors/payouts`                    | All payouts; filters `status`, `vendor_id`, `page`, `per_page`.              | `manage_woocommerce` | –                  |
| POST               | `/vendors/payouts/{id}/complete`      | Mark a payout complete with a `transaction_id`.                              | `manage_woocommerce` | `id`               |
| POST               | `/vendors/payouts/{id}/fail`          | Mark a payout failed with `notes`.                                           | `manage_woocommerce` | `id`               |
| GET                | `/vendors/settings`                   | Read the settings above.                                                     | `manage_woocommerce` | –                  |
| PUT / PATCH / POST | `/vendors/settings`                   | Update the settings above.                                                   | `manage_woocommerce` | –                  |
| GET                | `/vendors/me`                         | The signed-in vendor's own dashboard data.                                   | Signed-in user       | –                  |

## WooCommerce integration

| Hook                                            | Priority | What the module does                                                        |
| ----------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `woocommerce_checkout_order_processed`          | 10       | Splits the order into per-vendor lines.                                     |
| `woocommerce_order_status_completed`            | 10       | Calculates commission for that order's pending lines.                       |
| `woocommerce_single_product_summary`            | 7        | Draws the "sold by" line (when `show_vendor_on_product` is on).             |
| `woocommerce_account_menu_items`                | 10       | Adds **Vendor Dashboard** to My Account.                                    |
| `woocommerce_account_vendor-dashboard_endpoint` | 10       | Renders the dashboard in My Account.                                        |
| `template_redirect`                             | 10       | Handles a submitted vendor registration.                                    |
| `pre_get_posts` / `posts_join`                  | 10       | Scopes the `/vendor/{slug}/` archive to that vendor's products.             |
| `woocommerce_archive_description`               | 10       | Draws the store header on that archive.                                     |
| `init`                                          | 10       | Registers the account endpoint and the two `/vendor/{slug}/` rewrite rules. |

**Shortcodes**

| Shortcode                   | Renders                           |
| --------------------------- | --------------------------------- |
| `[empora_vendor_dashboard]` | The signed-in vendor's dashboard. |
| `[empora_vendor_register]`  | The vendor application form.      |

## Database schema

| Table                              | Holds                                                                                                                                                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_vendors`            | The vendor: user id, store name and slug, description, logo and banner, commission rate and type, status, running sales and earnings totals, rating, payment method and details, address, phone, social links. Unique on user id and on store slug. |
| `{prefix}aiowc_vendor_products`    | Which products belong to which vendor, with an optional per-product commission.                                                                                                                                                                     |
| `{prefix}aiowc_vendor_orders`      | One line per vendor per order item: quantity, line total, commission amount, vendor earning, status, commission status, payout id.                                                                                                                  |
| `{prefix}aiowc_vendor_payouts`     | Payouts: amount, method, details, transaction id, status, notes, who processed it and when.                                                                                                                                                         |
| `{prefix}aiowc_vendor_commissions` | The commission record behind each line: rate, type, amount, earning, status, payout id, calculated and paid times.                                                                                                                                  |

## Background jobs

| Hook                                 | Interval | Work                                                                                   |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------------- |
| `aiowc_vendor_commissions_reconcile` | hourly   | Calculates or voids up to 100 pending order lines the live hooks missed.               |
| `aiowc_vendor_payouts_process`       | daily    | Runs the payout cycle when `payout_schedule` says it is due, and records the run time. |

## Action hooks for integrators

| Hook                                 | Fired when                                   |
| ------------------------------------ | -------------------------------------------- |
| `aiowc_vendor_registered`            | A vendor record is created, with its status. |
| `aiowc_vendor_status_changed`        | A vendor moves between statuses.             |
| `aiowc_vendor_commission_calculated` | A line's commission is worked out.           |
| `aiowc_vendor_payout_created`        | A payout is opened.                          |
| `aiowc_vendor_payout_completed`      | A payout is marked complete.                 |
| `aiowc_vendor_payout_failed`         | A payout is marked failed.                   |

## Entitlement limits

`vendor_management` is an on/off grant with no cap on vendors, products or payouts. The numeric limits are store settings and constants: the minimum payout amount, the payout schedule, and the 100-line reconciliation batch.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- **No payment is executed.** Completing a payout records a transaction reference an administrator supplies; nothing is sent to a payment provider.
- `commission_type` accepts `tiered`, and the vendor and product records carry a type each, but there is no tier table — a tiered rate has nowhere to define its bands.
- There is no admin screen for assigning products to vendors, or for browsing a vendor's order lines; both are REST-only.
- **Vendor ratings are never written.** `enable_vendor_ratings` is a setting, the vendor row has `rating_average` and `rating_count`, and `VendorRepository::updateRating()` exists — but nothing calls it, and no route or screen collects a rating.
- **`auto_approve_products` has no effect.** In `VendorService::assignProduct()` both branches of its ternary produce `'active'`, so an assigned product is active either way (`includes/Modules/VendorManagement/Service/VendorService.php:305`).
