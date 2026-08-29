---
id: size-guide
title: "Size Guide & Measurement"
description: "Show a size chart on the product page and suggest a size from the measurements a shopper enters, to cut returns caused by sizing."
keywords:
  - woocommerce size guide
  - size chart
  - fit recommendation
  - reduce returns
format: md
---
## Goal

Show a size chart on the product page and suggest a size from measurements the shopper enters, to cut
returns caused by sizing. Guides are assigned by product category, held in metric or imperial units, and
converted on read.

## Tier and entitlement

| Field           | Value        |
| --------------- | ------------ |
| Tier            | Premium      |
| Entitlement key | `size-guide` |
| Admin tab       | `size-guide` |
| Module key      | `size-guide` |
| Settings prefix | `aiowc_sg_`  |

Hooks register only when `aiowc_module_enabled_size-guide` is true and the licence permits the
`size-guide` entitlement.

## What the code does

- Size guides, each with a name, slug, category, unit system and active flag.
- Size charts belonging to a guide: the rows of measurements a shopper reads.
- A size recommendation: the shopper submits body measurements, `Service/RecommendationService.php`
  normalises them to the guide's unit system and scores each chart row, returning the closest match.
- Unit conversion between `metric` and `imperial` on both read and recommendation, so a guide authored in
  one system can be shown in the other.
- Recommendations are recorded against a user ID or a session ID, which is what the analytics endpoint
  reports on.
- The guide renders in the product summary, and anywhere through a shortcode.

## The admin screen is a static mock-up

The **Size Guide** tab renders a fixed heading, a **Create Size Guide**
button and a one-row table containing the literal values "Apparel (Standard)" and
"T-Shirts, Hoodies, Jackets", with an **Edit Table** button.

None of it is connected. The file contains no `onClick` handler, no effect, and no API call; there is no
`api/size-guide` client in the admin app at all. The row shown is not read from the database, and the
buttons do nothing. The module manifest records this as `admin page named inert by the August audit`.

The REST endpoints below are registered and functional — the storefront and any other client can use
them — but **guides cannot be created or edited from the plugin's admin screen in this release**.

## Settings

Stored together in one array option, `aiowc_sg_settings`, written on activation only when the option is
empty. All four are consulted.

| Setting                  | Default  | Meaning                                                                                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enable_size_guide`      | `true`   | Master switch for the product-page guide                                                                                         |
| `show_popup`             | `true`   | Whether the guide opens as a popup on the product page. Both this and `enable_size_guide` must be on for the product-page render |
| `enable_recommendations` | `true`   | Whether the measurement-based recommendation is offered                                                                          |
| `unit_system`            | `metric` | Default unit system for display                                                                                                  |

## Database schema

Created by `Schema/SizeGuideSchema.php` at schema version `1.0.0`.

| Table                                | Holds                                                     |
| ------------------------------------ | --------------------------------------------------------- |
| `{prefix}aiowc_size_guides`          | The guide: name, slug, category, unit system, active flag |
| `{prefix}aiowc_size_charts`          | Chart rows belonging to a guide                           |
| `{prefix}aiowc_size_recommendations` | Recommendations made, keyed by user or session            |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

| Method             | Path                          | Purpose                                                                        | Required args      | Permission               |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------ | ------------------ | ------------------------ |
| GET                | `/size-guides`                | List guides, filterable by `category_id`                                       | —                  | Rate-limited public read |
| GET                | `/size-guides/{id}`           | Read one guide and its charts, optionally converted to `unit_system`           | `id`               | Rate-limited public read |
| POST               | `/size-guides`                | Create a guide; also accepts `slug`, `category_id`, `unit_system`, `is_active` | `name`             | Manage                   |
| PUT / PATCH / POST | `/size-guides/{id}`           | Update a guide                                                                 | `id`               | Manage                   |
| DELETE             | `/size-guides/{id}`           | Delete a guide                                                                 | `id`               | Manage                   |
| POST               | `/size-guides/{id}/recommend` | Recommend a size from submitted measurements                                   | `id`, `product_id` | Public write check       |
| GET                | `/size-guides/analytics`      | Recommendation figures                                                         | —                  | Manage                   |

## WooCommerce integration

| Hook                                 | Priority | Effect                                            |
| ------------------------------------ | -------- | ------------------------------------------------- |
| `woocommerce_single_product_summary` | 25       | Renders the size guide for the product's category |

### Shortcode

| Shortcode            | Purpose              |
| -------------------- | -------------------- |
| `[aiowc_size_guide]` | Renders a size guide |

No block is registered, and the module hooks no order, cart or email action.

## Background jobs

| Hook                       | Schedule                               | Purpose                                       |
| -------------------------- | -------------------------------------- | --------------------------------------------- |
| `aiowc_size_guide_cleanup` | Daily, on the WordPress cron scheduler | Prunes recommendation rows older than 90 days |

The job's own comment notes that it wanted a monthly cadence; WordPress has no built-in `monthly`
schedule, so it runs daily and prunes by age instead. The 90-day window is a constant, not a setting.

## Entitlement limits

The `size-guide` entitlement gates the module as a whole. No cap on guides, charts or recommendations is
implemented beyond the 90-day cleanup.

## Related documentation

- [Module Architecture](/reference/architecture)
