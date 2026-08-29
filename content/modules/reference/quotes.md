---
id: quotes
title: "Request a Quote"
description: "Replace add-to-cart with a quote basket for negotiated prices: a request, a message thread with the shop, and an offer the customer can accept."
keywords:
  - woocommerce request a quote
  - quote basket
  - b2b quoting
  - negotiated pricing
format: md
---
## Goal

Replace "add to cart" with "request a quote" for products whose price is negotiated. A visitor collects
products in a quote basket, submits a request, exchanges messages with the shop, and receives offered
prices. An accepted quote is converted into a real WooCommerce order. It is for trade, wholesale and
made-to-order stores.

## Tier and entitlement

| Field           | Value       |
| --------------- | ----------- |
| Tier            | Premium     |
| Entitlement key | `quotes`    |
| Admin tab       | `quotes`    |
| Module key      | `quotes`    |
| Settings prefix | `aiowc_qt_` |

Hooks register only when `aiowc_module_enabled_quotes` is true and the licence permits the `quotes`
entitlement.

## What the code does

- A quote basket held per visitor, driven by three admin-ajax actions that are registered for both
  signed-in and signed-out visitors.
- A **Request a Quote** button rendered after the add-to-cart button on the single product page and in
  the shop loop.
- Quote requests carrying the customer's email, name, phone, company and notes, plus the requested items.
- A message thread on each quote, written to by both the customer and the shop.
- Offered prices set per item by the shop, and a customer-facing accept action.
- Conversion of an accepted quote into a WooCommerce order through `wc_create_order()`.
- A **Quotes** endpoint added to the WooCommerce My Account area, with its own menu item and page title.
- Six transactional emails sent through `wp_mail`, driven by the module's own actions rather than the
  WooCommerce email system.

### Quote statuses

`updateStatus()` accepts exactly six: `pending`, `replied`, `accepted`, `declined`, `expired` and
`converted`. Any other value is rejected.

## Settings

Read through `ModuleSettings` with the `aiowc_qt_` prefix; defaults are `QuotesModule::DEFAULTS`.

| Setting                | Default | Meaning                                                                      |
| ---------------------- | ------- | ---------------------------------------------------------------------------- |
| `enable_for_guests`    | `true`  | Whether a signed-out visitor may request a quote                             |
| `require_login`        | `false` | Whether a request demands an account                                         |
| `quote_validity_days`  | `14`    | Days a quote stays valid before the expiry job closes it                     |
| `notification_email`   | empty   | Address the shop's copies are sent to                                        |
| `enable_negotiations`  | `true`  | Whether the message thread is offered                                        |
| `min_quote_amount`     | `0`     | Minimum basket value a request must reach                                    |
| `show_on_all_products` | `false` | Whether the quote button appears on every product rather than a selected set |
| `basket_page_id`       | `0`     | Page holding the quote basket shortcode                                      |
| `reminder_days_before` | `3`     | Days before expiry that the reminder is sent                                 |

## Admin screen

Admin tab `quotes`. It lists quotes with
status and search filters, opens a quote to read and reply to its message thread, sets offered prices,
changes status, converts an accepted quote to an order, and shows the overview figures.

## Database schema

Created by `Schema/DatabaseSchema.php` at schema version `1.0.0`.

| Table                          | Holds                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| `{prefix}aiowc_quotes`         | The request itself: customer details, status, notes and validity |
| `{prefix}aiowc_quote_items`    | Requested products, quantities and offered prices                |
| `{prefix}aiowc_quote_messages` | The message thread between customer and shop                     |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

### Customer

| Method | Path                    | Purpose                                                                           | Required args    | Permission         |
| ------ | ----------------------- | --------------------------------------------------------------------------------- | ---------------- | ------------------ |
| POST   | `/quotes`               | Submit a quote request; also accepts `name`, `phone`, `company`, `customer_notes` | `email`, `items` | Public write check |
| GET    | `/quotes/my-quotes`     | The customer's own quotes, paginated                                              | —                | Customer           |
| GET    | `/quotes/{id}`          | Read one quote                                                                    | `id`             | Customer           |
| POST   | `/quotes/{id}/accept`   | Accept the offered prices                                                         | `id`             | Customer           |
| GET    | `/quotes/{id}/messages` | Read the thread                                                                   | `id`             | Customer           |
| POST   | `/quotes/{id}/messages` | Post a customer message                                                           | `id`, `message`  | Customer           |

### Shop

Permission: manage.

| Method             | Path                   | Purpose                                                     | Required args   |
| ------------------ | ---------------------- | ----------------------------------------------------------- | --------------- |
| GET                | `/quotes/admin`        | List quotes, filterable by `status` and `search`, paginated | —               |
| GET                | `/quotes/overview`     | Aggregate figures for the admin overview                    | —               |
| POST               | `/quotes/{id}/offer`   | Set offered prices for the quote's items                    | `id`, `prices`  |
| POST               | `/quotes/{id}/reply`   | Post a shop message                                         | `id`, `message` |
| PUT / PATCH / POST | `/quotes/{id}/status`  | Change status; optionally record `notes`                    | `id`, `status`  |
| POST               | `/quotes/{id}/convert` | Create a WooCommerce order from the quote                   | `id`            |
| GET                | `/quotes/settings`     | Read settings                                               | —               |
| PUT / PATCH / POST | `/quotes/settings`     | Update settings                                             | —               |

## WooCommerce and WordPress integration

### Storefront

| Hook                                   | Priority | Effect                                       |
| -------------------------------------- | -------- | -------------------------------------------- |
| `woocommerce_after_add_to_cart_button` | default  | Renders the quote button on the product page |
| `woocommerce_after_shop_loop_item`     | 15       | Renders the quote button in the shop loop    |
| `wp_enqueue_scripts`                   | default  | Loads the module's assets                    |

### My Account

| Hook                                  | Priority | Effect                                  |
| ------------------------------------- | -------- | --------------------------------------- |
| `init`                                | default  | Registers the `quotes` account endpoint |
| `woocommerce_account_menu_items`      | default  | Adds the Quotes menu item               |
| `woocommerce_account_quotes_endpoint` | default  | Renders the quotes page                 |
| `the_title`                           | 10       | Supplies the endpoint's page title      |

### Basket

| Hook                                                          | Effect                     |
| ------------------------------------------------------------- | -------------------------- |
| `wp_ajax_aiowc_add_to_quote_basket` / `wp_ajax_nopriv_…`      | Adds an item to the basket |
| `wp_ajax_aiowc_remove_from_quote_basket` / `wp_ajax_nopriv_…` | Removes an item            |
| `wp_ajax_aiowc_update_quote_basket` / `wp_ajax_nopriv_…`      | Updates quantities         |

### Shortcode

| Shortcode              | Purpose                  |
| ---------------------- | ------------------------ |
| `[aiowc_quote_basket]` | Renders the quote basket |

No block is registered.

### Emails and the actions behind them

The notification service listens to four of the module's own actions and sends through `wp_mail`.

| Action                         | Emails sent                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| `aiowc_quote_created`          | Shop notification, customer confirmation                        |
| `aiowc_quote_status_changed`   | Accepted, declined, expired or converted notice to the customer |
| `aiowc_quote_admin_reply`      | Reply notice to the customer                                    |
| `aiowc_quote_customer_message` | Message notice to the shop                                      |

## Background jobs

All three run on the WordPress cron scheduler.

| Hook                         | Schedule    | Purpose                                          |
| ---------------------------- | ----------- | ------------------------------------------------ |
| `aiowc_raq_check_expiration` | Hourly      | Expires quotes past `quote_validity_days`        |
| `aiowc_quote_reminder`       | Twice daily | Sends the reminder `reminder_days_before` expiry |
| `aiowc_raq_cleanup`          | Daily       | Removes stale quote data                         |

## Entitlement limits

The `quotes` entitlement gates the module as a whole. `min_quote_amount` is a shop-configured floor on a
request, not a licence limit, and the module caps neither the number of quotes nor the items in one.

## Related documentation

- [Module Architecture](/reference/architecture)
