---
id: shipping-rules
title: "Conditional Shipping Rules"
description: "Show, hide or re-cost the shipping rates WooCommerce already produced, using rules with conditions on cart, destination, customer and coupons."
keywords:
  - woocommerce conditional shipping
  - hide shipping method
  - shipping rules
  - free shipping rule
format: md
---
## Overview

Conditional Shipping Rules does not create a shipping method. It edits the rates WooCommerce has already produced: hiding a method when the cart does not qualify for it, revealing one that is normally hidden, overriding a cost, adding to it, or making it free.

Because it filters `woocommerce_package_rates`, it works with whatever methods the store already has — flat rate, free shipping, a carrier plugin — rather than replacing them. A rule names an action, an optional target method, a cost, a priority and the conditions under which it fires.

It is for stores whose methods are correct but whose availability depends on the cart.

## Availability

| Item            | Value                                                        |
| --------------- | -------------------------------------------------------------- |
| Module key      | `shipping-rules`                                              |
| Tier            | Premium                                                       |
| Entitlement key | `shipping-rules`                                              |
| Admin tab       | `shipping-rules`                                              |
| Enabled option  | `aiowc_module_enabled_shipping-rules` (off until turned on)   |
| REST namespace  | `aiowc/v1`                                                    |

Enabling the module creates the three tables below, seeds the defaults and schedules the cache refresh job.

`registerHooks()` returns early when the licence does not grant `shipping-rules`. The REST routes register next, and the rate filter registers only when `enable_filter` is on — so switching that setting off stops the module touching checkout while leaving its screens and routes working.

## Settings

Stored in the bundled option row `aiowc_as_settings`.

| Stored key                   | Default  | Meaning                                                                       |
| ---------------------------- | -------- | ------------------------------------------------------------------------------- |
| `enable_filter`              | `true`   | Whether the rules are applied to checkout rates at all.                        |
| `dimensional_weight_enabled` | `false`  | Whether a dimensional weight is computed and made available as a condition.    |
| `dimensional_weight_factor`  | `5000.0` | The divisor used for that calculation.                                         |
| `free_shipping_threshold`    | `0.0`    | A cart total above which shipping is free. Zero means no threshold.            |

## Rules

A rule carries one action:

| Action     | Effect on the rates WooCommerce produced                |
| ---------- | --------------------------------------------------------- |
| `show`     | Reveals the target method.                               |
| `hide`     | Removes the target method from checkout.                 |
| `set_cost` | Replaces the method's cost with the rule's cost.         |
| `add_cost` | Adds the rule's cost to the method's own.                |
| `free`     | Sets the cost to zero.                                   |
| `disable`  | Turns the rule off without deleting it.                  |

Rules are ordered by priority, and each may be scoped to a custom zone defined by this module rather than to a WooCommerce zone.

## Conditions

Conditions are stored per rule and evaluated with the operators `>=`, `<=`, `=`, `!=`, `in`, `not_in` and `between`.

| Condition kind | Types                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| Numeric        | `cart_total`, `weight`, `item_count`, `dimensional_weight`               |
| String         | `country`, `state`, `postcode`                                           |
| List           | `category`, `product`, `user_role`, `coupon_applied`                     |

`dimensional_weight` is only meaningful when `dimensional_weight_enabled` is on; with it off the value is not computed.

## Custom zones

The module keeps its own zone table, so a rule can target a set of countries, states and postcodes that does not correspond to any WooCommerce shipping zone. A zone has a name, its country/state/postcode lists, a priority and an active flag.

## Admin screen

This module has **two** administrator surfaces, and they are not the same screen.

- **Shipping Rules** in the Empora admin is the React screen reached from the module's own tab.
- A separate top-level **Shipping Rules** menu item is registered in WordPress's own admin by the module's PHP admin handler, with an airplane icon at menu position 58. It renders a plain rules table and a create form, saving through `admin_post_aiowc_as_save_rule` and deleting through `admin_post_aiowc_as_delete_rule`, both behind a nonce and a `manage_woocommerce` capability check.

Both read and write the same rules table, so a rule created in one appears in the other.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require `manage_woocommerce`.

| Method            | Path                       | Purpose                                              | Required args |
| ----------------- | -------------------------- | ------------------------------------------------------ | ------------- |
| GET               | `/shipping/rules`          | Every rule.                                           | –             |
| POST              | `/shipping/rules`          | Create a rule.                                        | `name`        |
| PATCH / PUT /POST | `/shipping/rules/{id}`     | Update a rule. All three verbs are registered.        | `id`          |
| DELETE            | `/shipping/rules/{id}`     | Delete a rule.                                        | `id`          |
| GET               | `/shipping/zones`          | Every custom zone.                                    | –             |
| POST              | `/shipping/zones`          | Create a custom zone.                                 | `name`        |
| PATCH / PUT /POST | `/shipping/zones/{id}`     | Update a custom zone.                                 | `id`          |
| DELETE            | `/shipping/zones/{id}`     | Delete a custom zone.                                 | `id`          |
| POST              | `/shipping/calculate`      | Evaluate the rules against a supplied cart context.   | –             |

These sit under `/shipping/`, while the separate [Advanced Shipping Rules](/modules/reference/advanced-shipping) module owns `/shipping-rules/`. The two prefixes are deliberately distinct so neither module shadows the other's routes.

## WooCommerce integration

| Hook                       | What the module does                                                               |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `woocommerce_package_rates`| Applies the matching rules to the rates WooCommerce produced — the whole feature.  |
| `admin_menu`               | Registers the standalone WordPress admin page.                                      |
| `admin_post_aiowc_as_save_rule` / `_delete_rule` | Handles that page's form submissions.                          |

## Database schema

| Table                                 | Holds                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_shipping_rules`        | The rule: name, action, target method id, cost, priority, active flag, and the zone it applies to. |
| `{prefix}aiowc_shipping_conditions`   | One row per condition on a rule: type, operator, value, sort order.                             |
| `{prefix}aiowc_shipping_zones_custom` | The module's own zones: name, countries, states, postcodes, priority, active flag.              |

## Background jobs

| Hook                             | Interval | Work                                                    |
| -------------------------------- | -------- | --------------------------------------------------------- |
| `aiowc_shipping_cache_refresh`   | hourly   | Rebuilds the cached rule set the rate filter reads from. |

This job runs on WP-Cron, scheduled an hour after the module is enabled.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module exposes no filter for adding a condition type of your own.

## Entitlement limits

`shipping-rules` is an on/off grant with no cap on the number of rules, conditions or zones.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two admin surfaces exist for one module** — the Empora tab and a separate top-level WordPress menu — with no cross-link between them, so an administrator can easily find one and never learn the other exists.
- The settings prefix is `aiowc_as_`, which reads as "advanced shipping" rather than as this module. Nothing collides today because the [Advanced Shipping Rules](/modules/reference/advanced-shipping) module stores no settings at all, but the name is a poor fit and would collide if that module ever gained a settings row under the obvious prefix.
- `free_shipping_threshold` is stored as a setting rather than expressed as a rule, so it is configured in a different place from every other condition.
- There is no condition filter, so a store cannot add its own condition type without modifying the module.
