---
id: recommendations
title: "Product Recommendations"
description: "Suggest products from what shoppers actually do on the store: interactions recorded and scores recalculated on a schedule, not hand-picked lists."
keywords:
  - woocommerce recommendations
  - related products
  - behavioural scoring
  - cross-sell
format: md
---
## Goal

Suggest products a shopper is likely to want, from what shoppers actually do on the store rather than
from hand-picked upsell lists. Interactions are recorded, scores are recalculated on a schedule, and
three strategies are blended into one ranking.

## Tier and entitlement

| Field           | Value             |
| --------------- | ----------------- |
| Tier            | Premium           |
| Entitlement key | `recommendations` |
| Admin tab       | `recommendations` |
| Module key      | `recommendations` |
| Settings prefix | `aiowc_rec_`      |

`registerHooks()` guards itself twice over: it returns early if the licence does not allow the module,
and again if `enable_recommendations` is off. The registry's own enabled-and-entitled check applies
before either.

## How the ranking works

Three services produce scores, which `Service/RecommendationEngine.php` blends by weight and filters by a
minimum score:

| Strategy      | Service                         | Basis                                                             |
| ------------- | ------------------------------- | ----------------------------------------------------------------- |
| Collaborative | `CollaborativeFilteringService` | Products interacted with by shoppers who interacted with this one |
| Content-based | `ContentBasedService`           | Product attributes and taxonomy overlap                           |
| Trending      | `TrendingAnalysisService`       | Interaction volume over the last 24 hours                         |

Each strategy is asked for three times the requested number of candidates, the results are combined by
weight, anything below `min_score_threshold` is dropped, and the blended result is cached for
`cache_duration` seconds.

## Settings

Read through `ModuleSettings` with the `aiowc_rec_` prefix; defaults are
`RecommendationsModule::DEFAULTS`. There is **no settings REST endpoint** — the module registers none, so
these values are changed through the options they are stored in.

| Setting                  | Default | Meaning                                           | Consumed                                             |
| ------------------------ | ------- | ------------------------------------------------- | ---------------------------------------------------- |
| `enable_recommendations` | `true`  | Master switch; off means no hooks register at all | Yes                                                  |
| `collaborative_weight`   | `40`    | Weight of the collaborative score                 | Yes                                                  |
| `content_based_weight`   | `30`    | Weight of the content-based score                 | Yes                                                  |
| `trending_weight`        | `30`    | Weight of the trending score                      | Yes                                                  |
| `min_score_threshold`    | `0.3`   | Blended score below which a candidate is dropped  | Yes                                                  |
| `cache_duration`         | `3600`  | Seconds a blended result is cached                | Yes                                                  |
| `interaction_days`       | `90`    | Age at which interaction rows are pruned          | Yes — passed to the cleanup job                      |
| `show_on_product_page`   | `true`  | Whether the product-page rails render             | Yes — decides whether the hook is added at all       |
| `show_on_cart`           | `true`  | Whether the cart cross-sells render               | Yes — decides whether the hook is added at all       |
| `max_recommendations`    | `8`     | Intended cap on items shown                       | **No** — never read; the handlers pass a literal `8` |
| `show_on_homepage`       | `true`  | Intended homepage placement                       | **No** — never read, and no homepage hook exists     |

## Admin screen

Admin tab `recommendations`. It
reads the trending and per-product recommendation endpoints and offers the manual refresh action.

## Database schema

Created by `Schema/RecommendationsSchema.php` at schema version `1.0.0`.

| Table                                       | Holds                                            |
| ------------------------------------------- | ------------------------------------------------ |
| `{prefix}aiowc_recommendation_views`        | Product views feeding the strategies             |
| `{prefix}aiowc_recommendation_interactions` | Interactions of other types, including purchases |
| `{prefix}aiowc_recommendation_scores`       | Scores written by the recalculation job          |
| `{prefix}aiowc_recommendation_cache`        | Cached blended results, keyed by algorithm       |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

| Method | Path                            | Purpose                                        | Required args        | Permission               |
| ------ | ------------------------------- | ---------------------------------------------- | -------------------- | ------------------------ |
| GET    | `/recommendations/{product_id}` | Recommendations for one product, up to `limit` | `product_id`         | Rate-limited public read |
| GET    | `/recommendations/personalized` | Recommendations for the caller, up to `limit`  | —                    | Rate-limited public read |
| GET    | `/recommendations/trending`     | Trending products, up to `limit`               | —                    | Rate-limited public read |
| POST   | `/recommendations/track`        | Record an interaction of the given `type`      | `product_id`, `type` | Public write check       |
| POST   | `/recommendations/refresh`      | Recalculate scores now                         | —                    | Manage                   |

## WooCommerce integration

| Hook                                       | Priority | Effect                                                                                                                                      |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `woocommerce_after_single_product_summary` | 15       | Renders two rails — "Frequently bought together" and "You may also like" — and records a view. Added only when `show_on_product_page` is on |
| `woocommerce_cart_collaterals`             | 20       | Renders cart cross-sells. Added only when `show_on_cart` is on                                                                              |
| `woocommerce_order_status_completed`       | 10       | Records a `purchase` interaction for the order's products                                                                                   |

### Shortcodes

| Shortcode                 | Purpose                        |
| ------------------------- | ------------------------------ |
| `[aiowc_recommendations]` | Renders a recommendations rail |
| `[aiowc_trending]`        | Renders the trending rail      |

No block is registered.

## Background jobs

All three run on the WordPress cron scheduler.

| Hook                              | Schedule                                                                       | Purpose                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `aiowc_recommendations_calculate` | Every 6 hours, via the custom `aiowc_every_6_hours` interval the job registers | Recalculates scores over the last 90 days of history                                                  |
| `aiowc_trending_update`           | Hourly                                                                         | Recomputes the trending list over a 24-hour window, normalises the scores and caches them for an hour |
| `aiowc_recommendations_cleanup`   | Daily                                                                          | Prunes interaction rows older than `interaction_days`                                                 |

The 90-day history window used by the recalculation job is a constant in the job, separate from the
`interaction_days` setting the cleanup job uses.

## Entitlement limits

The `recommendations` entitlement gates the module, and `registerHooks()` re-checks it before doing
anything. No quota on tracked interactions or generated recommendations is implemented.

## Related documentation

- [Module Architecture](/reference/architecture)
