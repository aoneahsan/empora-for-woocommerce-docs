---
id: popups
title: "Popups & Exit-Intent Builder"
description: "Show targeted overlays with their own content, triggers and targeting rules, and measure impressions and conversions for each one."
keywords:
  - woocommerce popups
  - exit intent
  - popup targeting
  - conversion tracking
format: md
---
## Goal

Show a targeted overlay on the storefront and measure whether it worked. Popups are stored as records
with their own content, design, trigger set and targeting rules; the storefront asks the plugin which
popups apply to the current page and renders them. Displays and conversions are logged, and two variants
of the same popup can be run against each other.

## Tier and entitlement

| Field           | Value        |
| --------------- | ------------ |
| Tier            | Premium      |
| Entitlement key | `popups`     |
| Admin tab       | `popups`     |
| Module key      | `popups`     |
| Settings prefix | `aiowc_pop_` |

Hooks register only when `aiowc_module_enabled_popups` is true and the licence permits the `popups`
entitlement.

## What the code does

- Popup records with a name, type, content, design payload, trigger list, targeting rules and a status
  that defaults to `draft`.
- Six trigger types, whitelisted in `Service/TriggerService.php`: `exit_intent`, `time_delay`,
  `scroll_depth`, `click`, `page_load` and `inactivity`. Each trigger may carry an integer value —
  seconds for a delay or an inactivity window, a percentage for scroll depth.
- Targeting evaluated server-side in `Service/TargetingService.php` against five rule groups: page URL
  fragments, product or post categories, device, user role, and excluded paths. Exclusions are applied
  before inclusions, so an excluded path always wins.
- Cart and checkout suppression: when `disable_on_cart_checkout` is on, any URL containing `/cart` or
  `/checkout` short-circuits before the rules are read.
- Display and conversion logging against a caller-supplied session ID.
- A/B tests: variants attached to a popup, with a daily job that picks a winner using a
  normal-approximation z-test for proportions at a confidence threshold of 0.95, and ends the losing
  variants.

## Settings

Read through `ModuleSettings` with the `aiowc_pop_` prefix; defaults are `PopupsModule::DEFAULTS`.

| Setting                    | Default | Meaning                                             |
| -------------------------- | ------- | --------------------------------------------------- |
| `enable_popups`            | `true`  | Master switch for storefront rendering              |
| `disable_on_cart_checkout` | `true`  | Suppresses every popup on cart and checkout URLs    |
| `enable_mobile_popups`     | `true`  | Whether popups are eligible on mobile devices       |
| `frequency_days`           | `7`     | Days before the same visitor is shown a popup again |
| `max_popups_per_session`   | `1`     | Cap on popups shown in one visitor session          |

## Admin screen

Admin tab `popups`. The screen manages the
popup list and the builder — content, design, triggers and targeting rules — and reads the per-popup
analytics endpoint.

## Database schema

Created by `Schema/PopupsSchema.php` at schema version `1.0.0`.

| Table                             | Holds                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_popups`            | The popup itself: `name`, `popup_type`, `content`, `design`, `triggers`, `rules`, `status` |
| `{prefix}aiowc_popup_displays`    | One row per display, used for impression counts                                            |
| `{prefix}aiowc_popup_conversions` | One row per conversion, with a type and an optional data payload                           |
| `{prefix}aiowc_popup_ab_tests`    | Variants belonging to a popup, with their end timestamp                                    |

`content`, `design`, `triggers` and `rules` are stored as JSON text.

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

### Management

Permission: manage.

| Method             | Path                     | Purpose                                                         | Required args        |
| ------------------ | ------------------------ | --------------------------------------------------------------- | -------------------- |
| GET                | `/popups`                | List popups, filterable by `status` and `popup_type`, paginated | —                    |
| POST               | `/popups`                | Create a popup                                                  | —                    |
| GET                | `/popups/{id}`           | Read one popup                                                  | `id`                 |
| PUT / PATCH / POST | `/popups/{id}`           | Update a popup                                                  | `id`                 |
| DELETE             | `/popups/{id}`           | Delete a popup                                                  | `id`                 |
| POST               | `/popups/{id}/ab-test`   | Add an A/B variant                                              | `id`, `variant_name` |
| GET                | `/popups/{id}/analytics` | Impressions, conversions and variant figures                    | `id`                 |

### Storefront

| Method | Path                   | Purpose                                                   | Required args                         | Permission               |
| ------ | ---------------------- | --------------------------------------------------------- | ------------------------------------- | ------------------------ |
| GET    | `/popups/active`       | Popups matching the current `url`, `post_id` and `device` | —                                     | Rate-limited public read |
| POST   | `/popups/{id}/display` | Log a display                                             | `id`, `session_id`                    | Public write check       |
| POST   | `/popups/{id}/convert` | Log a conversion                                          | `id`, `session_id`, `conversion_type` | Public write check       |

## WordPress and WooCommerce integration

| Hook                 | Effect                                               |
| -------------------- | ---------------------------------------------------- |
| `wp_enqueue_scripts` | Loads the popup assets                               |
| `wp_footer`          | Prints the bootstrap payload the client script reads |

The module does not hook any WooCommerce order, product or email action, and registers no shortcode and
no block. Its only WooCommerce-specific behaviour is the cart and checkout URL suppression above.

### Emitted action

| Action                         | Fired when                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `aiowc_popup_ab_winner_picked` | The daily job selects a winning variant; receives the popup ID and the winning variant ID |

## Background jobs

Both run on the WordPress cron scheduler, daily.

| Hook                     | Purpose                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `aiowc_popups_cleanup`   | Prunes display rows older than 30 days. The retention window is a constant, not a setting |
| `aiowc_popups_ab_winner` | Scans running A/B tests and ends the losers once a variant reaches 0.95 confidence        |

## Entitlement limits

The `popups` entitlement gates the module as a whole. The per-visitor caps — `frequency_days` and
`max_popups_per_session` — are settings, not licence limits, and the module imposes no cap on how many
popups may exist.

## Related documentation

- [Module Architecture](/reference/architecture)
