---
id: delivery
title: "Delivery Date & Time Slots"
description: "Let customers choose a delivery date and time window at checkout, with weekly slot templates, per-slot capacity and fees, blackout dates and reminders."
keywords:
  - woocommerce delivery date
  - delivery time slots
  - checkout delivery picker
  - delivery scheduling
format: md
---
## Overview

Delivery lets the customer choose when their order arrives. At checkout they pick a date and, where slots are configured, a time window; the choice is validated, charged for if the slot carries a fee, and written against the order so it appears on the order screen, in the customer's account and in the order emails.

Slots are weekly templates rather than dated rows: a slot says "Tuesdays, 09:00 to 11:00, ten orders maximum, two pounds". A date is offered when its weekday has slots, it is far enough ahead to satisfy the lead time, it is within the booking window and it is not blacked out.

It is for stores that deliver themselves and need to control when.

## Availability

| Item            | Value                                                   |
| --------------- | --------------------------------------------------------- |
| Module key      | `delivery`                                               |
| Tier            | Premium                                                  |
| Entitlement key | `delivery`                                               |
| Admin tab       | `delivery`                                               |
| Enabled option  | `aiowc_module_enabled_delivery` (off until turned on)    |
| REST namespace  | `aiowc/v1`                                               |

Enabling the module creates the three tables below, seeds the defaults and schedules the cleanup and reminder jobs.

`registerHooks()` performs no licence check of its own and reads no enable setting: it registers the REST routes, the checkout and order handlers, and the job listeners unconditionally. The entitlement gate is applied centrally — the module registry calls `registerHooks()` only for modules that are enabled and granted — so the module is still correctly gated, but there is no second, per-setting switch to turn the checkout field off while leaving the module on.

## Settings

Stored in the bundled option row `aiowc_del_settings`.

| Stored key              | Default       | Meaning                                                                     |
| ----------------------- | ------------- | ----------------------------------------------------------------------------- |
| `enable_date_picker`    | `true`        | Whether the date field is shown at checkout.                                 |
| `enable_time_slots`     | `true`        | Whether a time slot is offered alongside the date.                           |
| `lead_days`             | `1`           | How many days ahead the earliest selectable date is.                         |
| `max_days_ahead`        | `30`          | How far ahead the customer may book.                                         |
| `delivery_days`         | `[1,2,3,4,5]` | Weekdays deliveries run on, stored as a JSON string. Monday is 1.            |
| `slot_duration_minutes` | `120`         | Length of a generated slot.                                                  |
| `max_orders_per_slot`   | `10`          | Capacity of a generated slot.                                                |
| `cleanup_days`          | `90`          | How long delivery records are kept.                                          |
| `reminder_hours_before` | `24`          | How far ahead of the delivery the reminder is sent.                          |
| `enable_reminders`      | `true`        | Whether reminders are sent at all.                                           |

`delivery_days` is stored as the literal JSON string `[1,2,3,4,5]`, not as an array, and readers decode it. Writing a real array to that key will not behave the way the stored default does.

## Choosing a delivery

The checkout handler adds the date and slot fields after the order notes. On submission `woocommerce_checkout_process` validates the choice, and `woocommerce_cart_calculate_fees` adds the slot's fee to the cart, so the customer sees the delivery charge in the totals before paying. `woocommerce_checkout_order_processed` writes the chosen date and slot against the order.

A date is offered when all of these hold: its weekday is listed in `delivery_days`, it is at least `lead_days` away, it is no more than `max_days_ahead` away, and it is not a blackout date. A slot stops being offered for a date once it has taken `max_orders` orders for that date.

Those four tests are applied when the **calendar is built**. The check run on the **submitted** selection is narrower: it requires a date that parses and is not in the past, and a slot that exists for that weekday, is not blacked out and still has capacity. The lead time, the booking window and the delivery-day list are not re-tested at that point — see the limits below.

Dates are computed in UTC rather than in the store's configured timezone, so a store far from UTC can see the earliest offered date roll over at a time that is not local midnight.

## Blackout dates

A blackout date removes a day from the calendar, with a reason recorded against it. A blackout marked `recurring_yearly` applies on that day every year, which is how public holidays are handled. Past non-recurring blackouts are deleted by the slot generator.

## Admin screen

The **Delivery** tab manages the weekly slot templates, the blackout dates and the module's settings, and lists orders with their assigned delivery. Slots are created per weekday with a start time, an end time, a capacity and a fee.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                              | Purpose                                                | Permission           | Required args              |
| ----------------- | --------------------------------- | -------------------------------------------------------- | -------------------- | -------------------------- |
| GET               | `/delivery/slots`                 | Every slot template.                                    | `manage_woocommerce` | –                          |
| POST              | `/delivery/slots`                 | Create a slot template.                                 | `manage_woocommerce` | `day_of_week`, `start_time`, `end_time` |
| PATCH / PUT /POST | `/delivery/slots/{id}`            | Update a slot template.                                 | `manage_woocommerce` | –                          |
| DELETE            | `/delivery/slots/{id}`            | Delete a slot template.                                 | `manage_woocommerce` | –                          |
| GET               | `/delivery/slots/{date}`          | The slots available on one date, with remaining capacity. | Public, rate-limited | –                        |
| GET               | `/delivery/available-dates`       | The dates a customer may choose.                        | Public, rate-limited | –                          |
| GET               | `/delivery/blackout-dates`        | Every blackout date.                                    | `manage_woocommerce` | –                          |
| POST              | `/delivery/blackout-dates`        | Add a blackout date.                                    | `manage_woocommerce` | `date`                     |
| DELETE            | `/delivery/blackout-dates/{id}`   | Remove a blackout date.                                 | `manage_woocommerce` | –                          |
| POST              | `/delivery/orders/{order_id}`     | Assign a delivery date and slot to an order.            | Nonce, rate-limited  | `delivery_date`, `slot_id` |
| PATCH / PUT       | `/delivery/orders/{order_id}`     | Change an order's delivery date and slot.               | `manage_woocommerce` | `delivery_date`, `slot_id` |
| GET               | `/delivery/settings`              | Read the module settings.                               | `manage_woocommerce` | –                          |
| PATCH / PUT /POST | `/delivery/settings`              | Update the module settings.                             | `manage_woocommerce` | –                          |

The two public reads are rate-limited because the checkout page calls them for visitors who are not signed in. `POST /delivery/orders/{order_id}` is the storefront's own write — it requires a valid REST nonce and is rate-limited to 30 requests a minute — while the `PATCH` and `PUT` forms of the same path are the administrator's and require `manage_woocommerce`.

## WooCommerce integration

| Hook                                              | What the module does                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `woocommerce_after_order_notes`                   | Draws the delivery date and slot fields at checkout.                   |
| `woocommerce_checkout_process`                    | Validates the chosen date and slot, refusing an invalid one.           |
| `woocommerce_cart_calculate_fees`                 | Adds the slot's fee to the cart total.                                 |
| `woocommerce_checkout_order_processed`            | Records the delivery against the order.                                |
| `woocommerce_thankyou`                            | Shows the delivery on the order-received page.                         |
| `woocommerce_order_details_after_order_table`     | Shows it on the order detail page, and on the items table.             |
| `woocommerce_email_after_order_table`             | Adds it to the order emails.                                           |
| `woocommerce_view_order`                          | Shows it in the customer's account.                                    |
| `woocommerce_my_account_my_orders_columns`        | Adds a delivery column to the account order list.                      |
| `woocommerce_admin_order_data_after_shipping_address` | Shows it on the admin order screen, under the shipping address.    |
| `wp_enqueue_scripts`                              | Loads the date-picker assets on checkout.                              |

## Database schema

| Table                                    | Holds                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_delivery_slots`           | Weekly slot templates: weekday, start and end time, capacity, fee, the shipping methods it applies to, active flag. |
| `{prefix}aiowc_delivery_orders`          | One row per order with a delivery: the date, the slot, the time window as booked, the fee charged, the customer's note, a status. |
| `{prefix}aiowc_delivery_blackout_dates`  | Dates with no delivery: the date, a reason, and whether it repeats every year.                              |

A delivery row stores the time window alongside the slot id, so editing a slot template later does not rewrite what a past order was promised.

## Background jobs

| Hook                             | Interval | Work                                                                             |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `aiowc_delivery_slot_cleanup`    | daily    | Deletes delivery records older than `cleanup_days`.                               |
| `aiowc_delivery_reminder`        | hourly   | Emails customers whose delivery is `reminder_hours_before` away.                   |
| `aiowc_delivery_generate_slots`  | —        | Would create default slot templates for each delivery day and delete past blackout dates. **Never scheduled — see below.** |

The jobs run on Action Scheduler, in the `aiowc` group. Where Action Scheduler is unavailable the scheduling calls return without doing anything.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

## Entitlement limits

`delivery` is an on/off grant with no cap on slots, orders or blackout dates. The numeric limits are store settings — the lead time, the booking window, the per-slot capacity — plus the rate limit on the public reads.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- 🔴 **The slot generator never runs.** `SlotGeneratorJob` is a complete job — it would create a default set of slot templates for each configured delivery day, and delete past blackout dates — and the module registers a listener for its hook, but nothing ever schedules it. Enabling the module schedules only the cleanup and reminder jobs. In practice this means **a store must create its slot templates by hand**, through the admin screen or the REST routes, before any delivery date can be offered. The settings `slot_duration_minutes` and `max_orders_per_slot` exist to feed that generator, so they have no effect until slots are created manually, where their values are typed in directly instead.
- Because past blackout dates are deleted only by that same unscheduled job, old blackout rows are never cleaned up.
- **`lead_days` and `max_days_ahead` shape the calendar but are not re-checked on submission.** A selection is accepted as long as the date is not in the past and the slot has capacity, so a date inside the lead time or beyond the booking window is accepted if it reaches the validator.
- `GET /delivery/slots/{date}` answers for any date whose weekday has a slot template, without consulting `delivery_days`, while the calendar and next-available-date lookups do consult it. The two can therefore disagree about whether a given day is deliverable.
- `enable_date_picker` and `enable_time_slots` govern the checkout fields only; the REST routes answer regardless of either setting.
- Delivery dates are handled in UTC rather than the store's timezone.
