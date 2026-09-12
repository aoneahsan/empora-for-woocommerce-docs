---
id: google-listings-ads
title: "Google Listings & Ads"
description: "OAuth-connected Google Merchant Center sync with incremental product pushes, listing status and validation issues read back, and encrypted token storage."
keywords:
  - google merchant center
  - woocommerce google shopping
  - product sync
  - google content api
format: md
---
## Overview

Google Listings & Ads connects the store to a Google Merchant Center account over **OAuth** and pushes products to it through the Content API. Each product gets a mapping row recording its Google offer id, its listing status as Google reports it — pending, approved, disapproved or expiring — and any validation issues Google raised.

Syncing is incremental by design: each mapping carries a **sync hash**, so a run only sends what has actually changed rather than the whole catalogue.

Every sync writes a log with what was processed, what failed and why, and the module carries diagnostics with a repair action for putting its own state right.

It is for stores advertising their catalogue through Google.

## Availability

| Item            | Value                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Module key      | `google_listings_ads`                                                 |
| Tier            | Premium                                                               |
| Entitlement key | `google_listings_ads`                                                 |
| Admin tab       | `google-listings-ads`                                                 |
| Enabled option  | `aiowc_module_enabled_google_listings_ads` (off until turned on)      |
| REST namespace  | `aiowc/v1`                                                            |

`registerHooks()` registers only the REST routes and the jobs. **This module hooks nothing in WooCommerce** — it does not filter prices, alter the cart or render anything on the storefront. It reads products and talks to Google.

## Settings

Feed settings and sync settings are separate, each with its own routes.

| Feed setting            | Default  | Meaning                                                      |
| ----------------------- | -------- | -------------------------------------------------------------- |
| `target_country`        | `US`     | The country the feed targets.                                 |
| `content_language`      | `en`     | The feed's language.                                          |
| `channel`               | `online` | `online` or `local`.                                          |
| `include_variations`    | `true`   | Whether variations are sent as separate offers.               |
| `include_out_of_stock`  | `false`  | Whether out-of-stock products are sent. **Off by default.**   |
| `shipping_settings`, `tax_settings`, `category_mappings` | – | Feed configuration, stored as structured values. |

## Connecting

The module implements a full OAuth flow against Google:

- `POST /google-listings-ads/connect` starts it.
- `GET /google-listings-ads/oauth/callback` receives Google's redirect. It is a **public, rate-limited** route because Google calls it in the customer's browser rather than as an authenticated request.
- `POST /google-listings-ads/disconnect` revokes the tokens.

It requests the `content` and `userinfo.email` scopes, and revokes through Google's revocation endpoint on disconnect rather than merely forgetting the token locally.

🔴 **Tokens are stored encrypted.** The module keeps them in a dedicated repository that encrypts before writing and decrypts on read, rather than as a plain setting. That is a meaningfully better position than the sibling [Google Shopping Feed](/modules/reference/google-shopping-feed) module — see that page's limits.

## Syncing

A sync is `full`, `incremental` or `single`, and each run writes a log row with counts of items processed and failed, start and completion times, an error message and details.

Mappings carry Google's own view back: `listing_status` reflects what Merchant Center says about the offer, and `validation_issues` holds what it objected to — so a product disapproved by Google is visible in WordPress without logging into Merchant Center.

## Admin screen

The **Google Listings & Ads** tab manages the connection, shows the merchant account and an overview, edits feed and sync settings, previews and downloads the generated feed, runs a sync now, shows sync status and logs, lists the product mappings, and runs diagnostics with a repair action.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. All require `manage_woocommerce` except the OAuth callback.

| Method     | Path                                            | Purpose                                    |
| ---------- | ----------------------------------------------- | -------------------------------------------- |
| POST       | `/google-listings-ads/connect`                  | Begin the OAuth flow.                       |
| GET        | `/google-listings-ads/oauth/callback`           | Receive Google's redirect. Public, rate-limited. |
| POST       | `/google-listings-ads/disconnect`               | Revoke and forget the tokens.               |
| GET        | `/google-listings-ads/connection`               | Whether the store is connected.             |
| GET        | `/google-listings-ads/merchant`                 | The connected Merchant Center account.      |
| GET        | `/google-listings-ads/overview`                 | Summary of listings and sync state.         |
| GET / POST | `/google-listings-ads/feed/settings`            | Read and write the feed settings.           |
| GET        | `/google-listings-ads/feed/preview`             | Preview the generated feed.                 |
| GET        | `/google-listings-ads/feed/download`            | Download it.                                |
| GET / POST | `/google-listings-ads/sync/settings`            | Read and write the sync settings.           |
| POST       | `/google-listings-ads/sync/now`                 | Run a sync immediately.                     |
| GET        | `/google-listings-ads/sync/status`              | Whether a sync is running.                  |
| GET        | `/google-listings-ads/sync/logs`                | Past sync runs.                             |
| GET        | `/google-listings-ads/sync/logs/{id}`           | One run in detail.                          |
| GET        | `/google-listings-ads/mappings`                 | Product-to-Google mappings and their status.|
| GET        | `/google-listings-ads/diagnostics`              | Detected problems.                          |
| POST       | `/google-listings-ads/diagnostics/repair`       | Repair them.                                |

## WooCommerce integration

None. The module registers no WooCommerce hooks at all — it reads products through WooCommerce's own APIs when a sync runs, and otherwise stays out of the request.

## Database schema

| Table                                       | Holds                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_google_feed_settings`        | The feed configuration: target country, language, channel, inclusion flags, shipping, tax and category mappings. |
| `{prefix}aiowc_google_product_mappings`     | One row per product: the Google product and offer ids, listing status, last sync time, a sync hash and any validation issues. |
| `{prefix}aiowc_google_sync_logs`            | Each run: type, status, items processed and failed, timings, error message and details.      |

OAuth tokens are **not** in these tables — they are in their own encrypted option.

## Background jobs

| Hook                            | Interval               | Work                                             |
| ------------------------------- | ---------------------- | -------------------------------------------------- |
| `aiowc_google_product_sync`     | configurable, hourly+  | Pushes changed products to Merchant Center.       |
| `aiowc_google_sync_cleanup`     | daily                  | Prunes old sync logs.                             |

The sync interval is a setting rather than a constant, so a large catalogue can sync less often.

## Action hooks for integrators

| Hook                                    | Fired when                                    |
| --------------------------------------- | ----------------------------------------------- |
| `aiowc_google_feed_settings_created` / `_updated` | Feed settings change.                 |
| `aiowc_google_mapping_created` / `_updated` / `_deleted` | A product mapping changes.      |
| `aiowc_google_sync_log_created` / `_updated`      | A sync run starts or finishes.        |
| `aiowc_track_event`                     | The module is enabled or disabled.             |

## Entitlement limits

`google_listings_ads` is an on/off grant with no cap on products, mappings or sync runs. Google's own Merchant Center quotas apply on their side.

## Health check

The diagnostics route reports the module's own state — connection, tokens, mappings — and the repair action fixes what it can.

## Known gaps

- **Connecting requires a Google account with Merchant Center access and an OAuth client.** None ships with the plugin, so the module does nothing until a store completes that setup on Google's side.
- **A second, overlapping module also pushes products to Google** — [Google Shopping Feed](/modules/reference/google-shopping-feed). The two keep separate tables, separate settings and separate sync jobs, and nothing detects that both are active. A store should pick one; this one is the better-secured implementation.
- Nothing is hooked in WooCommerce, so a product edited in the admin is not pushed until the next scheduled sync. The sync hash means the change is detected, but not immediately.
- Google's listing status is only as current as the last sync, so a disapproval raised by Google between runs is not visible until the next one.
