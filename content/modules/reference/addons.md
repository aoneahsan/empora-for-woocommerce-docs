---
id: addons
title: "Product Add-Ons"
description: "Attach configurable inputs to a product — engraving text, a gift message, an uploaded file — price them onto the item and carry the answers through to the order."
keywords:
  - woocommerce product addons
  - product custom fields
  - product personalisation
  - addon pricing
format: md
---
## Overview

Product Add-Ons attaches extra inputs to a product — engraving text, a gift message, a dropdown of finishes, an uploaded file — and carries the customer's answers through the cart onto the finished order. Each add-on can adjust the price, so the input is both a question and a line of revenue.

An add-on is either global (offered on every product) or targeted at named products and categories, with an exclusion list. Answers are captured into the cart item, re-applied on every totals calculation, shown to the customer in the cart, and written onto the order line item when checkout completes.

It is for stores selling configurable or personalised goods.

## Availability

| Item            | Value                                               |
| --------------- | --------------------------------------------------- |
| Module key      | `addons`                                            |
| Tier            | Premium                                             |
| Entitlement key | `addons`                                            |
| Admin tab       | `product-addons`                                    |
| Enabled option  | `aiowc_module_enabled_addons` (off until turned on) |
| REST namespace  | `aiowc/v1`                                          |

Enabling the module creates the three tables below, seeds the defaults and schedules the cleanup job.

`registerHooks()` returns early when the licence does not grant `addons`. **The REST routes are registered before the `enable_addons` check**, so turning that setting off removes the storefront behaviour — the product form, the cart pricing, the order capture — while leaving the administrator routes answering. That is what keeps the admin screen usable on a store that has switched the customer-facing feature off.

## Settings

Stored in the bundled option row `aiowc_pa_settings`.

| Stored key               | Default   | Meaning                                                                                |
| ------------------------ | --------- | -------------------------------------------------------------------------------------- |
| `enable_addons`          | `true`    | Storefront switch. Off leaves the REST routes live but registers no WooCommerce hooks. |
| `allow_file_upload`      | `true`    | Whether file-type add-ons accept an upload.                                            |
| `max_file_size`          | `5242880` | Largest accepted upload in bytes — 5 MB. Floored at 1024 bytes.                        |
| `show_price_adjustments` | `true`    | Whether the price change is shown against each option on the product page.             |

## Field types

`field_type` decides both the control drawn on the product page and how the answer is validated. Ten types are drawn — `text`, `textarea`, `number`, `checkbox`, `select`, `multi_select`, `radio`, `color`, `date` and `file` — and `text` is the fallback for anything else, including an unrecognised stored value.

| Type              | Validated as                                                        |
| ----------------- | -------------------------------------------------------------------- |
| `select`, `radio` | Must be one of the add-on's own stored options.                     |
| `multi_select`    | Every submitted value must be one of the stored options.            |
| `number`          | Numeric.                                                            |
| `date`            | A parseable date.                                                   |
| `color`           | A three- or six-digit hex colour, matched against `#rgb`/`#rrggbb`. |
| `checkbox`        | One of `0`, `1`, `true`, `false`, `on`, `off` or empty.             |
| everything else   | Accepted as text. `text`, `textarea` and `file` fall here.          |

A required add-on with an empty answer is refused. Conditional rules show or hide an add-on based on another field's answer, using the operators `equals`, `not_equals`, `contains`, `not_empty` and `empty`.

## Pricing

`price_adjustment_type` decides what the answer costs:

| Type       | Effect                                                   |
| ---------- | ---------------------------------------------------------- |
| `flat`     | Adds the fixed amount.                                    |
| `percent`  | Adds a percentage of the product price.                   |
| `per_char` | Multiplies the amount by the number of characters typed.  |
| `none`     | The add-on collects an answer and changes no price.       |

An individual option may carry its own adjustment, which is matched against the submitted value and used in place of the add-on's amount.

## Uploads

A file add-on posts to `/addons/upload`. The service refuses a file larger than `max_file_size`, and accepts `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf` and `text/plain` — plus any other `image/*` type. The MIME type is re-derived from the filename rather than trusted from the upload.

`allow_file_upload` is enforced where the form is drawn: with the setting off, a `file` add-on's input is **skipped entirely** rather than disabled, because a disabled input that is also required cannot be satisfied and would block checkout. The setting governs the form, not the route — see the limits below.

Where the store has file storage wired, the upload is handed to it through the `aiowc_fileshub_store_file` filter and the `aiowc_fileshub_store` action; otherwise the file is stored by WordPress's own `wp_handle_upload()`. Uploads that never reach an order are deleted by the cleanup job.

## Admin screen

The **Product Add-Ons** tab has two tabs of its own, and the active one is held in the URL so a refresh returns to it.

- **Add-ons** lists the add-ons and creates, edits and deletes them over the four `/addons` routes.
- **File uploads** is a check against `/addons/upload`, for confirming uploads work on this store.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                               | Purpose                                              | Permission           | Required args                 |
| ------ | ---------------------------------- | ------------------------------------------------------ | -------------------- | ----------------------------- |
| GET    | `/addons`                          | List every add-on.                                    | `manage_woocommerce` | –                             |
| POST   | `/addons`                          | Create an add-on, with its options.                   | `manage_woocommerce` | `name`, `label`, `field_type` |
| PATCH  | `/addons/{id}`                     | Update an add-on.                                     | `manage_woocommerce` | –                             |
| DELETE | `/addons/{id}`                     | Delete an add-on.                                     | `manage_woocommerce` | –                             |
| GET    | `/addons/for-product/{product_id}` | The add-ons that apply to one product.                | Public, rate-limited | –                             |
| POST   | `/addons/calculate-price`          | Price a set of selections without touching the cart.  | Public, rate-limited | `product_id`, `selections`    |
| POST   | `/addons/upload`                   | Upload a file for a file-type add-on.                 | Upload check         | –                             |

The two public reads are rate-limited rather than open, because the storefront calls them for visitors who are not signed in.

## WooCommerce integration

| Hook                                          | What the module does                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `woocommerce_before_add_to_cart_button`       | Draws the add-on form on the product page.                         |
| `woocommerce_add_cart_item_data`              | Captures the submitted answers into the cart item.                 |
| `woocommerce_get_cart_item_from_session`      | Restores those answers when the cart is rebuilt from the session.  |
| `woocommerce_before_calculate_totals`         | Applies the price adjustments, at priority 20.                     |
| `woocommerce_get_item_data`                   | Shows the answers under the item in the cart and at checkout.      |
| `woocommerce_checkout_create_order_line_item` | Writes the answers and the amount charged onto the order line.     |
| `woocommerce_product_data_tabs` / `_panels`   | Adds the add-on panel to the product edit screen.                  |

**Shortcode** `[aiowc_addons_for product_id="123"]` prints a read-only list of the add-ons that apply to a product. It returns nothing when the id is missing or no add-on applies.

## Database schema

| Table                         | Holds                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_addons`        | The add-on itself: name, label, field type, required and global flags, product and category targeting with exclusions, pricing, conditional rules, sort order, active flag. |
| `{prefix}aiowc_addon_options` | The choices belonging to a select, radio or multi-select add-on: value, label, its own price adjustment, sort order.                                                    |
| `{prefix}aiowc_addon_values`  | One row per answer captured: the order and order item it belongs to, the add-on and its label at the time, the value and the price applied.                             |

An answer stores `addon_label` alongside the add-on id, so renaming an add-on later does not rewrite what past orders say was bought.

## Background jobs

| Hook                           | Interval | Work                                                                                                        |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `aiowc_addons_cleanup_uploads` | daily    | Deletes captured values older than 7 days that never reached an order, and asks storage to delete the file.  |

## Action hooks for integrators

| Hook                        | Fired when                                                       |
| --------------------------- | ------------------------------------------------------------------ |
| `aiowc_fileshub_store`      | An upload is handed to file storage.                              |
| `aiowc_fileshub_store_file` | Filter — lets storage claim the upload and return its stored URL. |
| `aiowc_fileshub_delete`     | The cleanup job discards an abandoned upload.                     |
| `aiowc_track_event`         | The module is enabled or disabled, and after each cleanup run.    |

## Entitlement limits

`addons` is an on/off grant with no cap on the number of add-ons, options or captured values. The numeric limits are store settings — the upload size — plus the rate limit on the two public reads.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- There is no bulk action on the add-on list; add-ons are created, edited and deleted one at a time.
- The add-on REST routes are registered whether or not `enable_addons` is on, but the two **public** read
  routes (`for-product`, `calculate-price`) now refuse with `addons_disabled` while the switch is off. The
  **admin** routes stay reachable on purpose — they are how the module is turned back on, and a switch that
  disabled its own off-switch could not be undone.
- The cleanup job's 7-day retention is a constant in the job, not a setting.

## Changed on 2026-09-13

This page previously recorded that **`allow_file_upload` hid the field without closing the route**, so a
request posted directly to `/addons/upload` was accepted with the setting off. The setting is now checked
in the route's permission callback, which refuses with `addon_upload_disabled` before any file is read or
stored — so it fails closed, and hiding the input is no longer the only thing standing between the
setting and an upload.

An earlier version of this page, published the same day, then recorded that the two public read routes kept
answering while `enable_addons` was off. They now refuse with `addons_disabled`, for the same reason: a
module's own switch should govern what the server answers, not only what the storefront draws. The admin
routes are deliberately exempt.
