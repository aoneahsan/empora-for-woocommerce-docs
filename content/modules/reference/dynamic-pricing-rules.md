---
id: dynamic-pricing-rules
title: "Dynamic Pricing Rules"
description: "Premium bulk and tiered pricing with per-product, category and role targeting, discount badges and a cached price calculation."
keywords:
  - woocommerce bulk pricing
  - tiered pricing
  - role based pricing
  - quantity discounts
format: md
---
## Overview

Dynamic Pricing Rules is the premium pricing engine, aimed at quantity-based pricing: buy more, pay less. A rule carries tiers, a discount type and a target — particular products, categories or customer roles, each in its own table — and the calculated price is cached so a catalogue page does not re-evaluate every rule for every product on every request.

Where the free [Dynamic Pricing](/modules/reference/dynamic-pricing) module spans product prices, cart discounts and free gifts, this one concentrates on the product price and does more with it: a discount badge with configurable text, the original price shown struck through, an explicit stacking choice, and a cache with a configurable lifetime.

It is for stores selling at volume, where price depends on quantity and on who is buying.

## Availability

| Item            | Value                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Module key      | `dynamic-pricing-rules`                                               |
| Tier            | Premium                                                               |
| Entitlement key | `dynamic-pricing-rules`                                               |
| Admin tab       | `pricing-rules`                                                       |
| Enabled option  | `aiowc_module_enabled_dynamic-pricing-rules` (off until turned on)    |
| REST namespace  | `aiowc/v1`                                                            |

Enabling the module creates the six tables below, seeds the defaults and schedules both jobs.

`registerHooks()` returns early twice: once when the licence does not grant `dynamic-pricing-rules`, and again when `enable_dynamic_pricing` is off — so switching that setting off takes the REST routes and every price filter out of the request entirely.

## Settings

Stored in the bundled option row `aiowc_dpr_settings`.

| Stored key               | Default          | Meaning                                                                   |
| ------------------------ | ---------------- | --------------------------------------------------------------------------- |
| `enable_dynamic_pricing` | `true`           | Master switch. Off means no hooks, no routes and no price changes.         |
| `show_discount_badge`    | `true`           | Whether a badge is shown on a discounted product.                          |
| `badge_text`             | `Save {amount}!` | The badge's text. `{amount}` is replaced with the saving.                  |
| `show_original_price`    | `true`           | Whether the undiscounted price is shown alongside the new one.             |
| `apply_to_sale_products` | `false`          | Whether products already on sale are discounted further. **Off by default.** |
| `stack_rules`            | `false`          | Whether several matching rules combine, or only the best one applies. **Off by default.** |
| `cache_duration`         | `3600`           | How long a calculated price is cached, in seconds — one hour.              |

The last three are passed into the price service when the module starts, so changing them changes how prices are calculated rather than only how they are displayed.

## Rules

| Field                    | Meaning                                                                |
| ------------------------ | ------------------------------------------------------------------------ |
| `rule_type`              | The kind of rule. Defaults to `bulk`.                                   |
| `discount_type`          | `percentage` or `fixed`. Defaults to percentage.                        |
| `discount_value`         | The amount, stored to four decimal places.                              |
| `tiers`                  | The quantity bands and what each one charges.                           |
| `priority`               | Which rule is preferred when several match.                             |
| `stack_rules`            | A per-rule override of the module-wide stacking setting.                |
| `apply_to_sale_products` | A per-rule override of the module-wide sale-item setting.               |
| `date_from`, `date_to`   | The window the rule is live in.                                         |
| `status`                 | Defaults to `active` — unlike the free module, a new rule here is live immediately. |

Targeting is relational rather than JSON: a rule's products, categories and roles each live in their own table, so a rule can name many of each and the match is a join rather than a decoded blob.

## How a price is chosen

Candidate rules are collected for the product, sorted by priority, and then either **the best one applies** or **all of them stack**, according to the stacking setting. The result is cached under a key derived from the product, the variation, the base price and the request context, so two customers in different roles do not share a cached price.

The cache is refreshed by a background job and can be invalidated directly. It is a time-based cache rather than an event-based one — see the limits below.

## Admin screen

The **Pricing Rules** tab lists the rules, creates and edits them with their tiers and targeting, and shows each rule's usage. The module's seven settings are edited from the same screen.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                          | Purpose                                             | Permission           | Required args |
| ------ | ----------------------------- | ----------------------------------------------------- | -------------------- | ------------- |
| GET    | `/pricing-rules`              | Every rule.                                          | `manage_woocommerce` | –             |
| POST   | `/pricing-rules`              | Create a rule.                                       | `manage_woocommerce` | –             |
| PUT    | `/pricing-rules/{id}`         | Update a rule.                                       | `manage_woocommerce` | `id`          |
| DELETE | `/pricing-rules/{id}`         | Delete a rule.                                       | `manage_woocommerce` | `id`          |
| GET    | `/pricing-rules/{id}/usage`   | How often the rule has applied.                      | `manage_woocommerce` | `id`          |
| POST   | `/pricing-rules/calculate`    | Price a product under the current rules.             | Public, rate-limited | `product_id`  |

`/calculate` is public and rate-limited so the product page can show a live tier price as the customer changes the quantity.

Unlike most modules here, the update route registers **only `PUT`** — not `PATCH` or `POST` — so a client that assumes `PATCH` will get a 404.

## WooCommerce integration

| Hook                                    | What the module does                                                 |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `woocommerce_product_get_price`         | Returns the rule-adjusted price for a product.                        |
| `woocommerce_product_variation_get_price`| The same for a variation.                                            |
| `woocommerce_before_calculate_totals`   | Applies the adjusted price to the cart lines.                         |
| `woocommerce_get_price_html`            | Renders the badge and the original price beside the new one.          |

A deliberately narrow surface compared with the free module: this one changes the price and how it reads, and leaves the cart and order display alone.

## Database schema

| Table                                      | Holds                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_dpr_pricing_rules`          | The rule: name, type, discount type and value, tiers, priority, its two overrides, date window, status. |
| `{prefix}aiowc_pricing_rule_conditions`    | Conditions on a rule: type, operator and value.                                            |
| `{prefix}aiowc_pricing_rule_products`      | The products a rule targets.                                                               |
| `{prefix}aiowc_pricing_rule_categories`    | The categories a rule targets.                                                             |
| `{prefix}aiowc_pricing_rule_roles`         | The customer roles a rule targets.                                                         |
| `{prefix}aiowc_pricing_rule_usage`         | One row per application: the rule, customer, order and amount discounted.                  |

The rules table carries a `dpr_` prefix because the plainer `aiowc_pricing_rules` belongs to the free [Dynamic Pricing](/modules/reference/dynamic-pricing) module. The two modules never share a row.

## Background jobs

| Hook                           | Interval | Work                                                     |
| ------------------------------ | -------- | ---------------------------------------------------------- |
| `aiowc_pricing_cache_refresh`  | hourly   | Rebuilds the calculated-price cache.                      |
| `aiowc_pricing_rules_cleanup`  | daily    | Prunes expired rules and old usage rows.                  |

Both run on WP-Cron, first scheduled an hour after the module is enabled.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

Unlike the free module, this one exposes **no** filter for adding a condition type or overriding stacking — those are settings rather than extension points.

## Entitlement limits

`dynamic-pricing-rules` is an on/off grant with no cap on the number of rules, tiers or targets.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two modules filter `woocommerce_product_get_price`** — this one and the free [Dynamic Pricing](/modules/reference/dynamic-pricing). With both enabled, both adjust the same price and neither knows about the other, so the result depends on filter order. A store should run one or the other.
- **The price cache is time-based, not event-based.** Editing a rule does not invalidate it, so a price change can take up to `cache_duration` — an hour by default — to appear. There is an invalidation method, but no admin control that calls it.
- The update route registers only `PUT`, where comparable modules also accept `PATCH` and `POST`. A client written against the others will not work here without changing the verb.
- There is no preview or test tool; the effect of a rule is confirmed by looking at a product.
- `badge_text` supports only the `{amount}` placeholder, so a badge cannot quote the quantity or the tier that produced the saving.
