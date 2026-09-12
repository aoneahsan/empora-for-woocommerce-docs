---
id: store-locator
title: "Store Locator"
description: "Physical shop locations with geocoded addresses, opening hours, pickup details and per-store stock, searchable by distance from a customer."
keywords:
  - woocommerce store locator
  - find a store
  - store finder map
  - per store inventory
format: md
---
## Overview

Store Locator holds the shop's physical locations and lets a customer find the nearest one. A store carries its address, coordinates, contact details, opening hours including a midday break, and whether it is a pickup location with its own instructions.

It also holds **per-store inventory**: how many of a product each location has, with a low-stock threshold, refreshed by a background job. That is what allows the product page to answer "which shop has this in stock".

Addresses are turned into coordinates by a geocoding job, so a store is entered as an address and located on a map without anyone typing latitudes.

It is for retailers with physical shops, pickup points or stockists.

## Availability

| Item            | Value                                                         |
| --------------- | --------------------------------------------------------------- |
| Module key      | `store_locator`                                                |
| Tier            | Premium                                                        |
| Entitlement key | `store_locator`                                                |
| Admin tab       | `store-locator`                                                |
| Enabled option  | `aiowc_module_enabled_store_locator` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                     |

Enabling the module creates the three tables below and schedules the geocode and inventory jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored in the bundled option row **`aiowc_storelocator_settings`** — deliberately not `aiowc_sl_settings`, because that prefix belongs to the Social Login module and both can be registered at once.

| Stored key               | Default | Meaning                                                               |
| ------------------------ | ------- | ----------------------------------------------------------------------- |
| `google_maps_api_key`    | `''`    | The Google Maps key. **Empty by default** — see *Geocoding* below.     |
| `default_zoom`           | `12`    | The map's starting zoom.                                               |
| `default_radius`         | `25`    | How far a nearby search looks.                                         |
| `radius_unit`            | `km`    | The unit that radius is expressed in.                                  |
| `max_results`            | `20`    | How many stores a search returns.                                      |
| `enable_inventory_check` | `true`  | Whether per-store stock is shown.                                      |
| `show_store_hours`       | `true`  | Whether opening hours are shown.                                       |
| `show_directions`        | `true`  | Whether a directions link is offered.                                  |
| `sync_interval_hours`    | `6`     | How often per-store inventory is refreshed.                            |

## Geocoding

An address is converted to coordinates by the geocode job, or on demand for one store.

🔴 **No Google Maps API key is supplied, and the module works without one.** With a key it geocodes through Google's Geocoding API. With the key empty it falls back to **Nominatim**, OpenStreetMap's free geocoder.

That fallback is what keeps the module usable out of the box, and it carries two practical consequences worth knowing: Nominatim is a volunteer service with a strict usage policy and a low rate limit, so bulk-geocoding a large chain through it is neither fast nor polite; and the map itself is a separate question from geocoding — a store wanting Google's map tiles needs the key regardless.

Either way, each address is sent to a third-party geocoding service. That is inherent to turning an address into coordinates, but it should be a deliberate choice rather than a surprise.

## Stores

| Field                                  | Meaning                                                          |
| -------------------------------------- | ------------------------------------------------------------------ |
| `name`, `slug`, `description`          | What the store is called and described as.                        |
| `address_line_1`, `_2`, `city`, `state`, `postal_code`, `country` | The postal address.                     |
| `latitude`, `longitude`                | Filled in by geocoding, to eight and eleven decimal places.       |
| `phone`, `email`, `website`            | Contact details.                                                  |
| `is_active`                            | Whether the store is listed.                                      |
| `is_pickup_location`                   | Whether customers may collect here. **On by default.**            |
| `pickup_instructions`                  | What to tell a customer collecting.                               |
| `meta_data`                            | Arbitrary extra data as JSON.                                     |

## Opening hours

Hours are per store and per weekday, with an open and a close time, a closed flag for days the store does not trade, and a **break** window — so a shop that shuts for lunch is represented properly rather than as two separate rows.

## Per-store inventory

An inventory row records a product or variation's quantity at one store, a low-stock threshold, an availability flag and when it was last synced. The quantity passes through the `aiowc_store_locator_inventory_quantity` filter, so a store running its stock in an external system can supply the real number instead of the stored one.

## Admin screen

The **Store Locator** tab manages the locations, their hours and their inventory, triggers geocoding for a store, and edits the module's nine settings.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                                    | Purpose                                        | Permission           | Required args |
| ----------------- | --------------------------------------- | ------------------------------------------------ | -------------------- | ------------- |
| GET               | `/store-locator/stores`                 | Every store.                                    | `manage_woocommerce` | –             |
| GET / POST        | `/store-locator/locations`              | List and create locations.                      | `manage_woocommerce` | `name` on create |
| PATCH / PUT / POST / DELETE | `/store-locator/locations/{id}` | Manage one location.                        | `manage_woocommerce` | `id`          |
| POST              | `/store-locator/stores/{id}/geocode`    | Geocode one store now.                          | `manage_woocommerce` | `id`          |
| GET / PATCH / PUT / POST | `/store-locator/stores/{id}/hours`| Read and write opening hours.                   | `manage_woocommerce` | `id`          |
| GET / PATCH / PUT / POST | `/store-locator/stores/{id}/inventory` | Read and write per-store stock.            | `manage_woocommerce` | `id`          |
| GET / PATCH / PUT / POST | `/store-locator/settings`        | Read and write the settings.                    | `manage_woocommerce` | –             |
| GET               | `/store-locator/nearby`                 | Stores near a point (`lat`, `lng`).             | Public, rate-limited | `lat`, `lng`  |
| GET               | `/store-locator/geocode`                | Turn a typed place into coordinates (`q`).      | Public, rate-limited | `q`           |

The two public routes are what the storefront map uses: the visitor types a place, `/geocode` resolves it, and `/nearby` returns the stores around it. Both are rate-limited, which matters because each one can trigger an outbound request to a geocoding service.

## WooCommerce integration

| Hook                                  | What the module does                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| `woocommerce_single_product_summary`  | Shows per-store availability for the product being viewed.         |
| `wp_enqueue_scripts`                  | Loads the map assets.                                              |

**Shortcode** `[empora_store_locator]` renders the locator — the map, the search and the results — on any page.

Note the shortcode's prefix is `empora_`, not the `aiowc_` used by every other module's shortcode.

## Database schema

| Table                             | Holds                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_stores`            | The locations: name, slug, description, full address, coordinates, contact details, active and pickup flags, pickup instructions, arbitrary JSON metadata. |
| `{prefix}aiowc_store_hours`       | Opening hours per store and weekday, with open and close times, a closed flag and a break window.      |
| `{prefix}aiowc_store_inventory`   | Per-store stock: the product or variation, quantity, low-stock threshold, availability, last sync time. |

## Background jobs

| Hook                                     | Cron interval | Work                                                  |
| ---------------------------------------- | ------------- | ------------------------------------------------------- |
| `aiowc_store_locator_geocode`            | hourly        | Geocodes stores that have an address but no coordinates. |
| `aiowc_store_locator_sync_inventory`     | hourly        | Refreshes per-store stock, but only when `sync_interval_hours` has elapsed. |

Both run on WP-Cron and are deliberately offset from each other — one starting five minutes after the module is enabled, the other fifteen — so they do not both run in the same tick.

The inventory job's schedule and its **effective** frequency are two different things. The cron event fires every hour; the job then checks how long it has been since the last sync and **returns without doing anything** until `sync_interval_hours` has passed. Changing that setting therefore takes effect immediately, with no need to reschedule the cron event — which is why the setting and the schedule disagree on paper and agree in practice.

## Action hooks for integrators

| Hook                                          | Purpose                                                            |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `aiowc_store_locator_inventory_quantity`      | Filter — supply the real quantity from an external stock system.    |
| `aiowc_track_event`                           | The module is enabled or disabled.                                  |

## Entitlement limits

`store_locator` is an on/off grant with no cap on the number of stores, hours or inventory rows. The search radius and result count are store settings.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Geocoding sends each address to a third-party service** — Google with a key, Nominatim without one. Nominatim's usage policy makes it unsuitable for bulk geocoding a large chain.
- The geocode job runs hourly with no interval setting of its own, so on a store with many un-geocoded addresses it works through them an hour at a time.
- The shortcode is `[empora_store_locator]` while every other module's is `aiowc_`-prefixed, which is easy to get wrong from memory.
- There is no bulk import of stores, so a chain is entered one location at a time or through the REST routes.
- Opening hours have no support for holidays or temporary closures — only the weekly pattern.
