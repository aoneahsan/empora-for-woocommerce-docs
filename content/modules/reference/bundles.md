---
id: bundles
title: "Product Bundles"
description: "Sell several products as one purchase — fixed kits or mix-and-match sets — with percentage, fixed or per-item discounts and grouped cart handling."
keywords:
  - woocommerce product bundles
  - mix and match
  - product kits
  - bundle discount
format: md
---
## Overview

Product Bundles sells several products as one purchase. A bundle is either **fixed** — a set list of products the customer buys together — or **mix-and-match**, where the customer chooses from a pool up to a quantity the bundle sets.

The discount is expressed on the bundle: a percentage off, a fixed amount off, or a per-item reduction. Bundle contents are re-priced whenever the cart totals are calculated, so the saving follows the products rather than being written once.

The cart treats a bundle as a group: the child lines are tied to their parent, removing the parent removes the children, and the bundle's own quantity control governs the whole group.

It is for stores selling kits, hampers and build-your-own sets.

## Availability

| Item            | Value                                                   |
| --------------- | --------------------------------------------------------- |
| Module key      | `bundles`                                                |
| Tier            | Premium                                                  |
| Entitlement key | `bundles`                                                |
| Admin tab       | `bundles`                                                |
| Enabled option  | `aiowc_module_enabled_bundles` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                               |

Enabling the module creates the three tables below, seeds the defaults and schedules the inventory sync.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored in the bundled option row `aiowc_bun_settings`.

| Stored key                | Default      | Meaning                                                                   |
| ------------------------- | ------------ | --------------------------------------------------------------------------- |
| `enable_quantity_editing` | `true`       | Whether the customer may change item quantities inside a bundle.           |
| `default_pricing_type`    | `per_item`   | The discount type a new bundle starts with.                                |
| `show_savings`            | `true`       | Whether the saving is shown against the bundle price.                      |
| `min_discount_display`    | `5`          | The smallest saving worth displaying; below this the saving is not shown.  |

## Bundles

| Field                         | Meaning                                                            |
| ----------------------------- | -------------------------------------------------------------------- |
| `title`, `slug`, `description`| What the bundle is called and how it is described.                  |
| `bundle_type`                 | `fixed` or `mix_match`.                                             |
| `discount_type`               | `percentage`, `fixed` or `per_item`.                                |
| `discount_value`              | The amount applied, read according to the discount type.            |
| `min_quantity`, `max_quantity`| For a mix-and-match bundle, how many items must and may be chosen. `0` means no maximum. |
| `is_active`                   | Whether the bundle is offered.                                      |

Each bundle item names a product, optionally a variation, a default quantity, its own minimum and maximum, an optional per-item discount override, and whether the item is **optional** — an optional item may be left out of the bundle by the customer.

For a mix-and-match bundle, the pool of products the customer may choose from is kept in its own table, separate from the fixed item list.

## Stock

A bundle's availability is derived from its contents: the module carries a stock service that resolves what can actually be built from the components, and a background job keeps that in step with product stock. `woocommerce_check_cart_items` re-checks the cart, so a bundle whose component ran out after being added is caught before payment.

## Admin screen

The **Bundles** tab lists the bundles and creates, edits and deletes them through a validated form — a bundle needs a name, and the discount is checked as a number within sane bounds, with the reason shown inline when it is not. Bundle items are managed per bundle, and the module's four settings are edited from the same screen.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. Every route requires `manage_woocommerce` except the cart route.

| Method            | Path                        | Purpose                                                |
| ----------------- | --------------------------- | -------------------------------------------------------- |
| GET               | `/bundles`                  | Every bundle.                                           |
| POST              | `/bundles`                  | Create a bundle.                                        |
| GET               | `/bundles/{id}`             | One bundle, with its items.                             |
| PATCH / PUT /POST | `/bundles/{id}`             | Update a bundle. All three verbs are registered.        |
| DELETE            | `/bundles/{id}`             | Delete a bundle.                                        |
| POST              | `/bundles/{id}/items`       | Add an item to a bundle.                                |
| PATCH / PUT /POST | `/bundles/items/{id}`       | Update a bundle item.                                   |
| DELETE            | `/bundles/items/{id}`       | Remove a bundle item.                                   |
| GET / POST        | `/bundles/settings`         | Read and write the module's settings.                   |
| POST              | `/bundles/{id}/cart`        | Add a configured bundle to the cart. Nonce, rate-limited. |

## WooCommerce integration

| Hook                                          | What the module does                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `woocommerce_before_add_to_cart_form` / `_after_add_to_cart_form` | Draws the bundle builder around the add-to-cart form. |
| `woocommerce_before_calculate_totals`         | Applies the bundle discount to the grouped lines.                         |
| `woocommerce_get_price_html`                  | Shows the bundle price, and the saving where it clears `min_discount_display`. |
| `woocommerce_before_shop_loop_item_title`     | Marks bundles in the shop listing.                                        |
| `woocommerce_cart_item_class`                 | Styles the parent and child lines as one group.                           |
| `woocommerce_cart_item_quantity`              | Gives the group one quantity control, honouring `enable_quantity_editing`. |
| `woocommerce_cart_item_remove_link` / `_removed` | Removes the whole bundle when the parent line is removed.              |
| `woocommerce_check_cart_items`                | Re-checks that the bundle can still be built from available stock.        |
| `woocommerce_get_item_data`                   | Lists the bundle contents under the cart line.                            |
| `woocommerce_checkout_create_order_line_item` | Writes the bundle structure onto the order.                               |
| `woocommerce_order_item_name`, `_display_meta_key`, `_hidden_order_itemmeta`, `_after_order_itemmeta` | Presents the bundle on the order without exposing its internal meta keys. |

## Database schema

| Table                             | Holds                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_bundles`           | The bundle: title, slug, description, discount type and value, minimum and maximum quantity, bundle type, active flag. |
| `{prefix}aiowc_bundle_items`      | The contents: product and variation, default, minimum and maximum quantity, discount override, optional flag, sort order. |
| `{prefix}aiowc_bundle_products`   | The pool a mix-and-match bundle draws from.                                                                |

These names are this module's. The separate [Product Bundles (Enhanced)](/modules/reference/bundles-enhanced) module keeps its own tables under a different prefix, so the two never share a row.

## Background jobs

| Hook                            | Interval | Work                                                                |
| ------------------------------- | -------- | --------------------------------------------------------------------- |
| `aiowc_bundle_inventory_sync`   | 6 hours  | Brings each bundle's availability back in step with component stock. |

The job runs on Action Scheduler.

## Action hooks for integrators

| Hook                                        | Fired when                                     |
| ------------------------------------------- | ------------------------------------------------ |
| `aiowc_track_event`                         | The module is enabled or disabled.              |
| `aiowc_capture_error`                       | An error is caught while pricing or building.   |

The module exposes no filter for overriding bundle pricing.

## Entitlement limits

`bundles` is an on/off grant with no cap on the number of bundles or items.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two bundle modules ship, and both can be on at once.** This one and [Product Bundles (Enhanced)](/modules/reference/bundles-enhanced) both hook the cart and both price bundles, with separate tables and separate admin screens. Nothing detects that both are active or reconciles their behaviour, so a store should pick one.
- Bundle availability is refreshed on a six-hour cycle rather than when component stock changes, so a bundle can show as available for up to six hours after its components ran out. The cart re-check is what actually prevents an oversell.
- There is no filter for bundle pricing, so a discount the three types cannot express requires modifying the module.
- Deleting a bundle does not affect orders already placed, which keep their own copy of the bundle structure.
