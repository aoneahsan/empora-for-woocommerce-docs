---
id: gift-cards-advanced
title: "Gift Cards & Vouchers"
description: "A simpler gift card product with branded designs, scheduled delivery, partial redemption and configurable amount limits."
keywords:
  - woocommerce gift vouchers
  - gift card designs
  - scheduled gift card
  - gift card balance check
format: md
---
## Overview

Gift Cards & Vouchers is the smaller of the plugin's two gift card modules. It adds a gift card product type, issues a card with a code and a balance, applies it at the cart, and sends it to the recipient — immediately or on a scheduled date.

Its distinguishing feature is **designs**: a card is issued against a stored design, with an image and an HTML template, so the delivered card can be branded per occasion.

Where the larger [Gift Cards & Store Credit](/modules/reference/gift-cards) module carries multi-currency, PDF vouchers, transfers and a full transaction ledger, this one keeps to the essentials and states its amount limits as settings.

It is for stores wanting gift cards without the surrounding machinery.

## Availability

| Item            | Value                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Module key      | `gift-cards-advanced`                                                 |
| Tier            | Premium                                                               |
| Entitlement key | `gift-cards-advanced`                                                 |
| Admin tab       | `gift-cards-advanced`                                                 |
| Enabled option  | `aiowc_module_enabled_gift-cards-advanced` (off until turned on)      |
| REST namespace  | `aiowc/v1`                                                            |

Enabling the module creates the three tables below and seeds the defaults.

`registerHooks()` returns early when the licence does not grant `gift-cards-advanced`, and again when `enable_gift_cards` is off — **after** registering the REST routes, so the admin screen keeps working on a store that has turned the storefront feature off.

## Settings

Stored in the bundled option row `aiowc_gc_settings`.

| Stored key                 | Default | Meaning                                                                   |
| -------------------------- | ------- | --------------------------------------------------------------------------- |
| `enable_gift_cards`        | `true`  | Storefront switch. Off leaves the routes live but registers no hooks.      |
| `allow_partial_redemption` | `true`  | Whether a card may be spent across several orders.                         |
| `expiry_months`            | `12`    | How long a new card is valid for.                                          |
| `min_amount`               | `10.0`  | Smallest card a customer may buy.                                          |
| `max_amount`               | `500.0` | Largest card a customer may buy.                                           |
| `allow_scheduled_delivery` | `true`  | Whether the purchaser may choose a future delivery date.                   |

These are read once when the module starts and passed into the services, so the limits are applied by the objects that do the work rather than re-read at each call site.

## The card

| Field                           | Meaning                                                            |
| ------------------------------- | -------------------------------------------------------------------- |
| `code`                          | The redemption code.                                                |
| `initial_balance`, `current_balance` | What it was worth and what is left.                            |
| `recipient_email`               | Who it is for.                                                      |
| `sender_email`, `sender_name`   | Who it is from.                                                     |
| `message`                       | The purchaser's note.                                               |
| `design_id`                     | The design the card is rendered with.                               |
| `scheduled_for`, `sent_at`      | When it should be sent, and when it was.                            |
| `expires_at`                    | When it lapses, set from `expiry_months` at issue.                  |
| `status`                        | `active` by default.                                                |

Every movement writes a transaction row carrying the amount, the type, the balance afterwards and a description, so a card's history is reconstructible.

## Designs

A design is a name, an image URL, an HTML template, an active flag and a sort order. Designs are readable **publicly** — `GET /gift-cards-advanced/designs` is a rate-limited public route — so the storefront can show the purchaser what the card will look like before they buy it.

## Admin screen

The **Gift Cards (Advanced)** tab lists the issued cards, issues one directly, and manages the designs.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                                     | Purpose                                          | Permission           | Required args |
| ------ | ---------------------------------------- | -------------------------------------------------- | -------------------- | ------------- |
| GET    | `/gift-cards-advanced/list`              | Every issued card.                                | `manage_woocommerce` | –             |
| POST   | `/gift-cards-advanced`                   | Issue a card.                                     | `manage_woocommerce` | `amount`      |
| POST   | `/gift-cards-advanced/send`              | Send a card to its recipient.                     | Send check           | `card_id`     |
| GET    | `/gift-cards-advanced/designs`           | The available designs.                            | Public, rate-limited | –             |
| POST   | `/gift-cards-advanced/designs`           | Create a design.                                  | `manage_woocommerce` | `name`        |
| GET    | `/gift-cards-advanced/{code}/balance`    | Check a code's balance.                           | Public, rate-limited | –             |
| POST   | `/gift-cards-advanced/{code}/apply`      | Apply a code to the cart.                         | Nonce, rate-limited  | –             |

The code appears in the **path** rather than the query string on the balance and apply routes, which is worth noting when reviewing server logs: a path is recorded by more of the stack than a query string typically is.

There is no update or delete route for a card. A card that should not have been issued is corrected by adjusting its balance through the admin screen, not by removing it.

## WooCommerce integration

| Hook                                            | What the module does                                              |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `product_type_selector`, `woocommerce_product_class` | Registers the gift card product type.                        |
| `woocommerce_product_options_general_product_data` | Adds the card's fields to the product edit screen.             |
| `woocommerce_process_product_meta`              | Saves them.                                                       |
| `woocommerce_before_calculate_totals`           | Applies an applied card's value to the cart.                      |
| `woocommerce_checkout_order_processed`          | Issues the card when the order is placed.                         |
| `cron_schedules`                                | Registers the custom interval the scheduled-delivery job runs on.  |

**Shortcode** `[aiowc_gift_card_balance]` prints a balance lookup.

## Database schema

| Table                                       | Holds                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_gc_gift_cards`               | The cards: code, balances, recipient and sender, message, design, schedule, expiry, status.    |
| `{prefix}aiowc_gc_gift_card_transactions`   | Every movement: the card, order, amount, type, resulting balance and a description.            |
| `{prefix}aiowc_gift_card_designs`           | The designs: name, image, HTML template, active flag, sort order.                              |

The first two carry a `gc_` prefix because the plainer names belong to the separate [Gift Cards & Store Credit](/modules/reference/gift-cards) module. The two modules never share a row.

## Background jobs

| Hook                              | Interval        | Work                                                 |
| --------------------------------- | --------------- | ------------------------------------------------------ |
| `aiowc_gift_cards_send_scheduled` | custom interval | Sends cards whose scheduled date has arrived.         |
| `aiowc_gift_cards_expire`         | daily           | Expires cards past their date.                        |
| `aiowc_gift_cards_reminders`      | hourly          | Warns customers whose card is about to lapse.         |

All three run on WP-Cron. The scheduled-delivery job registers its own interval through `cron_schedules` rather than using one of WordPress's built-in schedules.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

**This module fires no gift card lifecycle events.** Nothing is dispatched when a card is issued, sent, redeemed or expires, so an integration cannot react to those. The larger [Gift Cards & Store Credit](/modules/reference/gift-cards) module fires all of them.

## Entitlement limits

`gift-cards-advanced` is an on/off grant with no cap on the number of cards, transactions or designs. The amount limits are store settings.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two gift card modules ship, and both register a gift card product type.** This one and [Gift Cards & Store Credit](/modules/reference/gift-cards). Running both means two product types, two ledgers and two sets of cards that cannot be spent against each other. A store should pick one — and the other module is the fuller implementation.
- **No lifecycle hooks are fired**, so nothing outside the module can react to a card being issued, sent, redeemed or expired.
- There is no update or delete route for a card, and no transaction-listing route, so a card's history is only visible through the admin screen.
- The card code appears in the URL path on two routes, which puts it into ordinary request logs.
- Designs are publicly readable, including their HTML template. That is what allows a storefront preview, but it means a design is not a private asset.
