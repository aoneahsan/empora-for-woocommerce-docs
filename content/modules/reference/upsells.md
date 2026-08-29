---
id: upsells
title: "Sales Funnels & Upsells"
description: "Offer extra products at four points: a checkout bump, a post-purchase offer, frequently bought together, and a cart cross-sell, with A/B testing."
keywords:
  - woocommerce upsells
  - order bump
  - post purchase offer
  - cross-sell
format: md
---
## Overview

The Upsells module offers extra products at four points in the journey: a bump on the checkout order review, a post-purchase offer on the thank-you page, a "frequently bought together" block on the product page, and a cross-sell block under the cart table.

Each offer records its own impressions, conversions and revenue, and two offers can be run against each other as an A/B test that a daily job settles once enough traffic has been seen.

It is for stores trying to raise average order value without a separate funnel plugin. Offers are stored in the plugin's own table rather than as WooCommerce products.

## Availability

| Item            | Value                                                |
| --------------- | ---------------------------------------------------- |
| Module key      | `upsells`                                            |
| Tier            | Premium                                              |
| Entitlement key | `upsells`                                            |
| Admin tab       | `upsells`, under **Pricing & Promotions**            |
| Enabled option  | `aiowc_module_enabled_upsells` (off until turned on) |
| REST namespace  | `aiowc/v1`                                           |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs through Action Scheduler. Disabling it cancels them.

## Settings

Stored in the bundled option row `aiowc_up_settings`; legacy per-key options `aiowc_up_<key>` are migrated on first read, which `registerHooks()` triggers before any setting is read.

| Stored key              | Default      | Meaning                                                                             |
| ----------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `enable_order_bumps`    | `true`       | Register the checkout order-bump handler.                                           |
| `enable_post_purchase`  | `true`       | Register the thank-you-page handler.                                                |
| `enable_fbt`            | `true`       | Register the frequently-bought-together handler.                                    |
| `fbt_algorithm`         | `manual`     | Recorded and returned by the settings route; suggestions come from matching offers. |
| `default_discount_type` | `percentage` | The discount type a new offer starts with.                                          |
| `ab_test_min_sample`    | `100`        | Impressions a variant needs before an A/B test may be settled.                      |

The three `enable_*` settings are read once, when hooks are registered: turning one off means that handler is never constructed on the request. The cart cross-sell handler has no switch and is always registered.

## Offer types

| Type            | Where it appears                               |
| --------------- | ---------------------------------------------- |
| `order_bump`    | Checkout, before the submit button.            |
| `post_purchase` | The thank-you page, after the order is placed. |
| `fbt`           | The single product page, under the summary.    |
| `cross_sell`    | Under the cart table.                          |

Each offer carries trigger product ids, offer product ids, a discount type (`percentage`, `fixed` or `free`) and value, a priority, a display position, a conditions JSON blob and a status. Impressions, conversions and revenue accumulate on the offer row.

## A/B tests

A test pairs two offer ids as variant A and variant B with a traffic split, defaulting to 50. `AbTestEvaluationJob` runs daily and settles a test once each variant has at least `ab_test_min_sample` impressions, writing the winner id and the completion time onto the test row.

## Admin screen

The **Upsells & Order Bumps** tab shows three summary tiles and a table of offers, and calls `GET /upsells/offers`.

Two things about it are worth knowing before relying on it:

- **The offer table does not populate.** The route answers with a paginated object — `items`, `total`, `page`, `perPage`, `totalPages` — while the admin client types the payload as a plain array and the page falls back to an empty list when it is not one. The result is an empty table whatever the database holds.
- **The "Create Offer" button creates nothing.** It shows a message directing the reader to "Products → Add New, set the product type to Upsell offer", and no such product type or product-edit screen exists in the module. Offers can only be created through the REST routes below.

## REST API endpoints

All routes are on `aiowc/v1`, require `manage_woocommerce` — plus a REST nonce on cookie-authenticated requests — and answer with the `{ success, data, message }` envelope.

| Method             | Path                     | Purpose                                                                    | Required args |
| ------------------ | ------------------------ | -------------------------------------------------------------------------- | ------------- |
| GET                | `/upsells/offers`        | Paginated offers; filters `type` and `status`, plus `page` and `per_page`. | –             |
| POST               | `/upsells/offers`        | Create an offer.                                                           | –             |
| GET                | `/upsells/offers/{id}`   | Read one offer.                                                            | –             |
| PUT / PATCH / POST | `/upsells/offers/{id}`   | Update an offer.                                                           | –             |
| DELETE             | `/upsells/offers/{id}`   | Delete an offer.                                                           | –             |
| GET                | `/upsells/ab-tests`      | List A/B tests.                                                            | –             |
| POST               | `/upsells/ab-tests`      | Create an A/B test over two offer variants.                                | –             |
| GET                | `/upsells/ab-tests/{id}` | Results for one test.                                                      | –             |
| GET                | `/upsells/analytics`     | Impressions, conversions and revenue across offers.                        | –             |
| GET                | `/upsells/settings`      | Read the settings above.                                                   | –             |
| PUT / PATCH / POST | `/upsells/settings`      | Update the settings above.                                                 | –             |

## WooCommerce integration

| Hook                                       | Priority | What the module does                        |
| ------------------------------------------ | -------- | ------------------------------------------- |
| `woocommerce_review_order_before_submit`   | 20       | Draws the order bumps at checkout.          |
| `woocommerce_checkout_order_processed`     | 10       | Applies accepted bumps to the order.        |
| `woocommerce_thankyou`                     | 5        | Draws the post-purchase offers.             |
| `woocommerce_after_single_product_summary` | 15       | Draws the frequently-bought-together block. |
| `woocommerce_after_cart_table`             | 10       | Draws the cart cross-sell block.            |
| `wp_enqueue_scripts`                       | 10       | Enqueues each handler's assets.             |

Accepting or declining an offer goes through `admin-ajax.php`, registered for both signed-in and guest shoppers:

| AJAX action                   | Effect                                               |
| ----------------------------- | ---------------------------------------------------- |
| `aiowc_accept_order_bump`     | Accept a checkout bump.                              |
| `aiowc_accept_post_purchase`  | Accept a post-purchase offer.                        |
| `aiowc_decline_post_purchase` | Decline a post-purchase offer.                       |
| `aiowc_add_fbt_bundle`        | Add a frequently-bought-together bundle to the cart. |

## Database schema

| Table                           | Holds                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_upsell_offers`   | Offers: title, type, trigger and offer product ids, discount, priority, position, conditions, status, and running impression, conversion and revenue counters. |
| `{prefix}aiowc_upsell_ab_tests` | Tests: offer id, the two variant ids, traffic split, status, winner and timestamps.                                                                            |
| `{prefix}aiowc_upsell_logs`     | One row per impression, acceptance and decline, with the variant and revenue.                                                                                  |

Offer reads are cached in transients keyed `aiowc_up_offer_*` for an hour.

## Background jobs

| Hook                       | Interval | Work                                                                                        |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `aiowc_upsell_ab_evaluate` | daily    | Settles A/B tests whose variants have passed `ab_test_min_sample` impressions.              |
| `aiowc_upsell_log_cleanup` | weekly   | Deletes log rows older than 180 days, filterable through `aiowc_upsell_log_retention_days`. |

## Entitlement limits

`upsells` is an on/off grant with no numeric cap. The numeric limits in the module are store settings and constants: the A/B minimum sample, the 180-day log retention and the one-hour offer cache.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- The admin offer table reads a response shape the route does not return, so it is always empty.
- The "Create Offer" control points at a product type that does not exist; there is no create, edit or delete UI for offers, and no A/B test or analytics screen.
- `fbt_algorithm` is stored and returned but does not select an algorithm — frequently-bought-together suggestions come from offers whose trigger products match, whatever the value.
