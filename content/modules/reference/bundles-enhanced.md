---
id: bundles-enhanced
title: "Product Bundles (Enhanced)"
description: "A configurable bundle builder attached to a product, with rule-constrained configurations, dynamic or fixed pricing and a shortcode."
keywords:
  - woocommerce bundle builder
  - configurable bundles
  - dynamic bundle pricing
  - bundle rules
format: md
---
## Overview

Product Bundles (Enhanced) attaches a bundle to an existing WooCommerce product and lets the customer configure it before adding it to the cart. Pricing is either **dynamic** — the sum of what was chosen, with optional percentage discounts — or a **fixed** price for the whole bundle regardless of contents.

What separates it from the simpler [Product Bundles](/modules/reference/bundles) module is its rule table: a bundle carries rules that constrain what may be configured, evaluated by a builder service before the configuration is accepted.

The bundle can be placed with a shortcode as well as on the product page, so it does not have to live in the normal product template.

It is for stores where a bundle is configured rather than simply bought.

## Availability

| Item            | Value                                                            |
| --------------- | ------------------------------------------------------------------ |
| Module key      | `bundles-enhanced`                                                |
| Tier            | Premium                                                           |
| Entitlement key | `bundles-enhanced`                                                |
| Admin tab       | `bundles-enhanced`                                                |
| Enabled option  | `aiowc_module_enabled_bundles-enhanced` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                        |

Enabling the module creates the three tables below, seeds the defaults and schedules the inventory sync.

`registerHooks()` returns early twice: once when the licence does not grant `bundles-enhanced`, and again when `enable_bundles` is off — so switching that setting off takes the REST routes and every hook out of the request entirely. It also **reconciles the sync job on every request**: if `sync_inventory_hourly` is on the job is scheduled, and if it is off the job is unscheduled, so changing the setting takes effect without any further action.

## Settings

Stored in the bundled option row `aiowc_pb_settings`.

| Stored key              | Default | Meaning                                                                 |
| ----------------------- | ------- | ------------------------------------------------------------------------- |
| `enable_bundles`        | `true`  | Master switch. Off means no hooks, no routes and no bundle UI.           |
| `sync_inventory_hourly` | `true`  | Whether the hourly inventory sync runs. Reconciled on every request.     |

## Bundles

| Field                     | Meaning                                                                      |
| ------------------------- | ------------------------------------------------------------------------------ |
| `name`                    | What the bundle is called.                                                    |
| `product_id`              | The WooCommerce product the bundle is attached to.                            |
| `pricing_mode`            | `dynamic` (the default) or a fixed price.                                     |
| `fixed_price`             | The whole-bundle price, used when the pricing mode is fixed.                   |
| `discount_percent`        | A percentage off, applied in dynamic mode.                                    |
| `allow_variable_quantity` | Whether the customer may change item quantities. On by default.               |
| `track_inventory`         | Whether the bundle's availability is derived from component stock.            |
| `is_active`               | Whether the bundle is offered.                                                |

Each item names a product and optionally a variation, with a default, minimum and maximum quantity, an optional flag, its own discount percentage, and a sort order.

## Rules

A bundle may carry rules in its own table, each a rule type with a stored value. They are evaluated by the builder service when a configuration is submitted, so a configuration that breaks a rule is refused before it reaches the cart rather than being corrected afterwards.

## Admin screen

The **Bundles (Enhanced)** tab lists the bundles with paging, creates and edits them, and manages each bundle's items. Deletions are confirmed before they happen, and the list has explicit empty, pending and error states rather than a blank table while loading.

The module also adds a panel to the WooCommerce **product edit screen**, so a bundle can be configured from the product it belongs to.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                                  | Purpose                                                 | Permission           | Required args            |
| ------ | ------------------------------------- | --------------------------------------------------------- | -------------------- | ------------------------ |
| GET    | `/bundles-enhanced`                   | Every bundle.                                            | `manage_woocommerce` | –                        |
| POST   | `/bundles-enhanced`                   | Create a bundle.                                         | `manage_woocommerce` | `name`, `pricing_mode`   |
| GET    | `/bundles-enhanced/{id}`              | One bundle, with its items. Read by the storefront.      | Public, rate-limited | `id`                     |
| PATCH  | `/bundles-enhanced/{id}`              | Update a bundle.                                         | `manage_woocommerce` | –                        |
| DELETE | `/bundles-enhanced/{id}`              | Delete a bundle.                                         | `manage_woocommerce` | `id`                     |
| POST   | `/bundles-enhanced/{id}/configure`    | Price and validate a configuration without adding it.    | Nonce, rate-limited  | `id`, `selections`       |
| POST   | `/bundles-enhanced/add-to-cart`       | Add a configured bundle to the cart.                     | Nonce, rate-limited  | `bundle_id`, `selections`|

`/configure` is what lets the builder show a running price as the customer chooses, without committing anything to the cart.

## WooCommerce integration

| Hook                                          | What the module does                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `woocommerce_single_product_summary`          | Draws the bundle builder on the product page.                      |
| `woocommerce_add_to_cart_validation`          | Refuses a configuration that breaks the bundle's rules.            |
| `woocommerce_add_cart_item_data`              | Captures the configuration into the cart item.                     |
| `woocommerce_get_cart_item_from_session`      | Restores it when the cart is rebuilt from the session.             |
| `woocommerce_before_calculate_totals`         | Prices the bundle according to its pricing mode.                   |
| `woocommerce_get_item_data`                   | Lists the chosen contents under the cart line.                     |
| `woocommerce_checkout_create_order_line_item` | Writes the configuration onto the order line.                      |
| `woocommerce_product_data_tabs` / `_panels`   | Adds the bundle panel to the product edit screen.                  |

**Shortcode** `[aiowc_bundle]` renders a bundle builder anywhere on the site.

## Database schema

| Table                                | Holds                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_pb_bundles`           | The bundle: name, the product it is attached to, pricing mode, fixed price, discount percentage, quantity and inventory flags, active flag. |
| `{prefix}aiowc_pb_bundle_items`      | The contents: product and variation, default, minimum and maximum quantity, optional flag, per-item discount, sort order. |
| `{prefix}aiowc_bundle_rules`         | The constraints on a bundle: rule type and its stored value.                                                 |

The first two carry a `pb_` prefix because the plainer names belong to the separate [Product Bundles](/modules/reference/bundles) module. Each module owns its own tables and neither reads the other's.

## Background jobs

| Hook                            | Interval | Work                                                              |
| ------------------------------- | -------- | ------------------------------------------------------------------- |
| `aiowc_bundles_sync_inventory`  | hourly   | Brings bundle availability back in step with component stock.      |

The job runs on WP-Cron, and is scheduled or unscheduled to match `sync_inventory_hourly` on every request.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module exposes no filter for bundle pricing or for adding a rule type.

## Entitlement limits

`bundles-enhanced` is an on/off grant with no cap on the number of bundles, items or rules.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two bundle modules ship, and both can be on at once.** This one and [Product Bundles](/modules/reference/bundles) both hook the cart and both price bundles. Nothing detects that both are active, so a store should pick one.
- The rule types a bundle may carry are stored as free-form type-and-value rows with no filter for extending them, so a constraint the builder does not already implement cannot be added without modifying the module.
- `track_inventory` is a per-bundle flag but the sync runs for the module as a whole on a fixed hourly cycle, so availability can lag real stock by up to an hour.
- There is no duplicate action on a bundle, so a similar bundle is built from scratch.
