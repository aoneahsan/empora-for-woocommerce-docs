---
id: bookings
title: "Bookings & Rentals"
description: "Bookable products with computed availability, staff, room and equipment resources, per-booking timezones, a guarded status machine and optional calendar sync."
keywords:
  - woocommerce bookings
  - appointment booking
  - booking resources
  - availability rules
format: md
---
## Overview

Bookings & Rentals adds a **bookable product type**: something sold as a slot in time rather than as a unit of stock. An appointment, a table, a room, a piece of equipment for a weekend.

Availability is computed rather than stored as a list. Rules define when a product can be booked — globally, per product, or per resource — and a slot generator turns those rules into the slots a customer actually sees, minus what is already taken. A conflict detector then re-checks at the moment of booking, so two customers racing for the last slot do not both get it.

**Resources** are the things a booking consumes: staff, rooms, equipment, vehicles. A resource has a capacity and can modify the price, so booking the senior stylist or the large room costs more.

Bookings carry a **timezone** and store prices broken into base, resource and per-person components, so what was charged remains explicable later.

It is for appointments, reservations and hire.

## Availability

| Item            | Value                                                        |
| --------------- | -------------------------------------------------------------- |
| Module key      | `bookings`                                                    |
| Tier            | Premium                                                       |
| Entitlement key | `bookings`                                                    |
| Admin tab       | `bookings`                                                    |
| Enabled option  | `aiowc_module_enabled_bookings` (off until turned on)         |
| REST namespace  | `aiowc/v1`                                                    |
| Product type    | Bookable                                                      |

Enabling the module creates the tables below and schedules four jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally. It registers the product type, the frontend, the jobs, the WooCommerce email classes, the calendar provider and the email-automation triggers.

## Settings

This module declares no `DEFAULTS` constant. Its configuration is per product, per resource and per availability rule rather than a set of module-wide switches.

## The booking

| Field                                     | Meaning                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `start_datetime`, `end_datetime`, `all_day`| When the booking is.                                                    |
| `timezone`                                | The zone it was made in — stored per booking, not assumed.              |
| `duration_value`, `duration_unit`         | Its length, in minutes, hours, days or weeks.                           |
| `persons`                                 | How many people it is for.                                              |
| `status`                                  | `pending`, `confirmed`, `complete`, `cancelled`, `expired` or `no_show`. |
| `payment_status`                          | `unpaid`, `paid`, `refunded` or `partial`.                              |
| `base_price`, `resource_price`, `person_price`, `total_price` | The price broken into its parts.                    |
| `customer_*`                              | Email, name and phone — captured even for a guest booking.              |
| `notes`, `internal_notes`                 | What the customer said, and what staff recorded. **Kept separate.**     |
| `custom_fields`                           | Anything else the store collects, as JSON.                              |
| `external_calendar_id`, `external_event_id`, `calendar_synced_at` | The linked calendar event.                     |
| `confirmed_at`, `cancelled_at`, `cancelled_by`, `cancellation_reason` | The audit of what happened and who did it.  |

Storing a timezone per booking, rather than converting to one store zone, is what makes a booking survive a daylight-saving change with its meaning intact.

## Resources

| Field                                      | Meaning                                                    |
| ------------------------------------------ | ------------------------------------------------------------ |
| `type`                                     | `staff`, `room`, `equipment`, `vehicle` or `custom`.        |
| `capacity`                                 | How many bookings it serves at once.                        |
| `price_modifier_type`, `price_modifier`    | `none`, `fixed`, `percent` or `multiply`, and the amount.   |
| `availability_override`                    | Rules specific to this resource, as JSON.                   |
| `display_order`, `is_active`               | How it is presented and whether it is offered.              |

A booking is linked to its resources through a join table, so one booking can consume more than one.

## Availability rules

A rule has a **scope** — `global`, `product` or `resource` — so a store defines its general opening hours once and overrides them where a particular product or member of staff differs.

## Status machine

Status changes go through a state machine rather than being set freely, and every transition is written to a log readable at `/bookings/{id}/logs`. Whether a customer may cancel is decided by the `aiowc_booking_cancellation_allowed` filter, so a store can express its own cancellation window.

## Calendar sync

The module defines a calendar provider interface with two implementations: a **Google Calendar** provider and a **null provider** that does nothing.

🔴 **The null provider is what runs unless Google Calendar is configured.** That is a deliberate design — the module works without an external calendar, and the sync job simply has nothing to do. A booking's `external_event_id` stays empty and `calendar_synced_at` is never set.

## Admin screen

The **Bookings** tab lists bookings and confirms, cancels, completes, reschedules or marks them no-show, individually or in bulk; manages resources and availability rules; shows statistics; exports bookings; and reads a booking's transition log. A **diagnostics** service backs a check of the module's own configuration.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

### Administrator routes — `manage_woocommerce`

| Method | Path                                | Purpose                                     |
| ------ | ----------------------------------- | --------------------------------------------- |
| GET / POST | `/bookings`                     | List and create bookings.                    |
| GET / PATCH / DELETE | `/bookings/{id}`      | Manage one booking.                          |
| POST   | `/bookings/{id}/confirm`            | Confirm it.                                  |
| POST   | `/bookings/{id}/cancel`             | Cancel it.                                   |
| POST   | `/bookings/{id}/complete`           | Mark it complete.                            |
| POST   | `/bookings/{id}/no-show`            | Mark the customer as not having arrived.     |
| POST   | `/bookings/{id}/reschedule`         | Move it.                                     |
| GET    | `/bookings/{id}/logs`               | Its transition history.                      |
| POST   | `/bookings/bulk/confirm` / `/bulk/cancel` | Act on several at once.                |
| GET    | `/bookings/export`                  | Export bookings.                             |
| GET    | `/bookings/statistics`              | Counts and totals.                           |
| GET / POST | `/bookings/resources`           | List and create resources.                   |
| GET / PATCH / DELETE | `/bookings/resources/{id}` | Manage one resource.                    |
| POST   | `/bookings/resources/reorder`       | Change their display order.                  |
| GET / POST | `/bookings/rules`               | List and create availability rules.          |
| GET / PATCH / DELETE | `/bookings/rules/{id}` | Manage one rule.                             |

### Customer routes

| Method | Path                                    | Purpose                                                | Permission           | Required args                        |
| ------ | --------------------------------------- | -------------------------------------------------------- | -------------------- | ------------------------------------ |
| GET    | `/public/bookings/slots`                | Available slots for a product over a date range.        | Public, rate-limited | `productId`, `startDate`, `endDate`  |
| GET    | `/public/bookings/resources`            | The resources a product offers.                         | Public, rate-limited | `productId`                          |
| POST   | `/public/bookings/price`                | Price a proposed booking.                               | Public, rate-limited | –                                    |
| GET    | `/public/bookings/my-bookings`          | The caller's bookings.                                  | Customer check       | –                                    |
| GET    | `/public/bookings/{id}`                 | One of the caller's bookings.                           | Customer check       | `id`                                 |
| POST   | `/public/bookings/{id}/cancel`          | Cancel their own booking.                               | Customer check       | `id`                                 |
| POST   | `/public/bookings/{id}/reschedule`      | Move their own booking.                                 | Customer check       | `id`, `startDatetime`, `endDatetime` |

The four customer routes that name a booking id run a **customer permission check**, so a customer cannot read or change a booking that is not theirs by guessing an id.

## WooCommerce integration

| Area          | Hooks                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Product type  | `product_type_selector`, `product_type_options`, `woocommerce_product_class`, `woocommerce_product_data_tabs` / `_panels`, `woocommerce_process_product_meta` |
| Product page  | `woocommerce_before_add_to_cart_button`, `woocommerce_product_single_add_to_cart_text`, `woocommerce_quantity_input_args` / `_classes` |
| Cart          | `woocommerce_add_to_cart_validation`, `_add_cart_item_data`, `_cart_id`, `_get_item_data`, `_before_calculate_totals`, `_check_cart_items` |
| Checkout      | `woocommerce_checkout_process`, `woocommerce_checkout_create_order_line_item`                        |
| Order status  | `woocommerce_order_status_processing`, `_completed`, `_cancelled`, `_failed`, `_refunded`             |
| Account       | `woocommerce_account_menu_items`, `woocommerce_account_bookings_endpoint`                             |
| Emails        | `woocommerce_email_classes` — the module ships confirmation, cancellation and reminder emails as real WooCommerce email classes, so they are editable in WooCommerce's own email settings |
| Order display | `woocommerce_order_item_meta_end`                                                                     |

**Shortcodes** `[aiowc_booking_calendar]`, `[aiowc_booking_search]` and `[aiowc_my_bookings]`.

`woocommerce_cart_id` is notable: it makes each booking a distinct cart line, so two different slots for the same product do not collapse into one line with quantity 2.

## Database schema

| Table                                          | Holds                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `{prefix}aiowc_bookings`                       | The bookings, as described above.                                                     |
| `{prefix}aiowc_booking_resources`              | The resources: type, capacity, price modifier, availability override.                 |
| `{prefix}aiowc_booking_resource_assignments`   | Which resources a booking consumes.                                                   |
| `{prefix}aiowc_booking_availability_rules`     | When things may be booked, scoped globally, per product or per resource.              |
| `{prefix}aiowc_booking_logs`                   | Every status transition, with who made it and why.                                    |
| `{prefix}aiowc_rental_inventory`               | Rental stock held by this module.                                                     |
| `{prefix}aiowc_rental_reservations`            | Rental reservations held by this module.                                              |

The last two matter: **this module contains its own rental implementation**, separate from the standalone [Product Rentals](/modules/reference/rentals) module. See the limits below.

## Background jobs

| Hook                            | Interval         | Work                                                       |
| ------------------------------- | ---------------- | ------------------------------------------------------------ |
| `aiowc_booking_expiry`          | every 15 minutes | Expires pending bookings that were never paid for.          |
| `aiowc_booking_reminder`        | hourly           | Sends reminders for upcoming bookings.                      |
| `aiowc_booking_calendar_sync`   | hourly           | Pushes bookings to the external calendar, where configured.  |
| `aiowc_booking_cleanup`         | daily            | Prunes old log rows.                                        |

The 15-minute expiry job is what releases a slot held by an abandoned checkout, which is why it runs far more often than the others.

## Action hooks for integrators

Lifecycle: `aiowc_booking_created`, `_confirmed`, `_cancelled`, `_completed`, `_rescheduled`, `_no_show`, `_expired`, `_reminder_sent`, `aiowc_rental_checked_out`.

Filters: `aiowc_booking_cancellation_allowed`, `aiowc_booking_max_cart_age`, `aiowc_customer_booking_actions`, and three for the reminder email's data, content and headers.

Also `aiowc_booking_cleanup_complete`, `aiowc_booking_calendar_sync_complete`, and `aiowc_email_automation_trigger`.

## Entitlement limits

`bookings` is an on/off grant with no cap on bookings, resources or rules.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. The diagnostics service gives more detail.

## Known gaps

- **Rentals are implemented twice.** This module owns `aiowc_rental_inventory` and `aiowc_rental_reservations`, while the standalone [Product Rentals](/modules/reference/rentals) module owns `aiowc_rentals`, `aiowc_rental_periods` and `aiowc_rental_calendar`. They are separate implementations with separate data and separate admin screens. A store should choose one.
- **Calendar sync does nothing until Google Calendar is configured** — the null provider is the default, and the sync job runs hourly regardless with nothing to do.
- The module has no settings row, so behaviour that a store might expect to configure once — a default cancellation window, a default reminder lead time — is expressed per rule, per product or through a filter instead.
- Bookings store a customer's name, email and phone directly on the booking row, including for guest bookings, which is customer personal data outside WooCommerce's own order tables and should be accounted for in a retention policy.
