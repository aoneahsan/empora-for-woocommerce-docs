---
id: product-filters
title: "Product Filters"
description: "Free-core catalogue filtering by price, category, attribute, tag, rating and stock, with cached result counts, URL-held state and filtered pages kept out of the search index."
keywords:
  - woocommerce product filters
  - ajax filters
  - filter by attribute
  - faceted search
format: md
---
## Overview

Product Filters lets customers narrow the shop by price, category, attribute, tag, rating and stock. It is one of the seven modules in the free core.

Two things separate it from a simple filter widget. The **result counts** beside each option are calculated and cached, so a customer sees how many products each choice would leave before clicking it. And the filtered state lives in the **URL**, under a configurable parameter prefix, so a filtered view can be shared, bookmarked and returned to.

It also takes a deliberate position on search engines: filtered pages are **not indexed by default**, which is the right default for avoiding thousands of near-duplicate URLs competing with the canonical category page.

It is the free core's filtering engine, available on every plan.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `product_filters`                                               |
| Tier            | **Free** — part of the free core                                |
| Entitlement key | `product_filters`                                               |
| Admin tab       | `product-filters`                                               |
| Enabled option  | `aiowc_module_enabled_product_filters` (off until turned on)    |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the two tables below and schedules the cache warm-up job.

`registerHooks()` performs no licence check of its own; being free-tier, the entitlement gate grants it on every plan.

## Settings

Stored in the bundled option row `aiowc_pf_settings`.

| Stored key             | Default | Meaning                                                                     |
| ---------------------- | ------- | ----------------------------------------------------------------------------- |
| `enable_on_shop`       | `true`  | Whether filters appear on the main shop page.                                |
| `enable_on_archives`   | `true`  | Whether they appear on category and tag archives.                            |
| `enable_ajax`          | `true`  | Whether filtering updates the grid without a page load.                      |
| `seo_index_filtered`   | `false` | Whether filtered pages may be indexed. **Off by default.**                   |
| `cache_ttl`            | `3600`  | How long calculated counts are cached, in seconds.                           |
| `url_param_prefix`     | `pf_`   | The prefix on every filter parameter in the URL.                             |
| `debounce_delay`       | `300`   | Milliseconds waited before applying a change, so dragging a slider does not fire a request per pixel. |
| `show_result_count`    | `true`  | Whether the count is shown beside each option.                               |
| `show_active_filters`  | `true`  | Whether the applied filters are listed above the results.                    |
| `scroll_to_results`    | `true`  | Whether the page scrolls to the grid after filtering.                        |

## Filter presets

A preset is a saved filter configuration:

| Field                            | Meaning                                                            |
| -------------------------------- | -------------------------------------------------------------------- |
| `name`, `slug`, `description`    | What the preset is called.                                          |
| `context_type`, `context_value`  | Where it applies — `global` by default, or a named context.         |
| `filters_config`                 | Which filters it offers, as JSON.                                   |
| `display_config`                 | How they are presented, as JSON.                                    |
| `status`                         | `draft` by default. **A new preset is not live until published.**   |
| `priority`                       | Which preset wins when several apply.                               |

## Caching and invalidation

Counts are expensive, so they are cached with a context hash and an expiry, and warmed by a background job.

The cache is also **invalidated by events**, not only by time: the module hooks `woocommerce_new_product`, `woocommerce_update_product` and `woocommerce_delete_product`, plus `created_term`, `edited_term` and `delete_term`. Adding a product or renaming a category therefore drops the affected cache rather than leaving a stale count until it expires.

## SEO handling

With `seo_index_filtered` off — the default — the module marks filtered pages so they are not indexed, and keeps the canonical URL pointing at the unfiltered page. It integrates with Yoast where present, through `wpseo_canonical`, `wpseo_opengraph_url` and `wpseo_robots`, so the two do not disagree about what a filtered URL is.

## Admin screen

The **Product Filters** tab manages the presets — create, edit, duplicate, delete — shows an overview, lists the available product attributes to filter on, reports cache statistics and clears the cache, and edits the ten settings.

It also carries a **query explain** endpoint, which returns the query a filter combination produces. That is a genuine diagnostic: it answers why a filter returned what it did rather than leaving it to guesswork.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                                       | Purpose                                       | Permission           | Required args |
| ----------------- | ------------------------------------------ | ----------------------------------------------- | -------------------- | ------------- |
| GET               | `/product-filters/filter`                  | Products matching a filter combination.        | Public, rate-limited | –             |
| GET               | `/product-filters/counts`                  | Counts per option for a preset.                | Public, rate-limited | `preset_id`   |
| GET               | `/product-filters/price-range`             | The price bounds for the current context.      | Public, rate-limited | –             |
| GET / POST        | `/product-filters/presets`                 | List and create presets.                       | `manage_woocommerce` | `name` on create |
| GET / PATCH / PUT / POST / DELETE | `/product-filters/presets/{id}` | Manage one preset.                     | `manage_woocommerce` | `id`          |
| POST              | `/product-filters/presets/{id}/duplicate`  | Copy a preset.                                 | `manage_woocommerce` | `id`          |
| GET               | `/product-filters/attributes`              | The attributes available to filter on.         | `manage_woocommerce` | –             |
| GET               | `/product-filters/overview`                | Summary of the configuration.                  | `manage_woocommerce` | –             |
| GET               | `/product-filters/cache/stats`             | Cache size and hit information.                | `manage_woocommerce` | –             |
| POST              | `/product-filters/cache/clear`             | Empty the cache.                               | `manage_woocommerce` | –             |
| GET               | `/product-filters/debug/explain`           | The query a filter combination produces.       | `manage_woocommerce` | –             |
| GET / PATCH / PUT / POST | `/product-filters/settings`         | Read and write the settings.                   | `manage_woocommerce` | –             |

## WooCommerce integration

| Hook                                         | What the module does                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `pre_get_posts`                              | Applies the filters to the product query.                              |
| `posts_request`                              | Used by the explain diagnostic to capture the query as built.          |
| `woocommerce_before_shop_loop` / `_after_shop_loop` | Renders the filter panel and the active-filter list.            |
| `woocommerce_new_product`, `_update_product`, `_delete_product` | Invalidates the affected caches.                    |
| `created_term`, `edited_term`, `delete_term` | Invalidates caches when taxonomy changes.                              |
| `wp_head`, `wpseo_canonical`, `wpseo_opengraph_url`, `wpseo_robots` | Keeps filtered pages out of the index.           |
| `wp_enqueue_scripts`                         | Loads the filter assets.                                               |

**Shortcodes** `[aiowc_product_filters]` renders the filter panel, `[aiowc_filtered_products]` the results grid, and `[aiowc_active_filters]` the list of what is applied — so the three parts can be placed independently in a custom layout.

## Database schema

| Table                              | Holds                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_filter_presets`     | The presets: name, slug, description, context, filter and display configuration as JSON, status, priority, creator. |
| `{prefix}aiowc_filter_cache`       | Cached counts and results: a cache key and type, the value, a context hash and an expiry. |

## Background jobs

| Hook                                     | Work                                                    |
| ---------------------------------------- | --------------------------------------------------------- |
| `aiowc_product_filters_cache_warmup`     | Pre-calculates counts so the first customer does not pay for them. |

The job runs on Action Scheduler.

## Action hooks for integrators

| Hook                                        | Fired when                                     |
| ------------------------------------------- | ------------------------------------------------ |
| `aiowc_track_event`                         | The module is enabled or disabled.              |
| `aiowc_capture_error`                       | An error is caught while filtering.             |

The module exposes no filter for adding a filter type of its own.

## Entitlement limits

`product_filters` is granted on every plan including the free one, with no cap on presets or cached rows.

## Known gaps

- **A new preset is created as a draft** and is not live until published, which is easy to miss when a newly created preset does not appear on the shop.
- **Three modules hook `pre_get_posts` to change the product query** — this one, [Advanced Product Filters](/modules/reference/filters-advanced) and [Smart Product Search](/modules/reference/smart-search). Running more than one means several modules rewriting the same query, and the result depends on hook order. A store should choose one filtering module and one search module.
- There is no filter for adding a filter type, so anything beyond price, category, attribute, tag, rating and stock requires modifying the module.
- The explain diagnostic is REST-only; there is no screen that presents it.
