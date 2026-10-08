---
id: countdown-timer
title: "Sales Countdown Timers"
description: "Scheduled countdown timers and low-stock counters on WooCommerce product, shop and cart pages. Every timer has a real end, and a percentage offer is a real price that exists only while the timer runs."
keywords:
  - woocommerce countdown timer
  - sale countdown
  - scheduled sale price
  - low stock counter
format: md
---
## Overview

Sales Countdown Timers shows a countdown, and optionally a low-stock line, on the product page, in the shop
loop and above the cart. Each timer can carry a percentage offer, which the module applies as a real price
for exactly as long as the timer runs.

Every timer has a real schedule. A timer that has not started or has already ended renders nothing, and a
countdown never restarts for a shopper who has already seen it end.

It is a premium module. Enable it from **Empora → Modules** once your license includes `countdown-timer`;
enabling it creates its table.

## Availability

| Item            | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Module key      | `countdown-timer`                                           |
| Tier            | Premium — lowest plan **Starter**                           |
| Entitlement key | `countdown-timer`                                           |
| Enabled option  | `aiowc_module_enabled_countdown-timer` (off until enabled)  |
| REST namespace  | `aiowc/v1`                                                  |

## Schedules

| Mode           | When it ends                                                                                     | Offer                                                     |
| -------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `fixed`        | At the end date you set (with an optional start). The same moment for every shopper.            | A WooCommerce sale price, applied at the start and removed at the end. |
| `evergreen`    | A duration you set, from 1 minute to 30 days, counted from when each shopper first sees it.     | Applied to that shopper only, while their window is open. |
| `product_sale` | At each targeted product's own WooCommerce sale end date. A product without one shows no timer. | None — the product's own sale price applies.              |

Dates typed without a time zone are read in your site's time zone.

A timer is refused when it has no real schedule: a fixed timer with no end, or one that ends before it
starts; an evergreen duration outside 1 minute to 30 days; an offer above 90%. An offer, and the
`product_sale` mode, must target chosen products or categories rather than the whole store.

:::note How offers are applied
For a **fixed** timer the module writes the sale price and sale dates on each targeted product (up to 200)
when the window opens, and puts the product's original sale price and dates back when it closes. A product
already discounted by another timer is skipped, never discounted twice, and variations are discounted
individually.

For an **evergreen** timer the price changes only on the storefront, for the one shopper whose window is
open, so the product page, the cart and the order all charge the same amount. A product already on a lower
sale keeps its lower price.
:::

An evergreen shopper's first-seen time is kept in a browser cookie and, when they are signed in, on their
account, so opening the site in another browser does not restart the countdown.

## Timer fields

| Field                                 | Values                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `name`                                | Required.                                                              |
| `status`                              | `active` or `paused`.                                                  |
| `mode`                                | `fixed`, `evergreen` or `product_sale`.                                |
| `starts_at`, `ends_at`                | ISO-8601 dates (fixed timers).                                         |
| `evergreen_minutes`                   | 1–43,200 (evergreen timers).                                           |
| `target_type`, `target_ids`           | `all`, `products` or `categories`, with up to 200 IDs.                 |
| `placements`                          | One or more of `product`, `shop`, `cart`.                              |
| `style`                               | `bar`, `badge`, `inline` or `sticky`.                                  |
| `heading`                             | Up to 40 characters.                                                   |
| `offer_percent`                       | 0–90.                                                                  |
| `background_color`, `text_color`      | Hex colours.                                                           |
| `show_stock`                          | Adds "Only N left in stock" when the product manages stock and is low. |
| `priority`                            | When several timers match one spot, the lowest number wins.            |

## Settings

Stored in the bundled option row `aiowc_cdt_settings`.

| Key                     | Default | What it does                                                      |
| ----------------------- | ------- | ----------------------------------------------------------------- |
| `show_on_product`       | on      | Timers on the single product page.                                |
| `show_on_shop`          | on      | Timers in the shop and category loop.                             |
| `show_on_cart`          | off     | Timers above the cart.                                            |
| `evergreen_cookie_days` | `30`    | How long the first-seen cookie lasts (1–365 days).                |
| `stock_threshold`       | `10`    | The low-stock line shows at or below this quantity (1–1000).      |

## REST API endpoints

All require an administrator.

| Method             | Path                              | Purpose                                                                 |
| ------------------ | --------------------------------- | ----------------------------------------------------------------------- |
| GET                | `/countdown-timers`               | A page of timers (up to 50 per page).                                   |
| POST               | `/countdown-timers`               | Create a timer.                                                         |
| GET                | `/countdown-timers/{id}`          | One timer.                                                              |
| PUT / PATCH / POST | `/countdown-timers/{id}`          | Update a timer.                                                         |
| DELETE             | `/countdown-timers/{id}`          | Delete a timer.                                                         |
| GET                | `/countdown-timers/{id}/coverage` | Each targeted product: its sale end date, whether the offer is applied, and whether it gets a timer. |
| GET                | `/countdown-timers/settings`      | Read the settings.                                                      |
| PUT / PATCH / POST | `/countdown-timers/settings`      | Update the settings.                                                    |

## Database schema

| Table                            | Holds                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| `{prefix}aiowc_countdown_timers` | One row per timer: the fields above, with times stored in UTC. |

Created when the module is enabled and kept when it is disabled.

## WooCommerce integration

The timer is rendered on the server with its end time and the time remaining, so it reads correctly without
JavaScript. A small script keeps it ticking once a second, or once a minute when the visitor prefers reduced
motion, and loads only on pages that show a timer.

| Hook                                     | Adds                         |
| ---------------------------------------- | ---------------------------- |
| `woocommerce_single_product_summary`     | The timer on a product page  |
| `woocommerce_after_shop_loop_item_title` | The timer in the shop loop   |
| `woocommerce_before_cart`                | The timer above the cart     |

:::caution Page caching
Fixed timers are safe behind a full-page cache. Evergreen timers are not: a cached page would show one
shopper's end time to the next. Exclude the pages that show evergreen timers from your page cache.
:::

## Entitlement limits

The entitlement is a single on/off grant. Without `countdown-timer` the module stays locked and none of the
above loads.
