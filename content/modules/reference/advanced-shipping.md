---
id: advanced-shipping
title: "Advanced Shipping Rules"
description: "Conditional shipping rates as a WooCommerce shipping method — rules with conditions, six rate types, and five strategies for when several rules match one cart."
keywords:
  - woocommerce advanced shipping
  - conditional shipping rates
  - shipping rules engine
  - tiered shipping
format: md
---
## Overview

Advanced Shipping Rules adds a shipping method to WooCommerce whose rate is decided by rules rather than by a fixed table. A rule carries a set of conditions — cart total, weight, destination, customer role, the date — and a rate configuration saying what to charge when those conditions hold.

Several rules can match one cart. What happens then is a resolution strategy: take the highest-priority rule, take the cheapest, take the dearest, or stack them all together. A rule marked exclusive overrides that entirely — the highest-priority exclusive rule wins alone.

It is for stores whose postage cannot be expressed as a flat rate or a weight table.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `advanced_shipping`                                             |
| Tier            | Premium                                                         |
| Entitlement key | `advanced_shipping`                                             |
| Admin tab       | `advanced-shipping`                                             |
| Enabled option  | `aiowc_module_enabled_advanced_shipping` (off until turned on)  |
| REST namespace  | `aiowc/v1`                                                      |
| Shipping method | `aiowc_advanced_shipping`                                       |

Enabling the module creates the three tables below and schedules the cleanup job.

`registerHooks()` performs no licence check of its own. It does not need one: the module registry calls it only for modules that are both enabled and granted by the licence, so the entitlement gate is applied once, centrally, before any module registers anything.

## Settings

**This module has no settings row.** It declares no `SETTINGS_PREFIX` and no defaults, so there is nothing at `aiowc_as_settings` or any equivalent. Its configuration lives in two other places:

- **Each rule** is a database row, created and edited through the admin screen or the REST routes.
- **The shipping method instance** is configured per shipping zone in **WooCommerce → Settings → Shipping**, with four fields: the method title, tax status, a fallback rate used when no rule matches, and a read-only summary of the rules in play.

That means a store adds the method to a zone in WooCommerce's own screens, and writes the rules in Empora's.

## Rules

A rule has a status, a priority, a rate type and a set of conditions.

| Status      | Meaning                                                      |
| ----------- | -------------------------------------------------------------- |
| `active`    | Eligible to match.                                            |
| `draft`     | Saved, never matched.                                         |
| `scheduled` | Waiting for its start date.                                   |
| `expired`   | Past its end date. The cleanup job sets this.                 |

| Rate type    | Charges                                              |
| ------------ | ------------------------------------------------------ |
| `flat`       | A fixed amount.                                       |
| `percentage` | A percentage of the cart.                             |
| `per_item`   | An amount for each item.                              |
| `per_weight` | An amount for each unit of weight.                    |
| `tiered`     | An amount read from the rule's own tiers.             |
| `free`       | Nothing.                                              |

## Conditions

Conditions are grouped, and each group carries a match type so a rule can require all of its conditions or any of them.

Thirteen condition types are evaluated: `cart_total`, `cart_quantity`, `cart_weight`, `product_in_cart`, `category_in_cart`, `user_role`, `user_order_count`, `shipping_country`, `shipping_state`, `shipping_postcode`, `shipping_class`, `date_range` and `time_range`. Anything else is passed to the `aiowc_advanced_shipping_evaluate_condition` filter, so a store can add its own condition type without touching the module.

The operators are `=`, `!=`, `>`, `>=`, `<`, `<=`, `between`, `contains`, `not_contains`, `in`, `not_in` and `starts_with`. A guest is matched by `user_role` as a role in its own right, rather than being skipped.

## Resolving several matching rules

`ConflictResolver` applies one of five strategies, defaulting to highest priority:

| Strategy           | Result                                                     |
| ------------------ | ------------------------------------------------------------ |
| `highest_priority` | The rule with the best priority. **The default.**           |
| `first`            | The first match, in the order the rules came back.          |
| `lowest_rate`      | The cheapest computed rate; ties broken by priority.        |
| `highest_rate`     | The dearest computed rate; ties broken by priority.         |
| `stack_all`        | Every non-exclusive rule, added together.                   |

An exclusive rule short-circuits all of this: when any matching rule is marked exclusive, the highest-priority exclusive rule applies alone. Whether two rules may stack is also passed through the `aiowc_advanced_shipping_can_stack_rules` filter.

## Admin screen

The **Advanced Shipping** tab carries two tabs and a test tool.

- **Overview** counts the rules, the active ones and the calculations performed.
- **Rules** is the paged rule list — create, edit, duplicate and delete, plus a bulk action and per-rule statistics. A new rule is started by picking its rate type from a menu, so the form opens already shaped for a flat, percentage, per-item, per-weight, tiered or free rate.
- **Shipping Calculator Test** posts a sample cart — total, quantity, weight, country, state, postcode and zone — to `/shipping-rules/test` and shows what the rules would charge for it, without placing an order.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require `manage_woocommerce`.

| Method            | Path                            | Purpose                                                 | Required args   |
| ----------------- | ------------------------------- | --------------------------------------------------------- | --------------- |
| GET               | `/shipping-rules`               | Paged rule list; filter by `status` and `rate_type`.     | –               |
| POST              | `/shipping-rules`               | Create a rule, with conditions and tiers.                | `name`, `rate_config` |
| GET               | `/shipping-rules/{id}`          | One rule.                                                | `id`            |
| PATCH / PUT /POST | `/shipping-rules/{id}`          | Update a rule. All three verbs are registered.           | `id`            |
| DELETE            | `/shipping-rules/{id}`          | Delete a rule.                                           | `id`            |
| POST              | `/shipping-rules/{id}/duplicate`| Copy a rule.                                             | `id`            |
| GET               | `/shipping-rules/{id}/stats`    | How often the rule has applied.                          | `id`            |
| POST              | `/shipping-rules/bulk`          | Apply an action to several rules at once.                | `action`, `ids` |
| GET               | `/shipping-rules/overview`      | The counts shown on the overview tab.                    | –               |
| POST              | `/shipping-rules/test`          | Price a sample cart against the rules.                   | –               |

The three separate write verbs on `/shipping-rules/{id}` all reach the same update callback, so a client may use whichever it prefers.

## WooCommerce integration

| Hook                                             | What the module does                                                |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `woocommerce_shipping_init`                      | Loads the shipping method class.                                     |
| `woocommerce_shipping_methods`                   | Registers `aiowc_advanced_shipping` so it can be added to a zone.    |
| `woocommerce_cart_updated`                       | Re-evaluates the rules when the cart changes.                        |
| `woocommerce_checkout_create_order_shipping_item`| Records which rule produced the rate on the order.                   |
| `woocommerce_checkout_order_processed`           | Writes the usage row the statistics are counted from.                |
| `woocommerce_admin_order_item_headers`           | Adds the rule column to the order screen's shipping items.           |
| `woocommerce_update_options_shipping_*`          | Saves the method's instance settings.                                |

## Database schema

| Table                                    | Holds                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_advanced_shipping_rules`  | The rule: name, slug, description, status, priority, its conditions and rate configuration, exclusivity, fallback rate, start and end dates, the zones it applies to. |
| `{prefix}aiowc_shipping_rate_tiers`      | The tiers belonging to a tiered rule.                                                                             |
| `{prefix}aiowc_shipping_rule_usage`      | One row per time a rule produced a rate, which is what the per-rule statistics count.                             |

The rules table is named `aiowc_advanced_shipping_rules` rather than `aiowc_shipping_rules`, because the plainer name belongs to the separate [Conditional Shipping Rules](/modules/reference/shipping-rules) module. Each module owns its own tables; neither reads the other's.

## Background jobs

| Hook                                | Schedule        | Work                                                                          |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `aiowc_advanced_shipping_cleanup`   | daily, from 1am | Marks rules past their end date as expired, deletes usage rows older than the retention window, and clears stale rate caches. |

This job runs on **Action Scheduler**, not WP-Cron, and is scheduled into the `aiowc-advanced-shipping` group. When Action Scheduler is unavailable the scheduling call returns without doing anything, so the job simply does not run — nothing errors.

Usage rows are kept for **365 days** by default, filterable through `aiowc_advanced_shipping_usage_retention_days`.

## Action hooks for integrators

| Hook                                          | Purpose                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `aiowc_advanced_shipping_evaluate_condition`  | Filter — evaluate a condition type the module does not know.            |
| `aiowc_advanced_shipping_can_stack_rules`     | Filter — decide whether two matching rules may be added together.       |
| `aiowc_advanced_shipping_usage_retention_days`| Filter — how long usage rows are kept.                                  |
| `aiowc_track_event`                           | The module is enabled or disabled.                                      |
| `aiowc_capture_error`                         | An error is caught during rule evaluation.                              |

## Entitlement limits

`advanced_shipping` is an on/off grant with no cap on the number of rules, tiers or usage rows.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **The resolution strategy is not exposed as a setting.** `ConflictResolver` accepts one and defaults to highest priority, but with no settings row there is no stored value and no admin control for it — changing it means calling the resolver from code.
- The rate cache is cleared on a schedule rather than on a rule edit, so a rate may be served from cache until the daily job runs.
- The cleanup job depends on Action Scheduler, which WooCommerce ships; on a site where it is absent the job never runs and expired rules are never marked, with no warning raised by the health check.
