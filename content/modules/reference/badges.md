---
id: badges
title: "Product Badges & Labels"
description: "Draw sale, new and out-of-stock labels over product images, by hand or from rules a background job re-evaluates against the catalogue."
keywords:
  - woocommerce product badges
  - sale labels
  - product ribbons
  - badge rules
format: md
---
## Overview

The Badges module draws a small label over a product image — "Sale", "New", "Out of stock" and anything else the store defines. A badge can be attached to a product by hand, or attached automatically by rules that a background job re-evaluates against the catalogue.

It is for stores that want to mark products in the shop loop and on the product page without editing a theme template.

## Availability

| Item            | Value                                               |
| --------------- | --------------------------------------------------- |
| Module key      | `badges`                                            |
| Tier            | Premium                                             |
| Entitlement key | `badges`                                            |
| Admin tab       | `badges`, under **Pricing & Promotions**            |
| Enabled option  | `aiowc_module_enabled_badges` (off until turned on) |
| REST namespace  | `aiowc/v1`                                          |

Enabling the module creates the three tables below, seeds the defaults and schedules the rule-evaluation job. Disabling it unschedules the job.

## Settings

Stored in the bundled option row `aiowc_bdg_settings`; legacy per-key options `aiowc_bdg_<key>` are migrated on first read.

| API name              | Stored key               | Default    | Meaning                                                           |
| --------------------- | ------------------------ | ---------- | ----------------------------------------------------------------- |
| `enableOnShop`        | `enable_on_shop`         | `true`     | Draw badges in the shop and category loops.                       |
| `enableOnSingle`      | `enable_on_single`       | `true`     | Draw badges on the single product page.                           |
| `maxBadgesPerProduct` | `max_badges_per_product` | `3`        | Upper bound on how many badges are drawn for one product.         |
| `defaultPosition`     | `default_position`       | `top_left` | Corner a badge takes when it has none of its own.                 |
| `newProductDays`      | `new_product_days`       | `30`       | Age below which the `new` rule condition treats a product as new. |

Both display settings are read once, when hooks are registered: turning `enableOnShop` or `enableOnSingle` off means the matching handler is never constructed on that request.

## Admin screen

The **Badges** tab is a placeholder. It renders a heading, an "Add Badge" button and a one-row table showing an example "Hot Sale" badge. None of the controls are wired to a request, and the page calls no endpoint — the badge, rule and assignment routes below are reachable only by calling the API directly.

## Badge records

A badge row carries its title, a type (`text` by default), the text to draw, background and text colour, font size, border radius, position, an optional image URL, optional inline SVG and an optional CSS class. Colours default to a red background with white text.

## Rules

A rule attaches a badge to whichever products match a condition. The rule engine understands eight condition types, and anything else evaluates to no match:

| Condition type | Matches on                                |
| -------------- | ----------------------------------------- |
| `on_sale`      | The product being on sale.                |
| `new`          | Publication date within `newProductDays`. |
| `featured`     | The WooCommerce featured flag.            |
| `stock_status` | Stock status.                             |
| `price_range`  | Price against the rule's value.           |
| `category`     | Product category.                         |
| `tag`          | Product tag.                              |
| `custom_field` | A named product meta value.               |

Each rule carries an operator and a priority alongside its condition type and value.

## REST API endpoints

All routes are on `aiowc/v1` and require `manage_woocommerce` — plus a REST nonce on cookie-authenticated requests — except the product read, which is open and rate limited to 120 requests a minute.

| Method             | Path                           | Purpose                                                            | Required args                |
| ------------------ | ------------------------------ | ------------------------------------------------------------------ | ---------------------------- |
| GET                | `/badges`                      | List badges.                                                       | –                            |
| POST               | `/badges`                      | Create a badge; accepts `title`, `type`, `text`, `position`.       | `title`                      |
| GET                | `/badges/{id}`                 | Read one badge.                                                    | `id`                         |
| PUT / PATCH / POST | `/badges/{id}`                 | Update a badge.                                                    | `id`                         |
| DELETE             | `/badges/{id}`                 | Delete a badge.                                                    | `id`                         |
| GET                | `/badges/overview`             | Counts for the admin overview.                                     | –                            |
| GET                | `/badges/settings`             | Read the settings above.                                           | –                            |
| PUT / PATCH / POST | `/badges/settings`             | Update the settings above.                                         | –                            |
| POST               | `/badges/{badge_id}/assign`    | Attach a badge to a product.                                       | `badge_id`, `product_id`     |
| POST               | `/badges/{badge_id}/unassign`  | Detach a badge from a product.                                     | `badge_id`, `product_id`     |
| GET                | `/badges/{badge_id}/rules`     | List the rules on a badge.                                         | `badge_id`                   |
| POST               | `/badges/{badge_id}/rules`     | Create a rule; accepts `condition_value`, `operator`, `priority`.  | `badge_id`, `condition_type` |
| PUT / PATCH / POST | `/badges/rules/{rule_id}`      | Update a rule.                                                     | `rule_id`                    |
| DELETE             | `/badges/rules/{rule_id}`      | Delete a rule.                                                     | `rule_id`                    |
| GET                | `/badges/product/{product_id}` | Badges currently applying to one product. Open read, rate limited. | `product_id`                 |

## WooCommerce integration

| Hook                                        | Priority | What the module does                                                               |
| ------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `woocommerce_before_shop_loop_item_title`   | 9        | Draws the product's badges in the loop (only when `enableOnShop` is on).           |
| `woocommerce_sale_flash`                    | 10       | Filters WooCommerce's own sale flash.                                              |
| `woocommerce_before_single_product_summary` | 9        | Draws the product's badges on the product page (only when `enableOnSingle` is on). |
| `wp_enqueue_scripts`                        | 10       | Enqueues the badge stylesheet.                                                     |
| `wp_head`                                   | 99       | Emits per-badge inline CSS.                                                        |

Frontend handlers are skipped entirely inside `wp-admin`.

## Database schema

| Table                             | Holds                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `{prefix}aiowc_badges`            | Badge definitions: text, colours, size, radius, position, image or SVG, class. |
| `{prefix}aiowc_badge_rules`       | Rules: condition type, value, operator and priority per badge.                 |
| `{prefix}aiowc_badge_assignments` | Direct badge-to-product attachments.                                           |

## Background jobs

| Hook                        | Interval | Group          | Work                                                                   |
| --------------------------- | -------- | -------------- | ---------------------------------------------------------------------- |
| `aiowc_badge_rule_evaluate` | 6 hours  | `aiowc-badges` | Re-evaluates every rule against the catalogue and updates assignments. |

## Entitlement limits

`badges` is an on/off grant. The licence carries no cap on the number of badges, rules or assignments; the only numeric limit is `maxBadgesPerProduct`, which is a store setting rather than a licence one.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
