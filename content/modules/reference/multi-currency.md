---
id: multi-currency
title: "Multi-Currency"
description: "Sell in several currencies with scheduled exchange rates, per-currency rounding and markup, fixed per-product prices, geolocation detection and gateway restrictions."
keywords:
  - woocommerce multi currency
  - currency switcher
  - exchange rates
  - geolocation currency
format: md
---
## Overview

Multi-Currency lets a store display and take payment in several currencies. A currency is a stored row carrying its symbol, formatting, exchange rate, rounding and an optional markup, and the module converts prices everywhere WooCommerce shows one.

Conversion is not the whole feature. A currency can be **detected** from the visitor's location and switched by the customer, a **fixed price** can override conversion for a particular product in a particular currency, payment gateways can be restricted per currency, and the chosen currency is reflected in the structured data and canonical URL so search engines are not shown one currency and customers another.

Rates come from an exchange-rate provider on a schedule, with every fetch kept in a history table.

It is for stores selling across borders.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `multi_currency`                                                |
| Tier            | Premium                                                         |
| Entitlement key | `multi_currency`                                                |
| Admin tab       | `multi-currency`                                                |
| Enabled option  | `aiowc_module_enabled_multi_currency` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the three tables below and schedules the rate update and history cleanup jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored under the `aiowc_mc_` prefix. The setting that matters most is `rate_provider`, which defaults to **`open_exchange_rates`**.

## Currencies

| Field                                    | Meaning                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `code`, `name`, `symbol`                 | The currency and how it is named and marked.                                |
| `symbol_position`                        | `left`, `right`, `left_space` or `right_space`.                             |
| `decimal_separator`, `thousand_separator`, `decimals` | How amounts are formatted.                                     |
| `exchange_rate`, `rate_updated_at`       | The rate against the base currency, to ten decimal places, and when it was set. |
| `is_default`, `is_enabled`, `priority`   | Which currency is the base, which are offered, and in what order.            |
| `rounding_type`, `rounding_value`        | `none`, `up`, `down` or `nearest`, and the increment rounded to.             |
| `pricing_markup`                         | A percentage added on conversion, for covering the cost of selling abroad.   |
| `flag_emoji`                             | The flag shown in the switcher.                                             |

Rounding and markup are what turn a raw conversion into a sane shelf price — a converted 18.47 can be presented as 18.99 rather than as the arithmetic result.

## Exchange rates

Two providers are implemented: **Open Exchange Rates** (the default) and **ExchangeRate-API**.

🔴 **Both require an API key, and neither ships with one.** A provider reports itself unconfigured while its key is empty, so with no key the scheduled update fetches nothing. That is not a failure state — the module still works, because a rate can be set by hand per currency through `PUT /multi-currency/rates/{currency}` or the admin screen. What a store does not get without a key is **automatic** rate updates.

Every fetched rate is written to a history table with its provider and timestamp, so a past conversion can be explained. The history is pruned by its own job.

## Fixed prices

Conversion can be overridden per product and currency: a fixed price row carries a regular price, a sale price and the sale window for one product or variation in one currency. Where a fixed price exists it is used instead of converting, which is how a store sets a round local price rather than a converted one.

## Payment gateways

Gateways can be configured per currency, and `woocommerce_available_payment_gateways` is filtered accordingly — so a gateway that cannot settle in the selected currency is not offered rather than failing at the end of checkout.

## Detection and switching

The customer's currency is held in a cookie lasting 30 days. It can be detected from their location, suggested to them, or switched explicitly — each backed by its own public route. A currency switcher is available as a widget and as the `[aiowc_currency_switcher]` shortcode.

## SEO handling

The module hooks `get_canonical_url`, `woocommerce_structured_data_product`, and Yoast's `wpseo_canonical` and `wpseo_sitemap_entry`. The intent is that a crawler sees one canonical page with consistent structured data rather than a different price per visit.

## Admin screen

The **Multi-Currency** tab manages the currencies — creating, editing, bulk actions, setting the default — shows an overview, lists the rate providers and their configuration state, sets a rate by hand, triggers a rate update, shows rate history per currency, manages per-product fixed prices, and configures gateway availability per currency.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

### Administrator routes — `manage_woocommerce`

| Method            | Path                                             | Purpose                                   |
| ----------------- | ------------------------------------------------ | ------------------------------------------- |
| GET / POST        | `/multi-currency/currencies`                     | List and create currencies.                |
| GET / PATCH / PUT / POST / DELETE | `/multi-currency/currencies/{id}`| Manage one currency.                       |
| POST              | `/multi-currency/currencies/{id}/set-default`    | Make a currency the base.                  |
| POST              | `/multi-currency/currencies/bulk`                | Act on several at once.                    |
| GET               | `/multi-currency/overview`                       | Summary of the configuration.              |
| GET               | `/multi-currency/providers`                      | The rate providers and whether each is configured. |
| PATCH / PUT /POST | `/multi-currency/rates/{currency}`               | Set a rate by hand.                        |
| GET               | `/multi-currency/rates/history`                  | Past rates for a currency.                 |
| POST              | `/multi-currency/rates/update`                   | Fetch rates now.                           |
| GET / POST        | `/multi-currency/products/{product_id}/prices`   | Read and set fixed prices.                 |
| DELETE            | `/multi-currency/products/{product_id}/prices/{currency}` | Remove a fixed price.             |
| GET               | `/multi-currency/gateways`                       | Gateway availability per currency.         |
| PATCH / PUT /POST | `/multi-currency/gateways/{gateway_id}`          | Set a gateway's mode.                      |
| GET / PATCH / PUT / POST | `/multi-currency/settings`                | Read and write the settings.               |

### Storefront routes — public, rate-limited

| Method | Path                        | Purpose                                              |
| ------ | --------------------------- | ------------------------------------------------------ |
| GET    | `/public/currencies`        | The currencies on offer.                              |
| GET    | `/public/currency`          | The visitor's current currency.                       |
| POST   | `/public/currency/switch`   | Switch currency (`code`).                             |
| POST   | `/public/currency/detect`   | Detect a currency from location.                      |
| GET    | `/public/currency/suggest`  | Suggest one without switching.                        |
| GET    | `/public/currency/gateways` | Which gateways work in the current currency.          |
| GET    | `/public/convert`           | Convert one price (`price`).                          |
| POST   | `/public/convert/batch`     | Convert many prices at once (`prices`).               |

The batch route exists so a catalogue page converts in one request rather than one per product.

## WooCommerce integration

| Area          | Hooks                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Currency      | `woocommerce_currency`, `woocommerce_currency_symbol`, `wc_price_args`                                     |
| Product price | `woocommerce_product_get_price`, `_get_regular_price`, `_get_sale_price`, the three `product_variation_get_*` equivalents, `woocommerce_variation_prices`, `woocommerce_get_variation_prices_hash` |
| Display       | `woocommerce_get_price_html`, `woocommerce_cart_item_price`, `_cart_item_subtotal`                         |
| Cart          | `woocommerce_before_calculate_totals`, `woocommerce_before_cart`, `woocommerce_add_to_cart_fragments`, `woocommerce_widget_shopping_cart_before_buttons` |
| Checkout      | `woocommerce_before_checkout_form`, `_checkout_process`, `_checkout_create_order`, `_checkout_order_created` |
| Gateways      | `woocommerce_available_payment_gateways`                                                                  |
| Shipping      | `woocommerce_package_rates`                                                                               |
| Coupons       | `woocommerce_coupon_get_amount`                                                                           |
| Order         | `woocommerce_admin_order_data_after_billing_address`, `woocommerce_email_order_meta_fields`                 |
| SEO           | `get_canonical_url`, `woocommerce_structured_data_product`, `wpseo_canonical`, `wpseo_sitemap_entry`        |
| Other         | `widgets_init`, `wp_head`, `wp_enqueue_scripts`, `wp_ajax_aiowc_get_mini_cart` and its `nopriv` counterpart |

The variation prices **hash** filter matters: without it WooCommerce would cache one currency's variation prices and serve them to everyone.

## Database schema

| Table                                     | Holds                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_currencies`                | The currencies: code, name, symbol and its position, separators and decimals, rate and when it was set, default and enabled flags, priority, rounding, markup, flag. |
| `{prefix}aiowc_exchange_rate_history`     | Every rate fetched: the currency, the base, the rate, the provider and when.                  |
| `{prefix}aiowc_currency_fixed_prices`     | Per-product, per-currency overrides: regular and sale price and the sale window.               |

## Background jobs

| Hook                                       | Work                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| `aiowc_multi_currency_rate_update`         | Fetches rates from the configured provider.                  |
| `aiowc_multi_currency_history_cleanup`     | Prunes the rate history.                                     |

They run on Action Scheduler. The module registers its own interval set — hourly, twice daily, daily and weekly — so the update frequency is a store's choice rather than fixed.

## Action hooks for integrators

| Hook                                   | Purpose                                                             |
| -------------------------------------- | --------------------------------------------------------------------- |
| `aiowc_currency_changed`               | The visitor switched currency.                                       |
| `aiowc_multi_currency_order_created`   | An order was created, with the currency it was placed in.            |
| `aiowc_mini_cart_fragments`            | Filter — adjust the mini-cart fragments the module refreshes.         |
| `aiowc_track_event`, `aiowc_capture_error` | Module lifecycle and caught errors.                               |

This module also **provides** `aiowc_get_enabled_currencies` and `aiowc_get_exchange_rate`, which [Gift Cards & Store Credit](/modules/reference/gift-cards) reads to price a card in the customer's currency.

## Entitlement limits

`multi_currency` is an on/off grant with no cap on the number of currencies, rates or fixed prices.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.

## Known gaps

- **Automatic rate updates need an API key for one of the two providers, and none is supplied.** Without a key the scheduled job fetches nothing and rates stay where they were last set, silently. Set rates by hand, or add a key. The providers list endpoint reports which are configured, so this is checkable.
- The module filters product prices with the same WooCommerce hooks the two pricing modules use. Running Multi-Currency alongside [Dynamic Pricing](/modules/reference/dynamic-pricing) or [Dynamic Pricing Rules](/modules/reference/dynamic-pricing-rules) means several filters adjusting one price, and the outcome depends on filter order.
- A markup and a rounding rule are per currency, not per product or category, so a store cannot mark up only the items where shipping abroad is expensive.
- Rate history is pruned on a schedule with no retention setting exposed alongside the other currency options.
