---
id: recently-viewed
title: "Recently Viewed Products"
description: "Record which products a visitor looked at and show them again, stored against the signed-in user or a cookie-held session for guests."
keywords:
  - woocommerce recently viewed
  - browsing history
  - product recall
  - storefront widget
format: md
---
## Goal

Record which products a visitor has looked at and show them again. Views are stored server-side against
the signed-in user, or against a cookie-held session ID for guests, so the list survives across devices
for an account and across pages for a guest.

## Tier and entitlement

| Field           | Value             |
| --------------- | ----------------- |
| Tier            | Premium           |
| Entitlement key | `recently-viewed` |
| Admin tab       | `recently-viewed` |
| Module key      | `recently-viewed` |
| Settings prefix | `aiowc_rv_`       |

Hooks register only when `aiowc_module_enabled_recently-viewed` is true and the licence permits the
`recently-viewed` entitlement.

## What the code does

- A view is recorded on `template_redirect` when a single product page is rendered, and can also be
  recorded through a REST call.
- Signed-in users are tracked by user ID. Guests are tracked by an anonymous session ID held in the
  `aiowc_rv_sid` cookie, and only when `anonymous_tracking` is on.
- The list renders after the single product template, and anywhere through a shortcode.
- The visitor can clear their own list.
- The shop can see the most-viewed products over a period.
- A daily job prunes view rows older than 90 days. The retention window is a constant in
  `Jobs/CleanupJob.php`, not a setting.

## Settings

Unlike most modules, all five values are stored together in **one array option**, `aiowc_rv_settings`,
read through `RecentlyViewedModule::getAllSettings()` and merged over `DEFAULTS`. An update only accepts
keys that exist in `DEFAULTS` and casts each to the type of its default.

| Setting              | Default | Meaning                                           | Consumed                                                                                |
| -------------------- | ------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `enable_tracking`    | `true`  | Master switch for recording and displaying views  | Yes — both the tracking and display services                                            |
| `max_products`       | `10`    | How many products the list shows                  | Yes — the display service, with a floor of 1                                            |
| `anonymous_tracking` | `true`  | Whether guests are tracked by cookie              | Yes — the display service falls back to the cookie list only when on                    |
| `show_on_account`    | `true`  | Intended to place the list on the My Account page | **No** — the key is declared but never read as a condition, and no account hook exists  |
| `show_on_homepage`   | `true`  | Intended to place the list on the homepage        | **No** — the key is declared but never read as a condition, and no homepage hook exists |

The list appears in exactly two places: after the single product template, and wherever the shortcode is
placed.

## Admin screen

Admin tab `recently-viewed`. It
shows the most-viewed products over a chosen number of days and the settings above.

## Database schema

Created by `Schema/RecentlyViewedSchema.php` at schema version `1.0.0`.

| Table                         | Holds                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| `{prefix}aiowc_product_views` | One row per product view, keyed by user ID or anonymous session ID |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

| Method | Path                | Purpose                                              | Required args | Permission               |
| ------ | ------------------- | ---------------------------------------------------- | ------------- | ------------------------ |
| POST   | `/viewed/track`     | Record a product view                                | `product_id`  | Public write check       |
| GET    | `/viewed/recent`    | The caller's recently viewed products, up to `limit` | —             | Rate-limited public read |
| POST   | `/viewed/clear`     | Clear the caller's list                              | —             | Public write check       |
| GET    | `/viewed/admin/top` | Most-viewed products over `days`, up to `limit`      | —             | Manage                   |
| GET    | `/viewed/settings`  | Read settings                                        | —             | Manage                   |
| POST   | `/viewed/settings`  | Update settings                                      | —             | Manage                   |

## WooCommerce and WordPress integration

| Hook                               | Priority | Effect                                          |
| ---------------------------------- | -------- | ----------------------------------------------- |
| `template_redirect`                | default  | Records a view when a single product page loads |
| `woocommerce_after_single_product` | 20       | Renders the recently viewed list                |

### Shortcode

| Shortcode                 | Purpose                          |
| ------------------------- | -------------------------------- |
| `[aiowc_recently_viewed]` | Renders the recently viewed list |

No block is registered, and the module hooks no order, cart or email action.

## Background jobs

| Hook                  | Schedule                               | Purpose                             |
| --------------------- | -------------------------------------- | ----------------------------------- |
| `aiowc_views_cleanup` | Daily, on the WordPress cron scheduler | Prunes view rows older than 90 days |

## Privacy note

Guest tracking writes a cookie (`aiowc_rv_sid`) and stores a row per product view. Turning
`anonymous_tracking` off stops the guest fallback.

## Entitlement limits

The `recently-viewed` entitlement gates the module as a whole. `max_products` is a display setting, not a
licence limit, and no cap on stored view rows is implemented beyond the 90-day cleanup.

## Related documentation

- [Module Architecture](/reference/architecture)
