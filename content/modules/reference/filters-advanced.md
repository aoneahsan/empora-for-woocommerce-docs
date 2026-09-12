---
id: filters-advanced
title: "Advanced Product Filters"
description: "Named filter sets placed as a widget, shortcode or fetched by slug, with analytics recording which filters customers use and what they return."
keywords:
  - woocommerce advanced filters
  - filter widget
  - filter analytics
  - filter sets
format: md
---
## Overview

Advanced Product Filters is the premium filtering module. A **filter set** is a named, placeable configuration of filters with its own slug, which can be dropped into a sidebar as a widget, placed with a shortcode, or fetched by slug over a public route for a custom storefront.

Its distinguishing feature is **analytics**: every filter a customer applies is recorded with the result count it produced, and every search query is recorded alongside. That answers questions a filter panel otherwise cannot — which filters people actually use, and which combinations return nothing.

Recorded data is pruned on a retention setting rather than kept forever.

It is for stores that want to learn from how their catalogue is browsed.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `filters-advanced`                                              |
| Tier            | Premium                                                         |
| Entitlement key | `filters-advanced`                                              |
| Admin tab       | `filters-advanced`                                              |
| Enabled option  | `aiowc_module_enabled_filters-advanced` (off until turned on)   |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs.

`registerHooks()` returns early twice: once when the licence does not grant `filters-advanced`, and again when `enable_filters` is off — so switching that setting off takes the REST routes and every hook out of the request entirely.

## Settings

Stored in the bundled option row `aiowc_flt_settings`.

| Stored key            | Default | Meaning                                                                    |
| --------------------- | ------- | ---------------------------------------------------------------------------- |
| `enable_filters`      | `true`  | Master switch. Off means no hooks, no routes and no filter UI.               |
| `mobile_as_dropdown`  | `true`  | Whether the panel collapses to a dropdown on small screens.                  |
| `enable_ajax`         | `true`  | Whether filtering updates the grid without a page load.                      |
| `analytics_retention` | `90`    | How many days of filter and search records are kept.                         |
| `count_cache_ttl`     | `3600`  | How long option counts are cached, in seconds.                               |

## Filter sets

| Field       | Meaning                                                          |
| ----------- | ------------------------------------------------------------------ |
| `name`      | What the set is called.                                           |
| `slug`      | Its stable identifier, and how the storefront fetches it.         |
| `config`    | Which filters it offers and how they are presented.               |
| `placement` | Where it is intended to appear. Defaults to `sidebar`.            |
| `is_active` | Whether the set is offered.                                       |

A set is readable **publicly by slug**, which is what lets a themed or headless storefront render its own panel from the same configuration the widget uses.

## Analytics

Two things are recorded, each with the session and — where the customer is signed in — the user:

- **Filter usage** — the set, the filter type and value applied, and the number of results it produced.
- **Search queries** — the query typed and how many results it returned.

The result count is the useful part. A filter that is used often and returns nothing is a catalogue problem, and this is the data that shows it.

Both are pruned by the cleanup job to `analytics_retention` days.

## Admin screen

The **Advanced Filters** tab manages the filter sets and presents the analytics — which filters are used and what they return.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                       | Purpose                                                    | Permission           | Required args |
| ------ | -------------------------- | ------------------------------------------------------------ | -------------------- | ------------- |
| GET    | `/filters/sets`            | The active filter sets.                                     | Public, rate-limited | –             |
| GET    | `/filters/sets/{slug}`     | One set by slug, for the storefront to render.              | Public, rate-limited | `slug`        |
| GET    | `/filters/sets/all`        | Every set, including inactive ones.                         | `manage_woocommerce` | –             |
| POST   | `/filters/sets`            | Create a set.                                               | `manage_woocommerce` | `name`        |
| PATCH  | `/filters/sets/{id}`       | Update a set.                                               | `manage_woocommerce` | –             |
| DELETE | `/filters/sets/{id}`       | Delete a set.                                               | `manage_woocommerce` | `id`          |
| GET    | `/filters/analytics`       | What customers have filtered and searched by.               | `manage_woocommerce` | –             |
| GET    | `/products/filter`         | Products matching a filter combination.                     | Public, rate-limited | –             |

Note that `/filters/sets` and `/filters/sets/all` are two different routes with two different permissions: the public one returns active sets only, and the administrator one returns everything.

`GET /products/filter` sits at the top level of the namespace rather than under `/filters/`, so it does not collide with the [Product Filters](/modules/reference/product-filters) module's `/product-filters/filter`.

## WooCommerce integration

| Hook                  | What the module does                                      |
| --------------------- | ----------------------------------------------------------- |
| `pre_get_posts`       | Applies the filters to the product query.                  |
| `widgets_init`        | Registers the filters widget.                              |
| `wp_enqueue_scripts`  | Loads the filter assets.                                   |

**Shortcode** `[aiowc_filters]` renders a filter set on any page.

This is a much narrower hook surface than the free [Product Filters](/modules/reference/product-filters) module, which also renders into the shop loop, invalidates caches on product and term changes, and manages the SEO of filtered pages. This module does none of those.

## Database schema

| Table                              | Holds                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_filter_sets`        | The sets: name, slug, configuration, placement, active flag.                              |
| `{prefix}aiowc_filter_usage`       | One row per filter applied: the set, the filter type and value, the result count, session and user. |
| `{prefix}aiowc_search_queries`     | One row per search: the query, the result count, session and user.                         |

`aiowc_search_queries` is this module's table. The separate [Smart Product Search](/modules/reference/smart-search) module keeps its own query log as `aiowc_smart_search_queries`, so the two do not share rows — but they do record overlapping things.

## Background jobs

| Hook                          | Interval | Work                                                       |
| ----------------------------- | -------- | ------------------------------------------------------------ |
| `aiowc_filters_update_counts` | hourly   | Refreshes the cached option counts.                         |
| `aiowc_filters_cleanup`       | daily    | Prunes usage and query rows past `analytics_retention`.     |

Both run on WP-Cron, first scheduled an hour after the module is enabled.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module fires no filter or analytics events, so an integration cannot observe a filter being applied as it happens — only read the recorded history.

## Entitlement limits

`filters-advanced` is an on/off grant with no cap on the number of sets or recorded rows. The retention window is a store setting.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Counts are cached on a timer with no event-based invalidation.** Unlike the free [Product Filters](/modules/reference/product-filters) module, this one does not drop its cache when a product or category changes, so a count can be wrong for up to `count_cache_ttl` after the catalogue moves.
- **This module does nothing about the SEO of filtered pages.** The free module marks them non-indexable by default; this one does not, so a store running only this module can expose a large number of filtered URLs to crawlers.
- **Three modules hook `pre_get_posts` to change the product query** — this one, [Product Filters](/modules/reference/product-filters) and [Smart Product Search](/modules/reference/smart-search). Running more than one means several modules rewriting the same query. A store should choose one.
- Filter usage is recorded with a session id and, when signed in, a user id. That is behavioural data about identifiable customers, retained for 90 days by default, and it should be reflected in the store's privacy notice.
- There is no export of the analytics, so the data is only visible through the admin screen.
