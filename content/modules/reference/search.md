---
id: search
title: "AJAX Live Search"
description: "Instant product search from a dedicated full-text index, with synonyms, fuzzy matching, per-row weighting and click-through analytics."
keywords:
  - woocommerce ajax search
  - live product search
  - search synonyms
  - fuzzy search
format: md
---
## Overview

AJAX Live Search replaces WooCommerce's search box with one that answers while the customer types. Results come from the module's **own index table** rather than from a `LIKE` query against posts, so matching is fast and the index can be weighted.

Three things make the matching better than a plain search. The index stores title, content, SKU and terms separately, so a store can decide what is searched. **Synonyms** map a term a customer types to the terms the catalogue uses. And **fuzzy matching** tolerates a misspelling, with a configurable threshold.

Searches are logged with their result counts, and a click on a result is recorded against the search that produced it — which is what makes "what did people search for and did they find it" answerable.

It is for stores whose catalogue is too large to browse.

## Availability

| Item            | Value                                                     |
| --------------- | ----------------------------------------------------------- |
| Module key      | `search`                                                   |
| Tier            | Premium                                                    |
| Entitlement key | `search`                                                   |
| Admin tab       | `search`                                                   |
| Enabled option  | `aiowc_module_enabled_search` (off until turned on)        |
| REST namespace  | `aiowc/v1`                                                 |

Enabling the module creates the three tables below and schedules the index rebuild and log cleanup jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored in the bundled option row `aiowc_als_settings`.

| Stored key        | Default               | Meaning                                                          |
| ----------------- | --------------------- | ------------------------------------------------------------------ |
| `min_chars`       | `2`                   | How many characters before a search fires.                        |
| `max_results`     | `10`                  | How many results the dropdown shows.                              |
| `search_in`       | `title,content,sku`   | Which indexed fields are searched, as a comma-separated list.     |
| `fuzzy_enabled`   | `true`                | Whether a near-miss still matches.                                |
| `fuzzy_threshold` | `70`                  | How close a near-miss must be, as a similarity percentage.        |
| `debounce_ms`     | `300`                 | Milliseconds waited after a keystroke before searching.           |
| `show_images`     | `true`                | Whether results show a product image.                             |
| `show_prices`     | `true`                | Whether results show a price.                                     |
| `show_categories` | `true`                | Whether results show the product's category.                      |

`search_in` is the setting worth understanding: dropping `content` makes search much stricter and usually more precise, since a word appearing anywhere in a long description no longer counts as a match.

## The index

Each indexed row holds the object type and id, its title, content, SKU and terms, and a **weight** — so a product can be promoted or demoted in results without changing its content.

Matching uses MySQL's own **full-text index**, in boolean mode, and results are ordered by the full-text relevance score **multiplied by the row's weight**. A SKU lookup and a title lookup are handled as separate prefix and substring queries, so a customer typing a part number is not at the mercy of word-based relevance. This means the module needs a database whose storage engine supports full-text indexing on the index table.

The index is maintained incrementally: the module hooks `woocommerce_new_product`, `woocommerce_update_product`, `woocommerce_trash_product` and `before_delete_post`, so a product edited in the admin is re-indexed straight away rather than waiting for the rebuild job. The job is the safety net, not the mechanism.

## Synonyms

A synonym row maps a term to a list of alternatives, stored as JSON. This is how "sofa" finds "couch", or how a customer's word for a product finds the manufacturer's. Synonyms are managed through their own routes.

## Search analytics

Every search writes a row with the query, the result count, the session and — when signed in — the user. `POST /search/click` then records which product was opened from that search, tying the outcome back to the query.

A search with results that nobody clicks is a different problem from a search with no results, and the two are distinguishable here.

## Admin screen

The **Search** tab shows an overview and the search analytics, manages synonyms, reports index statistics, triggers a rebuild, and edits the nine settings.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                        | Purpose                                              | Permission           | Required args           |
| ------ | --------------------------- | ------------------------------------------------------ | -------------------- | ----------------------- |
| GET    | `/search`                   | Search the index (`q`).                               | Public, rate-limited | `q`                     |
| GET    | `/search/suggestions`       | Suggestions for a partial query.                      | Public, rate-limited | –                       |
| POST   | `/search/click`             | Record which result was opened.                       | Public, rate-limited | `log_id`, `product_id`  |
| GET    | `/search/analytics`         | Queries, counts and click-through.                    | `manage_woocommerce` | –                       |
| GET    | `/search/overview`          | Summary of search activity.                           | `manage_woocommerce` | –                       |
| GET    | `/search/index/stats`       | Index size and freshness.                             | `manage_woocommerce` | –                       |
| POST   | `/search/index/rebuild`     | Rebuild the index now.                                | `manage_woocommerce` | –                       |
| GET    | `/search/synonyms`          | Every synonym.                                        | `manage_woocommerce` | –                       |
| POST   | `/search/synonyms`          | Add a synonym.                                        | `manage_woocommerce` | `term`, `synonyms`      |
| DELETE | `/search/synonyms/{id}`     | Remove a synonym.                                     | `manage_woocommerce` | `id`                    |
| GET / PATCH / PUT / POST | `/search/settings` | Read and write the settings.                        | `manage_woocommerce` | –                       |

`/search/click` is a public write, which is unusual but necessary: the click happens in the customer's browser, and it carries only a log id and a product id.

## WooCommerce integration

| Hook                                    | What the module does                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| `get_search_form`, `get_product_search_form` | Replaces the search form with the live one.                     |
| `woocommerce_before_shop_loop`          | Renders the search box above the catalogue.                          |
| `woocommerce_no_products_found`         | Offers suggestions when a search returns nothing.                    |
| `woocommerce_product_query_meta_query`  | Applies the search to the product query.                             |
| `woocommerce_new_product`, `_update_product`, `_trash_product`, `before_delete_post` | Keeps the index in step with the catalogue. |
| `the_title`                             | Used when rendering results.                                         |
| `wp_enqueue_scripts`, `wp_footer`       | Loads the search assets and the results container.                   |

The module registers **no shortcode** — the search box is placed by replacing WordPress's own search form, not by being dropped into a page.

## Database schema

| Table                              | Holds                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_search_index`       | The searchable copy of each product: type and id, title, content, SKU, terms, and a weight.     |
| `{prefix}aiowc_search_synonyms`    | Term-to-alternatives mappings, stored as JSON.                                                  |
| `{prefix}aiowc_search_log`         | Every search: the query, result count, session, user, and the product clicked from it.          |

## Background jobs

| Hook                          | Work                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| `aiowc_search_index_rebuild`  | Rebuilds the whole index, as a safety net behind the live updates.    |
| `aiowc_search_log_cleanup`    | Prunes old search log rows.                                           |

Both run on Action Scheduler.

## Action hooks for integrators

| Hook                    | Fired when                                    |
| ----------------------- | ----------------------------------------------- |
| `aiowc_track_event`     | The module is enabled or disabled.             |
| `aiowc_capture_error`   | An error is caught during indexing or search.  |

The module exposes no filter for adjusting relevance or result ordering.

## Entitlement limits

`search` is an on/off grant with no cap on the index, synonyms or log rows.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two search modules ship and both maintain their own index.** This one and [Smart Product Search](/modules/reference/smart-search) each keep a separate index, a separate query log and a separate rebuild job. Running both means indexing the catalogue twice and collecting two incomplete pictures of what customers searched for. A store should pick one.
- The log-cleanup job has **no retention setting** — unlike the two analytics modules, how long search logs are kept is not exposed as an option.
- Search queries are stored with a session id and, for signed-in customers, a user id. That is behavioural data about identifiable people and belongs in the store's privacy notice.
- There is no relevance filter, so result ordering can only be influenced through the per-row index weight.
- `weight` is on the index row but there is no route or screen for setting it, so promoting a product means writing to the table directly.
