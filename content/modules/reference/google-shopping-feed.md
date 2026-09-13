---
id: google-shopping-feed
title: "Google Shopping Feed"
description: "A public product feed with GTIN, MPN, brand and Google category per product, category mappings, feed validation and optional Content API sync."
keywords:
  - google shopping feed
  - product feed xml
  - gtin mpn
  - merchant feed
format: md
---
## Overview

Google Shopping Feed generates a product feed at a public URL that Google Merchant Center — or any other service that consumes a product feed — can fetch on a schedule. That is the simpler of the two ways to get a catalogue into Google, and it needs no OAuth.

Products carry the identifiers a shopping feed needs: **GTIN**, **MPN**, brand and a Google product category, editable per product from the WooCommerce inventory tab. A mapping table translates the store's own categories and values into Google's.

A product can be excluded from the feed individually, and each product records when it last synced and what error it hit.

The module can also push directly to the Content API when given a merchant id and an access token — but see the limits about how that token is stored.

It is for stores that want a shopping feed without an OAuth connection.

## Availability

| Item            | Value                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Module key      | `google-shopping-feed`                                                |
| Tier            | Premium                                                               |
| Entitlement key | `google-shopping-feed`                                                |
| Admin tab       | `google-shopping-feed`                                                |
| Enabled option  | `aiowc_module_enabled_google-shopping-feed` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                            |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs.

`registerHooks()` returns early when the licence does not grant `google-shopping-feed`.

## Settings

Stored in the bundled option row `aiowc_gs_settings`.

| Stored key                | Default                  | Meaning                                                       |
| ------------------------- | ------------------------ | --------------------------------------------------------------- |
| `auto_sync`               | `false`                  | Whether products are pushed to the API automatically. **Off by default.** |
| `include_variations`      | `true`                   | Whether variations appear as separate items.                   |
| `exclude_out_of_stock`    | `true`                   | Whether out-of-stock products are left out. **On by default.**  |
| `default_brand`           | `''`                     | Brand used where a product has none.                           |
| `default_condition`       | `new`                    | The condition declared for items.                              |
| `default_google_category` | `''`                     | Category used where a product has none.                        |
| `merchant_id`             | `''`                     | The Merchant Center account, for API sync.                     |
| `access_token`            | `''`                     | The API token. **See the limits below.**                       |
| `feed_url`                | `''`                     | Where the generated feed is served.                            |
| `feed_name`               | `aiowc-google-shopping`  | The feed's name.                                               |

## Per-product data

Each product can carry its own feed identifiers, edited from the **Inventory** tab of the WooCommerce product screen:

| Field             | Meaning                                                        |
| ----------------- | ---------------------------------------------------------------- |
| `gtin`            | The global trade item number.                                   |
| `mpn`             | The manufacturer part number.                                   |
| `brand`           | Overrides `default_brand`.                                      |
| `google_category` | Overrides `default_google_category`.                            |
| `is_excluded`     | Leaves the product out of the feed.                             |
| `last_synced_at`, `last_error` | When it last went out and what went wrong.         |

Putting these on the Inventory tab rather than in a separate screen means they are edited where the SKU is, which is where someone maintaining product identifiers already works.

## The public feed

The feed is served at a public, rate-limited route and by a front-end handler registered on `template_redirect` with its own query var — so the feed has a clean URL for Google to poll rather than only a REST path.

Because the feed is public, anything in it is public: product titles, prices, availability and the identifiers above. That is the point of a shopping feed, but it is worth being deliberate about `is_excluded` for products that should not be listed.

## Validation

`POST /feeds/validate` checks the feed against the requirements before Google does, which is how a store finds a missing GTIN or an unmapped category without waiting for a Merchant Center disapproval.

## Admin screen

The **Google Shopping Feed** tab lists the products in the feed and edits their identifiers, manages the category and value mappings, generates the feed, runs a sync, validates the feed and reads the run logs.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                            | Purpose                                          | Permission           | Required args                         |
| ------ | ------------------------------- | -------------------------------------------------- | -------------------- | ------------------------------------- |
| GET    | `/feeds/google-shopping`        | The generated feed.                               | Public, rate-limited | –                                     |
| POST   | `/feeds/generate`               | Regenerate the feed now.                          | `manage_woocommerce` | –                                     |
| POST   | `/feeds/sync`                   | Push to the Content API.                          | `manage_woocommerce` | –                                     |
| POST   | `/feeds/validate`               | Check the feed for problems.                      | `manage_woocommerce` | –                                     |
| GET    | `/feeds/products`               | Products and their feed identifiers.              | `manage_woocommerce` | –                                     |
| PATCH  | `/feeds/products/{product_id}`  | Edit one product's identifiers.                   | `manage_woocommerce` | `product_id`                          |
| GET    | `/feeds/mappings`               | Mappings of one type.                             | `manage_woocommerce` | `type`                                |
| POST   | `/feeds/mappings`               | Create a mapping.                                 | `manage_woocommerce` | `type`, `local_value`, `mapped_value` |
| DELETE | `/feeds/mappings/{id}`          | Remove a mapping.                                 | `manage_woocommerce` | `id`                                  |
| GET    | `/feeds/logs`                   | Past generation and sync runs.                    | `manage_woocommerce` | –                                     |

## WooCommerce integration

| Hook                                              | What the module does                                    |
| ------------------------------------------------- | --------------------------------------------------------- |
| `woocommerce_product_options_inventory_product_data` | Adds the feed identifier fields to the Inventory tab. |
| `woocommerce_process_product_meta`                | Saves them when the product is saved.                    |
| `init`, `query_vars`, `template_redirect`         | Serves the feed at its own URL.                          |

## Database schema

| Table                             | Holds                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_feed_products`     | Per-product feed data: GTIN, MPN, brand, Google category, exclusion flag, last sync and last error. |
| `{prefix}aiowc_feed_mappings`     | Value translations: the mapping type, the local value and what it maps to.              |
| `{prefix}aiowc_feed_logs`         | Each run: type, status, message, product count, duration and timings.                   |

## Background jobs

| Hook                          | Interval | Work                                            |
| ----------------------------- | -------- | ------------------------------------------------- |
| `aiowc_feeds_regenerate`      | hourly   | Rebuilds the feed file.                          |
| `aiowc_feeds_sync_google`     | daily    | Pushes to the Content API, where configured.     |

Both run on WP-Cron and are offset from each other.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module fires no feed or sync events, so an integration cannot observe a feed being regenerated or a sync failing.

## Entitlement limits

`google-shopping-feed` is an on/off grant with no cap on products, mappings or log rows.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.

## Known gaps

- The Content API access token is **encrypted at rest** (AES-256-GCM, keyed from the site's `AUTH_KEY`) and is never returned by a settings read — it answers as an `access_token_set` boolean instead. A token written by an earlier build in the clear is migrated to the encrypted form the first time it is read. A token that cannot be decrypted, because the site was re-keyed, is refused rather than used: sync reports missing credentials instead of sending a corrupt bearer token.
- 🔴 The encryption is keyed from `AUTH_KEY`. **Changing that constant makes the stored token unreadable** and it must be pasted in again.
- There is no OAuth flow here: `access_token` has to be obtained elsewhere and pasted in, and nothing refreshes it — so API sync stops when the token expires, and the failure appears as a sync error rather than as an expiry notice.
- **A second, overlapping module also pushes products to Google** — [Google Listings & Ads](/modules/reference/google-listings-ads). Running both means two sets of product mappings and two sync schedules against the same Merchant Center account. A store should pick one.
- No feed or sync events are fired, so failures are only visible by reading the logs.
- The feed is public by design; there is no signed or tokenised feed URL for a store that would rather not publish its catalogue openly.
