---
id: rentals
title: "Product Rentals"
description: "Hire products by day, week or month with per-product pricing periods, deposits, late and damage fees, a reserved-date calendar and turnaround buffers."
keywords:
  - woocommerce rentals
  - equipment hire
  - rental deposit
  - rental calendar
format: md
---
## Overview

Product Rentals sells a product for a period rather than outright. A customer picks a start and end date, the module prices the hire from the product's rental periods, takes a deposit, and tracks the item until it comes back.

What distinguishes it from a booking is what happens **after** the hire. A rental has an expected return date and an actual one; when the return is recorded, a late fee is calculated from how many days it ran over. A damage fee can be recorded against the rental, and the deposit has its own status so it can be held, returned or kept.

Availability is a calendar of reserved dates per product, which is also how an administrator blocks dates for maintenance — the same mechanism, a different block type.

It is for hire businesses: equipment, costumes, vehicles, party goods.

## Availability

| Item            | Value                                                      |
| --------------- | ------------------------------------------------------------ |
| Module key      | `rentals`                                                   |
| Tier            | Premium                                                     |
| Entitlement key | `rentals`                                                   |
| Admin tab       | `rentals`                                                   |
| Enabled option  | `aiowc_module_enabled_rentals` (off until turned on)        |
| REST namespace  | `aiowc/v1`                                                  |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored in the bundled option row `aiowc_rt_settings`.

| Stored key                   | Default  | Meaning                                                                   |
| ---------------------------- | -------- | --------------------------------------------------------------------------- |
| `enable_daily_rentals`       | `true`   | Whether daily hire is offered.                                             |
| `enable_weekly_rentals`      | `true`   | Whether weekly hire is offered.                                            |
| `enable_monthly_rentals`     | `true`   | Whether monthly hire is offered.                                           |
| `default_rental_period`      | `daily`  | Which period a product starts with.                                        |
| `min_rental_days`            | `1`      | Shortest hire accepted.                                                    |
| `max_rental_days`            | `30`     | Longest hire accepted.                                                     |
| `require_deposit`            | `true`   | Whether a deposit is taken.                                                |
| `default_deposit_percent`    | `20`     | The deposit as a percentage of the hire price.                             |
| `enable_late_fees`           | `true`   | Whether a late return is charged for.                                      |
| `late_fee_daily_percent`     | `5`      | The daily late fee, as a percentage.                                       |
| `reminder_days_before`       | `2`      | How far ahead of the return date a reminder goes out.                      |
| `buffer_days_between`        | `1`      | Days left free between hires, for cleaning and turnaround.                 |
| `allow_same_day_pickup`      | `false`  | Whether a hire may start today. **Off by default.**                        |
| `show_availability_calendar` | `true`   | Whether the calendar is shown on the product page.                         |
| `auto_mark_overdue_days`     | `1`      | Days past the return date before a rental is marked overdue.               |

`buffer_days_between` is the setting that separates this from a naive calendar: without it, one customer's return date and the next customer's pickup date can be the same day.

## Rental periods

A product carries its own period rows, so pricing is per product rather than global:

| Field                                     | Meaning                                                 |
| ----------------------------------------- | --------------------------------------------------------- |
| `period_type`                             | `daily`, `weekly` or `monthly`.                          |
| `price`                                   | What one period costs.                                   |
| `min_duration`, `max_duration`            | How many periods may be hired.                           |
| `deposit_percent`, `deposit_fixed`        | The deposit, as a percentage or a fixed amount.          |
| `late_fee_percent`, `late_fee_fixed`      | The late fee, likewise.                                  |
| `is_active`                               | Whether the period is offered.                           |

Per-product values override the module defaults, so a valuable item can take a larger deposit than the rest of the catalogue.

## The rental

| Field                                   | Meaning                                                             |
| --------------------------------------- | --------------------------------------------------------------------- |
| `rental_start`, `rental_end`            | The hire period as booked.                                           |
| `actual_return_date`                    | When the item actually came back. Empty while it is out.             |
| `status`                                | Where the rental is in its life. `pending` at creation.              |
| `rental_price`                          | The hire charge.                                                     |
| `deposit_amount`, `deposit_status`      | The deposit and whether it is held, returned or kept.                |
| `late_fee`, `damage_fee`                | Charges added after the fact.                                        |
| `pickup_location`, `return_location`    | Where the item is collected and returned — which may differ.         |
| `notes`                                 | Anything recorded against the hire.                                  |

## The availability calendar

Each reserved day is a row naming the product, the quantity reserved and a **block type**, which defaults to `rental`. An administrator blocking dates writes rows with a different block type, so maintenance and hire share one calendar and remain distinguishable.

## Admin screen

The **Rentals** tab lists rentals with an overview, records a return, cancels a rental, manages each product's rental periods, blocks and unblocks dates, and edits the fifteen settings.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                                            | Purpose                                          | Permission           | Required args                             |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- | -------------------- | ----------------------------------------- |
| GET               | `/rentals`                                      | Every rental.                                     | `manage_woocommerce` | –                                         |
| GET               | `/rentals/{id}`                                 | One rental.                                       | `manage_woocommerce` | `id`                                      |
| PATCH / PUT /POST | `/rentals/{id}`                                 | Update a rental.                                  | `manage_woocommerce` | `id`                                      |
| POST              | `/rentals/{id}/return`                          | Record the return.                                | `manage_woocommerce` | `id`, `return_date`                       |
| POST              | `/rentals/{id}/cancel`                          | Cancel a rental.                                  | `manage_woocommerce` | `id`                                      |
| GET               | `/rentals/overview`                             | Counts and totals.                                | `manage_woocommerce` | –                                         |
| GET / POST        | `/rentals/products/{product_id}/periods`        | Read and set a product's rental periods.          | `manage_woocommerce` | `product_id`, `periods` on write          |
| POST / DELETE     | `/rentals/products/{product_id}/block-dates`    | Block and unblock dates.                          | `manage_woocommerce` | `product_id`, `start_date`, `end_date`    |
| GET / PATCH / PUT / POST | `/rentals/settings`                      | Read and write the settings.                      | `manage_woocommerce` | –                                         |
| GET               | `/rentals/my-rentals`                           | The caller's own rentals.                         | Signed-in user       | –                                         |
| GET               | `/rentals/products/{product_id}/calendar`       | A product's availability for a month.             | Public, rate-limited | `product_id`, `month`                     |
| GET               | `/rentals/products/{product_id}/options`        | A product's rental options.                       | Public, rate-limited | `product_id`                              |
| POST              | `/rentals/check-availability`                   | Whether a period is free.                         | Public, rate-limited | `product_id`, `start_date`, `end_date`    |
| POST              | `/rentals/calculate-price`                      | Price a proposed hire.                            | Public, rate-limited | `product_id`, `period_type`, `duration`   |

There is no create route: a rental is created by the customer buying it, not by an administrator posting one.

## WooCommerce integration

| Hook                                          | What the module does                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `woocommerce_before_add_to_cart_button`       | Draws the date picker and the availability calendar.               |
| `woocommerce_add_to_cart_validation`          | Refuses a hire whose dates are unavailable or out of bounds.       |
| `woocommerce_add_cart_item_data`              | Captures the chosen dates into the cart item.                      |
| `woocommerce_get_item_data`                   | Shows the hire period in the cart and at checkout.                 |
| `woocommerce_checkout_create_order_line_item` | Writes the hire onto the order line.                               |
| `woocommerce_order_status_processing` / `_completed` | Creates the rental and reserves the dates.                  |
| `wp_enqueue_scripts`                          | Loads the calendar assets.                                         |

The module registers **no shortcode** and adds no product type: any product becomes rentable by being given rental periods.

## Database schema

| Table                             | Holds                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_rentals`           | The hires: order and item, product, customer, quantity, the period as booked and as returned, status, price, deposit and its status, late and damage fees, pickup and return locations, notes. |
| `{prefix}aiowc_rental_periods`    | Per-product pricing: period type, price, duration bounds, deposit and late fee as percentage or fixed. |
| `{prefix}aiowc_rental_calendar`   | One row per reserved day: the product, the rental, the date, the quantity reserved and the block type. |

## Background jobs

| Hook                                | Interval | Work                                                          |
| ----------------------------------- | -------- | --------------------------------------------------------------- |
| `aiowc_rentals_return_reminders`    | hourly   | Reminds customers whose return date is `reminder_days_before` away. |
| `aiowc_rentals_process_overdue`     | daily    | Sets the status of rentals more than `auto_mark_overdue_days` past their return date to `overdue`, and fires `aiowc_rental_overdue` for each. It calculates no fee. |

Both run on WP-Cron. The overdue job is offset three hours from the module being enabled, and the reminder job one hour, so they do not collide.

## Action hooks for integrators

| Hook                             | Fired when                                    |
| -------------------------------- | ----------------------------------------------- |
| `aiowc_rental_overdue`           | A rental passes its return date.               |
| `aiowc_rental_return_reminder`   | A return reminder is due.                      |
| `aiowc_track_event`              | The module is enabled or disabled.             |

## Entitlement limits

`rentals` is an on/off grant with no cap on rentals, periods or calendar rows. The duration bounds and fees are store settings.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Rentals are implemented twice.** This standalone module and the [Bookings & Rentals](/modules/reference/bookings) module, which owns `aiowc_rental_inventory` and `aiowc_rental_reservations`, are separate implementations with separate data and separate screens. A store should choose one.
- 🔴 **Late and damage fees are calculated and recorded, but never charged.** The late fee is worked out when the return is recorded — from the product's rental period, or from `late_fee_daily_percent` if the period has none — and written to the rental row. **Nothing creates an order, adds a fee to one, or takes payment.** Collecting the money is a manual step, and the same is true of `damage_fee`.
- Likewise `deposit_status` records what should happen to a deposit — held, returned or kept — but the module does not move money to make it so.
- Because the fee is computed at return time, a rental that is overdue and **not yet returned** shows a `late_fee` of zero. The running total a customer owes is not visible until the item comes back.
- The availability calendar is one row per reserved day, so a long hire of a popular product produces a lot of rows and there is no archival job for past dates.
- There is no create route, so a rental taken over the phone has to be entered as a WooCommerce order rather than recorded directly.
