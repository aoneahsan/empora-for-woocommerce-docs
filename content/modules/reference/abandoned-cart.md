---
id: abandoned-cart
title: "Abandoned Cart Recovery"
description: "Record carts left before checkout and email the shopper a link that restores it, optionally with a single-use coupon, on a schedule you set."
keywords:
  - woocommerce abandoned cart
  - cart recovery email
  - recovery coupon
  - empora abandoned cart
format: md
---
## Overview

The Abandoned Cart Recovery module records carts that shoppers leave without checking out and emails those shoppers a link that restores the cart, optionally with a single-use WooCommerce coupon. The follow-up runs on a schedule the store owner sets.

It is for stores that want to chase unfinished checkouts without adding an external service. Capture, scheduling, sending and cleanup all run inside the store's own WordPress installation, and the mail goes out through `wp_mail`.

## Availability

| Item            | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Module key      | `abandoned_cart`                                            |
| Tier            | Premium                                                     |
| Entitlement key | `abandoned_cart`                                            |
| Admin tab       | `abandoned-cart`, under **Marketing & Email**               |
| Enabled option  | `aiowc_module_enabled_abandoned_cart` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                  |

The module class is constructed at bootstrap, but it registers no hooks, no REST routes and no jobs until the module is switched on from the Modules screen, and it can only be switched on while the licence grants the `abandoned_cart` entitlement. Enabling it creates the three tables listed below, seeds the default settings and schedules the three background jobs. Disabling it unschedules them; the tables and their rows are left in place.

## Settings

Settings live in a single option row, `aiowc_ac_settings`, stored with `autoload=false`. Installations that predate the bundled row keep per-key options named `aiowc_ac_<key>`; those are migrated on the first read after the upgrade.

| API name             | Stored key             | Default          | Meaning                                                                               |
| -------------------- | ---------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `abandonTimeout`     | `abandon_timeout`      | `60`             | Minutes of inactivity after which a captured cart is treated as abandoned.            |
| `enableGuestCapture` | `enable_guest_capture` | `true`           | Whether the checkout script captures an address from visitors who are not signed in.  |
| `emailSequence`      | `email_sequence`       | `[1, 3, 7]`      | Delays, **in hours**, at which each recovery email is scheduled after abandonment.    |
| `autoCoupon`         | `auto_coupon`          | `true`           | Whether a recovery coupon is created and included in the email.                       |
| `couponDiscountType` | `coupon_discount_type` | `percent`        | `percent` creates a percentage coupon; any other value creates a fixed cart discount. |
| `couponValue`        | `coupon_value`         | `10`             | Discount amount, read according to the type above.                                    |
| `couponExpiry`       | `coupon_expiry`        | `7`              | Days until the generated coupon expires.                                              |
| `cleanupDays`        | `cleanup_days`         | `30`             | Age in days at which unrecovered cart rows are deleted by the cleanup job.            |
| `emailFromName`      | `email_from_name`      | site title       | From name on recovery mail.                                                           |
| `emailFromAddress`   | `email_from_address`   | site admin email | From address on recovery mail.                                                        |

`emailSequence` is written to the option as a JSON array and read back as an array. Each value is passed to `strtotime()` as a number of hours, so the shipped default sends at roughly 1, 3 and 7 hours after the cart is marked abandoned — not days.

Three subject lines ship with the module ("You left something behind!", "Your cart is waiting for you", "Last chance! Complete your purchase"). They are assigned by position, and a sequence longer than three entries reuses the first subject for every later message. The subjects are not configurable.

## Admin screen

The **Abandoned Cart** tab shows recovery statistics and the captured carts:

- Summary figures read from `GET /abandoned-carts/stats`.
- A paginated table of carts — customer, item count, cart value, time since abandonment and status — with a status filter offering all carts, abandoned, recovered, converted and expired.
- A refresh control, and a retry control when a request fails.

The screen reads only. The settings endpoints below exist, but no control on this screen writes to them, so the shipped defaults apply unless the settings route is called directly.

## REST API endpoints

All routes sit on the `aiowc/v1` namespace. "Manage" below means the caller needs `manage_woocommerce`, plus a valid REST nonce when the request is authenticated by cookie.

| Method             | Path                                      | Purpose                                           | Required args |
| ------------------ | ----------------------------------------- | ------------------------------------------------- | ------------- |
| GET                | `/abandoned-carts`                        | List carts; accepts `page`, `per_page`, `status`. | –             |
| GET                | `/abandoned-carts/{id}`                   | Read one cart.                                    | `id`          |
| POST               | `/abandoned-carts/capture`                | Capture a cart and its email from the checkout.   | `email`       |
| GET                | `/abandoned-carts/overview`               | Counts for the admin overview.                    | –             |
| GET                | `/abandoned-carts/stats`                  | Recovery statistics.                              | –             |
| GET                | `/abandoned-carts/settings`               | Read the settings above.                          | –             |
| PUT / PATCH / POST | `/abandoned-carts/settings`               | Update the settings above.                        | –             |
| GET                | `/abandoned-carts/track/open/{email_id}`  | Record an email open.                             | `email_id`    |
| GET                | `/abandoned-carts/track/click/{email_id}` | Record a link click.                              | `email_id`    |

Permissions differ by route:

| Route group                                 | Permission                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Everything except capture and tracking      | Manage (`manage_woocommerce`).                                                         |
| `/abandoned-carts/capture`                  | Open to guests, but requires a REST nonce and is rate limited to 10 requests a minute. |
| The two `/abandoned-carts/track/...` routes | Open reads, rate limited to 120 requests a minute per caller.                          |

## WooCommerce integration

| Hook                                   | What the module does                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wp_enqueue_scripts`                   | On the checkout page only, loads `assets/js/cart-capture.js` and passes it the capture URL, a REST nonce, the guest-capture setting and whether the visitor is signed in. |
| `woocommerce_checkout_order_processed` | Records that the cart reached an order.                                                                                                                                   |
| `woocommerce_order_status_completed`   | Marks the matching cart converted.                                                                                                                                        |
| `woocommerce_payment_complete`         | Marks the matching cart converted.                                                                                                                                        |
| `template_redirect`                    | Handles an inbound recovery link.                                                                                                                                         |
| `woocommerce_applied_coupon`           | Records use of a recovery coupon.                                                                                                                                         |

### Recovery links

A recovery link carries `aiowc_recover` (the cart id), `aiowc_t` (a signature over the cart and email ids), and optionally `email_id` and `coupon`. The signature is verified before any record is loaded, because cart ids are sequential and the restore path writes the original customer's address into the current visitor's WooCommerce session. An unsigned or edited link returns without any side effect.

### Coupons

When `autoCoupon` is on, the module creates a real `WC_Coupon` with a code of the form `AIOWC-XXXXXXXX`, marked individual use only, usage limit 1, and with an expiry set from `couponExpiry`. One coupon is reused for a cart while it remains unused.

## Database schema

| Table                            | Holds                                                               |
| -------------------------------- | ------------------------------------------------------------------- |
| `{prefix}aiowc_abandoned_carts`  | Captured carts, their contents, value, customer address and status. |
| `{prefix}aiowc_recovery_emails`  | Scheduled and sent recovery messages with their status.             |
| `{prefix}aiowc_recovery_coupons` | Coupons generated for a cart, with type, value, expiry and use.     |

## Background jobs

All three are Action Scheduler recurring actions in the `aiowc` group, scheduled when the module is enabled and unscheduled when it is disabled.

| Hook                           | Interval   | Work                                                                                                                           |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `aiowc_ac_detect_abandoned`    | 15 minutes | Marks captured carts abandoned once `abandonTimeout` has passed, and schedules the email sequence.                             |
| `aiowc_ac_send_recovery_email` | 5 minutes  | Sends due messages. A cart that is no longer abandoned has its pending messages cancelled.                                     |
| `aiowc_ac_cleanup`             | 24 hours   | Deletes cart rows older than `cleanupDays`, expired tracking rows, and expired WooCommerce coupons whose code begins `AIOWC-`. |

## Entitlement limits

The entitlement is a single on/off grant: without `abandoned_cart` the module cannot be enabled, and while it is absent none of the above loads. The licence carries no per-record quota for this module — cart, email and coupon volumes are bounded only by the settings above.

## Health check

The module reports a warning when its tables are missing or when WooCommerce is not active, and otherwise reports that it is functioning normally.
