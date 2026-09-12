---
id: dynamic-pricing
title: "Dynamic Pricing"
description: "The free core pricing engine — product price rules, cart discounts and automatic free gifts, with conditions, usage limits and exclusivity."
keywords:
  - woocommerce dynamic pricing
  - cart discount rules
  - free gift rule
  - automatic discounts
format: md
---
## Overview

Dynamic Pricing is one of the seven modules in the free core. It applies rules that change what a customer pays, in three distinct ways: adjusting a **product's price**, applying a **cart-level discount**, or adding a **free gift** to the cart when the rule's conditions are met.

The three are genuinely different mechanisms. A product-price rule filters WooCommerce's price getters, so the new price appears everywhere a price is shown — the shop loop, the product page, variation prices, the cart line. A cart discount is a negative fee on the cart totals. A gift rule puts a product in the cart and keeps it there on the module's terms, not the customer's.

It is the free core's pricing engine, and it is available on every plan.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `dynamic_pricing`                                               |
| Tier            | **Free** — part of the free core                                |
| Entitlement key | `dynamic_pricing`                                               |
| Admin tab       | `dynamic-pricing`                                               |
| Enabled option  | `aiowc_module_enabled_dynamic_pricing` (off until turned on)    |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the two tables below and schedules the cleanup job.

`registerHooks()` performs no licence check of its own and reads no enable setting — it registers the REST routes, the three appliers, the frontend handlers and the job listener unconditionally. Being free-tier, the entitlement gate grants it on every plan anyway.

## Settings

**This module has no settings row.** It declares no settings prefix and no defaults. Everything is expressed per rule, which is why the rule row carries its own exclusivity, sale-item and usage-limit fields rather than reading them from a shared setting.

## Rule types

| `rule_type`      | What it does                                                                        |
| ---------------- | ------------------------------------------------------------------------------------- |
| `product_price`  | Changes a product's price, through WooCommerce's price filters.                      |
| `cart_discount`  | Applies a discount to the cart as a negative fee.                                    |
| `free_gift`      | Adds a product to the cart at no charge when the conditions hold.                    |

| `discount_type`   | Meaning                                                    |
| ----------------- | ------------------------------------------------------------ |
| `percentage`      | A percentage off.                                           |
| `fixed`           | A fixed amount off.                                         |
| `fixed_product`   | A fixed price for the product, rather than an amount off.   |

A rule's status is `active`, `draft`, `scheduled` or `expired`, and the cleanup job moves rules past their end date to expired.

## Rules

| Field                   | Meaning                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `conditions`            | When the rule applies, stored as JSON.                                      |
| `discount_config`       | What it does when it applies, stored as JSON.                               |
| `priority`              | Which rule wins when several match.                                         |
| `start_date`, `end_date`| The window the rule is live in.                                             |
| `usage_limit`           | How many times the rule may be used in total.                               |
| `usage_limit_per_user`  | How many times one customer may use it.                                     |
| `is_exclusive`          | When set, this rule applies alone and no other stacks with it.              |
| `exclude_sale_items`    | Leaves products already on sale alone.                                      |
| `created_by`            | The administrator who created the rule.                                     |

Every application is recorded in the usage table with the rule, order, customer and the amount discounted, which is both how the limits are enforced and what the per-rule statistics count.

## Free gifts

A gift rule adds its product to the cart. The module owns that line: it overrides the line's price, name, quantity control and remove link, and reacts when the customer removes it or when the cart changes such that the rule no longer applies. That is why the module hooks so much of the cart item display — a gift the customer could re-price or keep after qualifying would not be a gift.

## Conflicts between rules

Several rules can match one product or cart. An exclusive rule wins alone; otherwise stacking is decided by the module's conflict resolver, and whether two particular rules may stack is passed through the `aiowc_dynamic_pricing_can_stack_rules` filter. A condition type the module does not recognise is passed to `aiowc_dynamic_pricing_evaluate_condition`, so a store can add its own without modifying the module.

## Admin screen

The **Dynamic Pricing** tab lists the rules with an overview of how many exist and how often they have applied, creates and edits them, duplicates one, deletes in bulk, and shows per-rule statistics. A **preview** endpoint prices a hypothetical rule before it is saved.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require `manage_woocommerce`.

| Method            | Path                                   | Purpose                                          | Required args      |
| ----------------- | -------------------------------------- | -------------------------------------------------- | ------------------ |
| GET               | `/dynamic-pricing/rules`               | Every rule.                                       | –                  |
| POST              | `/dynamic-pricing/rules`               | Create a rule.                                    | `name`, `rule_type`|
| GET               | `/dynamic-pricing/rules/{id}`          | One rule.                                         | `id`               |
| PATCH / PUT /POST | `/dynamic-pricing/rules/{id}`          | Update a rule. All three verbs are registered.    | `id`               |
| DELETE            | `/dynamic-pricing/rules/{id}`          | Delete a rule.                                    | `id`               |
| POST              | `/dynamic-pricing/rules/{id}/duplicate`| Copy a rule.                                      | `id`               |
| GET               | `/dynamic-pricing/rules/{id}/stats`    | How often the rule has applied, and for how much. | `id`               |
| POST              | `/dynamic-pricing/bulk`                | Apply an action to several rules at once.         | `action`, `ids`    |
| GET               | `/dynamic-pricing/overview`            | The counts shown on the overview.                 | –                  |
| POST              | `/dynamic-pricing/preview`             | Price a rule without saving it.                   | `rule_type`        |

Every route is administrator-only; the storefront gets its prices through WooCommerce's filters rather than by calling the API.

## WooCommerce integration

This module has the broadest hook surface of any pricing module, because changing a price convincingly means changing it everywhere it is displayed.

| Area                | Hooks                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Product price       | `woocommerce_product_get_price`, `_get_regular_price`, `_get_sale_price`, `_is_on_sale`, and the three matching `product_variation_get_*` filters, plus `woocommerce_variation_prices_price` |
| Price display       | `woocommerce_get_price_html`, `woocommerce_after_shop_loop_item_title`, `woocommerce_single_product_summary`  |
| Cart totals         | `woocommerce_before_calculate_totals`, `woocommerce_cart_calculate_fees`, `woocommerce_cart_totals_before_order_total`, `woocommerce_review_order_before_order_total` |
| Cart lines          | `woocommerce_cart_item_price`, `_subtotal`, `_name`, `_quantity`, `_remove_link`, `_removed`                 |
| Cart lifecycle      | `woocommerce_add_to_cart`, `woocommerce_cart_updated`, `woocommerce_cart_loaded_from_session`                 |
| Coupons             | `woocommerce_applied_coupon`, `woocommerce_removed_coupon` — so a rule can react to a coupon being used       |
| Order               | `woocommerce_checkout_create_order`, `woocommerce_checkout_order_processed`, `woocommerce_order_status_completed` — recording usage |
| Order display       | `woocommerce_order_details_after_order_table`, `woocommerce_admin_order_data_after_billing_address`           |

## Database schema

| Table                          | Holds                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_pricing_rules`  | The rule: name, slug, description, type, status, priority, conditions and discount configuration as JSON, date window, usage limits and count, exclusivity, sale-item exclusion, creator. |
| `{prefix}aiowc_rule_usage`     | One row per application: the rule, order, customer and amount discounted.                                           |

`aiowc_pricing_rules` is this module's table. The premium [Dynamic Pricing Rules](/modules/reference/dynamic-pricing-rules) module keeps its own under a `dpr_` prefix, so the free and premium modules never share a row.

## Background jobs

| Hook                              | Work                                                                    |
| --------------------------------- | ------------------------------------------------------------------------- |
| `aiowc_dynamic_pricing_cleanup`   | Marks rules past their end date as expired and prunes old usage rows.    |

The job runs on Action Scheduler.

## Action hooks for integrators

| Hook                                          | Purpose                                                          |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `aiowc_dynamic_pricing_evaluate_condition`    | Filter — evaluate a condition type the module does not know.      |
| `aiowc_dynamic_pricing_can_stack_rules`       | Filter — decide whether two matching rules may be combined.       |
| `aiowc_track_event`                           | The module is enabled or disabled.                                |
| `aiowc_capture_error`                         | An error is caught while evaluating or applying a rule.           |

## Entitlement limits

`dynamic_pricing` is granted on every plan including the free one, with no cap on the number of rules. The usage limits are per-rule settings, not licence limits.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two modules filter `woocommerce_product_get_price`** — this one and the premium [Dynamic Pricing Rules](/modules/reference/dynamic-pricing-rules). With both enabled, both adjust the same price and neither knows about the other, so the resulting price depends on filter order rather than on either module's conflict resolution. A store should run one or the other.
- With no settings row there is no storefront kill switch: the module is either on with all of its hooks, or disabled entirely.
- Rules are expired by a background job rather than checked at read time, so a rule can apply briefly past its end date until the job next runs.
- The preview endpoint prices a rule in isolation; it does not show how the rule would interact with the others already active.
