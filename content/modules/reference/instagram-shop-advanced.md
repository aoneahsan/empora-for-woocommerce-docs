---
id: instagram-shop-advanced
title: "Instagram Shop Integration (Advanced)"
description: "Show a connected Instagram media grid on the store, record views and clicks, and push products to the Facebook catalogue behind Instagram Shop."
keywords:
  - woocommerce instagram
  - instagram shop
  - facebook catalogue
  - social commerce
format: md
---
## Overview

The Instagram module pulls a connected Instagram account's recent media into the store, renders it as a grid, records views and clicks on those posts, pushes WooCommerce products into the Facebook catalogue that backs Instagram Shop, and tags a product onto a post at a given position.

It is for stores that already sell through Instagram and want the same media and the same catalogue on their own site.

## Availability

| Item            | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Module key      | `instagram-shop-advanced`                                            |
| Tier            | Premium                                                              |
| Entitlement key | `instagram-shop-advanced`                                            |
| Admin tab       | `instagram`, under **Integrations**                                  |
| Enabled option  | `aiowc_module_enabled_instagram-shop-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                           |

`registerHooks()` and `onEnable()` both re-check the entitlement and return immediately when it is absent.

## Connection

The module talks to the Facebook Graph API, version 18.0, for both halves of the job: `<ig_user_id>/media` to read the feed and `<media_id>/product_tags` to tag a post, and `<catalog_id>/products` to push products into the catalogue. Requests carry a ten-second timeout, and a non-2xx reply is returned as a failure rather than raised.

Connection details are supplied by the store owner and held in the site's own options, in the bundled settings row.

## Settings

Stored in the bundled option row `aiowc_ig_settings`.

| Stored key              | Default | Meaning                                                         |
| ----------------------- | ------- | --------------------------------------------------------------- |
| `access_token`          | empty   | Instagram Graph credential for reading media and tagging posts. |
| `ig_user_id`            | empty   | The Instagram account whose media is read.                      |
| `facebook_access_token` | empty   | Credential used for the catalogue push.                         |
| `facebook_catalog_id`   | empty   | Catalogue that products are pushed into.                        |
| `show_feed_on_site`     | `false` | When on, the feed grid is printed in the site footer.           |
| `feed_count`            | `12`    | Posts shown by default; clamped between 1 and 50.               |
| `auto_sync_catalog`     | `true`  | Stored flag for the catalogue job.                              |
| `auto_refresh_feed`     | `true`  | Stored flag for the feed job.                                   |

With no credentials stored, the API service reports itself unconfigured and the fetch and push paths fail closed. There is no settings REST route for this module, so these values cannot be changed through the API.

The two `auto_*` flags are stored but not read: both jobs are scheduled whenever the module is enabled and run regardless.

## Admin screen

The **Instagram** tab is a placeholder. It renders a heading, a "Sync Now" button, a read-only field showing a fixed placeholder string in place of a credential, a "Reconnect Instagram Account" button and four empty image tiles. Nothing on it is wired to a request. The routes below are reachable only by calling the API directly, and the connection settings can only be changed in the database.

## REST API endpoints

All routes are on `aiowc/v1`.

| Method | Path                                | Purpose                                                          | Required args           | Permission              |
| ------ | ----------------------------------- | ---------------------------------------------------------------- | ----------------------- | ----------------------- |
| GET    | `/instagram/feed`                   | Recent stored posts; accepts `limit`.                            | –                       | Open read, rate limited |
| POST   | `/instagram/posts/{id}/track-click` | Increment a post's click count. Answers 404 for an unknown post. | `id`                    | Public write            |
| POST   | `/instagram/sync`                   | Push products into the Facebook catalogue, up to 500 in a run.   | –                       | Manage                  |
| POST   | `/instagram/tag-products`           | Tag a product onto a post at coordinates `x` and `y`.            | `post_id`, `product_id` | Manage                  |
| DELETE | `/instagram/tags/{id}`              | Remove a tag.                                                    | `id`                    | Manage                  |
| GET    | `/instagram/analytics`              | Views and clicks over a fixed 30-day window.                     | –                       | Manage                  |

"Manage" means `manage_woocommerce` plus a REST nonce on cookie-authenticated requests. Open reads are limited to 120 requests a minute per caller; public writes to 30 a minute and they require a REST nonce.

The analytics window is fixed at 30 days in the controller and is not configurable.

## Storefront output

| Hook        | What the module does                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wp_footer` | Prints the feed grid, but only when `show_feed_on_site` is on. Nothing is printed inside `wp-admin`, and nothing is printed when no posts are stored. |

The grid is a responsive CSS grid with its styles inlined, built from stored post rows rather than a live API call.

### Shortcodes

| Shortcode                           | Renders                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| `[aiowc_instagram_feed count="12"]` | A grid of recent posts. `count` is clamped between 1 and 50. |
| `[aiowc_instagram_post]`            | A single stored post.                                        |

## Database schema

| Table                       | Holds                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| `{prefix}aiowc_ig_posts`    | Media pulled from the account, with its view and click counters.           |
| `{prefix}aiowc_ig_products` | The push state of each WooCommerce product against the Facebook catalogue. |
| `{prefix}aiowc_ig_tags`     | Product tags placed on a post, with their coordinates.                     |

## Background jobs

| Hook                           | Schedule | Work                                         |
| ------------------------------ | -------- | -------------------------------------------- |
| `aiowc_instagram_refresh_feed` | Hourly   | Fetches recent media into the posts table.   |
| `aiowc_instagram_sync_catalog` | Daily    | Pushes products into the Facebook catalogue. |

Both are WP-Cron events, scheduled on enable and removed on disable. With no credentials stored, both run and fail closed without writing.

## Entitlement limits

`instagram-shop-advanced` is an on/off grant with no licence-side quota. The bounds in the module are its own: 500 products per catalogue sync, 1–50 posts per feed render, and a 30-day analytics window. Facebook's own API rate limits apply on top and are not managed here.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
