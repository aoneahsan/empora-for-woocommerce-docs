---
id: smart-search
title: "Smart Product Search"
description: "Autocomplete attached to the theme's own search box, with fuzzy matching, hand-written and trending suggestions, and a hit-counted result cache."
keywords:
  - woocommerce search autocomplete
  - smart search
  - trending searches
  - search suggestions
format: md
---
## Overview

Smart Product Search attaches to the store's existing search input and adds autocomplete beneath it. Suggestions come from a table that mixes two sources: entries an administrator added by hand, and entries the module derived from what customers actually searched for.

Its distinguishing feature is **trending**: a background job promotes queries that are being searched now, so the suggestions a customer sees reflect current demand rather than a static list.

It also caches result sets by query, with a hit count — so a popular search is answered from cache and the cache itself shows which queries are carrying the load.

It is for stores wanting a better search box without replacing their search form.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `smart-search`                                                  |
| Tier            | Premium                                                         |
| Entitlement key | `smart-search`                                                  |
| Admin tab       | `smart-search`                                                  |
| Enabled option  | `aiowc_module_enabled_smart-search` (off until turned on)       |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs.

`registerHooks()` returns early when the licence does not grant `smart-search`.

## Settings

Stored in the bundled option row `aiowc_ss_settings`.

| Stored key            | Default              | Meaning                                                             |
| --------------------- | -------------------- | --------------------------------------------------------------------- |
| `enable_smart_search` | `true`               | Whether the module's search is used.                                 |
| `enable_autocomplete` | `true`               | Whether suggestions appear as the customer types.                    |
| `enable_fuzzy`        | `true`               | Whether a misspelling still matches.                                 |
| `search_sku`          | `true`               | Whether SKUs are searched.                                           |
| `search_tags`         | `true`               | Whether tags are searched.                                           |
| `max_suggestions`     | `8`                  | How many suggestions are offered.                                    |
| `autocomplete_delay`  | `200`                | Milliseconds waited after a keystroke.                               |
| `analytics_retention` | `90`                 | How many days of query records are kept.                             |
| `input_selector`      | `input[name="s"]`    | **The CSS selector for the search box the module attaches to.**      |

`input_selector` is the setting that decides whether this module works at all on a given theme. It defaults to WordPress's standard search input; a theme using a different name or a custom component needs the selector changed to match.

## Suggestions

| Field         | Meaning                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| `suggestion`  | The text offered to the customer.                                        |
| `weight`      | How strongly it is preferred.                                            |
| `source`      | Where it came from. `manual` by default; the trending job writes others. |
| `product_id`  | The product it points at, where it points at one.                        |
| `is_active`   | Whether it is offered.                                                   |

Because `source` distinguishes hand-written from derived suggestions, an administrator's entries are not overwritten by what the job derives.

## Query logging and trending

Every search writes a row carrying the query, a **normalised** form of it, the result count, the product clicked if any, the session and the user where signed in.

Normalising matters: it is what lets "Red Shoes", "red shoes" and "red  shoes" count as the same query when the trending job ranks them, rather than as three separate ones.

The trending job runs daily and turns that log into weighted suggestions. Records are pruned to `analytics_retention` days.

## Caching

A cache row holds a query, its results and an expiry, plus a **hit count** that increments on every use. That count is genuinely useful: it identifies which queries carry the traffic, which is the set worth optimising.

## Admin screen

The **Smart Search** tab manages the suggestion list — adding and removing entries — and presents the search analytics.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                              | Purpose                                          | Permission           | Required args |
| ------ | --------------------------------- | -------------------------------------------------- | -------------------- | ------------- |
| GET    | `/smart-search/autocomplete`      | Suggestions for a partial query (`q`).            | Public, rate-limited | `q`           |
| GET    | `/smart-search/results`           | Search results for a query (`q`).                 | Public, rate-limited | `q`           |
| GET    | `/smart-search/suggestions`       | The active suggestion list.                       | Public, rate-limited | –             |
| POST   | `/smart-search/suggestions`       | Add a suggestion (`text`).                        | `manage_woocommerce` | `text`        |
| DELETE | `/smart-search/suggestions/{id}`  | Remove a suggestion.                              | `manage_woocommerce` | `id`          |
| GET    | `/smart-search/analytics`         | Queries, counts and click-through.                | `manage_woocommerce` | –             |
| GET    | `/smart-search/settings`          | The nine settings above.                          | `manage_woocommerce` | –             |
| PATCH  | `/smart-search/settings`          | Update any subset of them.                        | `manage_woocommerce` | –             |

The settings pair was added on 2026-09-13; before that the nine settings could not be read or written over REST at all. A write updates only the keys it sends, and values are clamped to their documented bounds — `max_suggestions` to 50, `autocomplete_delay` to a floor of 50 ms — so an out-of-range value is corrected rather than rejected. Sending an empty `input_selector` restores the default rather than storing a selector that would match nothing.

## WooCommerce integration

| Hook                  | What the module does                                             |
| --------------------- | ------------------------------------------------------------------ |
| `pre_get_posts`       | Applies the module's search to the product query.                 |
| `wp_enqueue_scripts`  | Loads the autocomplete assets, configured with `input_selector`.   |

A deliberately small surface: the module attaches to the theme's existing input from JavaScript rather than replacing WordPress's search form, which is why it does not hook `get_search_form` the way [AJAX Live Search](/modules/reference/search) does.

The module registers **no shortcode**.

## Database schema

| Table                                   | Holds                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_smart_search_queries`    | Every search: the query and its normalised form, result count, clicked product, session, user. |
| `{prefix}aiowc_search_suggestions`      | The suggestions: text, weight, source, optional product, active flag.                         |
| `{prefix}aiowc_search_cache`            | Cached result sets: the cache key and query, the results, a hit count and an expiry.           |

The query table carries a `smart_search_` prefix because [Advanced Product Filters](/modules/reference/filters-advanced) owns the plainer `aiowc_search_queries`. The two never share a row.

## Background jobs

| Hook                                | Interval | Work                                                            |
| ----------------------------------- | -------- | ----------------------------------------------------------------- |
| `aiowc_smart_search_index_rebuild`  | hourly   | Rebuilds the module's search data.                               |
| `aiowc_search_trending`             | daily    | Promotes currently popular queries into weighted suggestions.    |

Both run on WP-Cron, first scheduled an hour after the module is enabled.

⚠️ Note the trending job's hook is `aiowc_search_trending` — without a `smart_search` prefix — while its sibling index job is prefixed. That is worth knowing when reading a cron listing.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module fires no search events and exposes no relevance filter.

## Entitlement limits

`smart-search` is an on/off grant with no cap on suggestions, queries or cached rows. The retention window and suggestion count are store settings.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- The nine settings are reachable over REST at `GET`/`PATCH /smart-search/settings`, but **no admin screen edits them yet** — they are set programmatically or left at their defaults.
- **Two search modules ship and both maintain their own data.** This one and [AJAX Live Search](/modules/reference/search) each keep a separate query log and rebuild job. Running both indexes the catalogue twice and splits the record of what customers searched for. A store should pick one — and the other module additionally offers synonyms, click tracking and an index-weight column.
- **Three modules hook `pre_get_posts` to change the product query** — this one, [Product Filters](/modules/reference/product-filters) and [Advanced Product Filters](/modules/reference/filters-advanced). Running more than one means several modules rewriting the same query.
- Search queries are stored with a session id and, for signed-in customers, a user id, retained 90 days by default. That belongs in the store's privacy notice.

## Changed on 2026-09-13

- 🔴 **Autocomplete never worked on any theme, for a reason this page did not name.** The frontend was pointed at `aiowc/v1/search/autocomplete` and `.../search/results`, and neither route exists — this module registers `/smart-search/autocomplete` and `/smart-search/results`. Every request 404'd regardless of the theme or the selector. That is now fixed, and it, rather than `input_selector`, is the likely reason the module looked dead.
- **`input_selector` no longer fails silently.** There is a documented fallback chain, and a console warning naming which case applied — invalid CSS, a fallback substituted, or nothing matched at all. The warning is shown only to `WP_DEBUG` sites and users who can manage WooCommerce, so it reaches whoever can fix it and never a shopper. Every fallback requires `name="s"`, the WordPress search query var, so the chain cannot bind to an unrelated input.
- **The nine settings gained a REST route.** They previously had none and could not be read or written programmatically at all.
