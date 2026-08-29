---
id: wishlist
title: "Wishlist"
description: "Save products for later across several lists, share a list by link, and get an email when a saved product drops in price. Guests included."
keywords:
  - woocommerce wishlist
  - saved products
  - price drop alert
  - share wishlist
format: md
---
## Overview

The Wishlist module lets shoppers save products for later, keep more than one list, share a list by link and be emailed when something they saved drops in price. Guests get a wishlist too, held against their WooCommerce session and merged into their account when they sign in.

It is for stores where people browse long before they buy, and where a saved-items list is worth an email when the price moves.

This is a free-tier module: it is granted by the default entitlements, so it works without a licence.

## Availability

| Item            | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Module key      | `wishlist`                                            |
| Tier            | Free                                                  |
| Entitlement key | `wishlist`                                            |
| Admin tab       | `wishlist`, under **Loyalty & Customers**             |
| Enabled option  | `aiowc_module_enabled_wishlist` (off until turned on) |
| REST namespace  | `aiowc/v1`                                            |

Enabling the module creates the two tables below, seeds the defaults and schedules both jobs through Action Scheduler in the `aiowc-wishlist` group. Disabling it cancels them. Front-end handlers are not constructed inside `wp-admin`.

## Settings

Stored in the bundled option row `aiowc_wl_settings`; legacy per-key options `aiowc_wl_<key>` are migrated on first read. The REST layer exposes each key under a camelCase name, mapped back on write.

| API name              | Stored key               | Default             | Meaning                                                                                    |
| --------------------- | ------------------------ | ------------------- | ------------------------------------------------------------------------------------------ |
| `enableForGuests`     | `enable_for_guests`      | `true`              | Allow wishlists for shoppers who are not signed in.                                        |
| `defaultPrivacy`      | `default_privacy`        | `private`           | `private`, `shared` (by link) or `public`.                                                 |
| `buttonPosition`      | `button_position`        | `after_add_to_cart` | Where the save button is drawn on the product page.                                        |
| `showCount`           | `show_count`             | `true`              | Read by the settings API but not by any front-end handler — see [Known gaps](#known-gaps). |
| `priceDropThreshold`  | `price_drop_threshold`   | `10`                | Percentage fall that counts as a price drop.                                               |
| `priceDropEmail`      | `price_drop_email`       | `true`              | Send the price-drop email. Off makes the job return without checking.                      |
| `maxWishlistsPerUser` | `max_wishlists_per_user` | `5`                 | Cap on lists per shopper.                                                                  |
| `cleanupDays`         | `cleanup_days`           | `90`                | Age at which the cleanup job removes an abandoned guest list.                              |

> The settings prefix `aiowc_wl_` is shared with the [Waitlist](/modules/reference/waitlist) module, so both write to the same `aiowc_wl_settings` row. See [Known gaps](#known-gaps).

## Identity: signed-in and guest

A wishlist row carries either a `user_id` or a `session_id`, never both. For a guest the session id is WooCommerce's customer id, so the list survives page loads without an account. On `wp_login` the module merges any guest lists from that session into the signed-in user's.

`wishlist_session_permission` is the guard on almost every route: it rate-limits to 120 requests a minute, requires a REST nonce, and refuses a guest outright with `aiowc_wishlist_login_required` when `enableForGuests` is off.

## Privacy and sharing

Each list has one of three privacy values. `GET /wishlists/{id}/share` returns a share URL built from the list's slug, and `GET /wishlists/shared/{slug}` is the only public read — it takes no credentials and is rate-limited.

## Price drops

`PriceDropService::checkAndNotify()` compares each saved item's `price_at_add` against the current price, collects everything that has fallen by at least `priceDropThreshold` per cent, groups it by shopper and sends one email per shopper. After a successful send it rewrites `price_at_add` so the same drop is not reported again.

The whole job returns immediately when `priceDropEmail` is off.

## Admin screen

The **Wishlist & Favorites** tab is one screen:

- Four tiles — wishlists, saved items, signed-in shoppers, guest wishlists.
- **Most-saved products**, a table of what appears on the most lists.
- **Storefront behaviour**, a form over the settings above: guest wishlists, save count, price-drop emails, default privacy, button position, threshold, maximum lists and cleanup days.

It calls `GET /wishlists/overview`, `GET /wishlists/settings` and `PUT /wishlists/settings`.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. Unless noted, the permission is the session guard described above.

| Method             | Path                           | Purpose                                                            | Permission              | Required args      |
| ------------------ | ------------------------------ | ------------------------------------------------------------------ | ----------------------- | ------------------ |
| GET                | `/wishlists`                   | The caller's lists.                                                | Session guard           | –                  |
| POST               | `/wishlists`                   | Create a list, with `privacy`.                                     | Session guard           | `title`            |
| GET                | `/wishlists/{id}`              | Read one list with its items.                                      | Session guard           | `id`               |
| PUT / PATCH / POST | `/wishlists/{id}`              | Rename a list or change its privacy.                               | Session guard           | `id`               |
| DELETE             | `/wishlists/{id}`              | Delete a list.                                                     | Session guard           | `id`               |
| POST               | `/wishlists/{id}/items`        | Add a product, with `variation_id` and `quantity`.                 | Session guard           | `id`, `product_id` |
| DELETE             | `/wishlists/items/{item_id}`   | Remove an item.                                                    | Session guard           | `item_id`          |
| POST               | `/wishlists/{id}/move-to-cart` | Move every item on the list into the cart.                         | Session guard           | `id`               |
| GET                | `/wishlists/{id}/share`        | The share URL for a list.                                          | Session guard           | `id`               |
| POST               | `/wishlists/quick-add`         | Add a product to the caller's default list, creating it if needed. | Session guard           | `product_id`       |
| GET                | `/wishlists/shared/{slug}`     | Read a shared list by slug. No credentials.                        | Open read, 120 a minute | `slug`             |
| GET                | `/wishlists/overview`          | Totals and most-saved products for the admin screen.               | `manage_woocommerce`    | –                  |
| GET                | `/wishlists/settings`          | Read the settings above, in camelCase.                             | `manage_woocommerce`    | –                  |
| PUT / PATCH / POST | `/wishlists/settings`          | Update the settings above.                                         | `manage_woocommerce`    | –                  |

## WooCommerce integration

| Hook                                                                                                                          | What the module does                                                |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `woocommerce_before_add_to_cart_button` / `woocommerce_after_add_to_cart_button` / `woocommerce_after_single_product_summary` | Draws the save button at whichever position `buttonPosition` names. |
| `woocommerce_after_shop_loop_item` (15)                                                                                       | Draws the save button in the shop loop.                             |
| `woocommerce_cart_item_remove_link`                                                                                           | Adds a "move to wishlist" link beside each cart line.               |
| `wp_loaded`                                                                                                                   | Handles that move.                                                  |
| `wp_login`                                                                                                                    | Merges the guest session's wishlists into the account.              |
| `woocommerce_account_menu_items`                                                                                              | Adds **Wishlists** to My Account.                                   |
| `woocommerce_account_wishlists_endpoint`                                                                                      | Renders the wishlists page.                                         |
| `init`                                                                                                                        | Registers the `wishlists` account endpoint.                         |
| `the_title`                                                                                                                   | Sets the page title on that endpoint.                               |
| `wp_enqueue_scripts`                                                                                                          | Enqueues the front-end assets.                                      |

## Database schema

| Table                          | Holds                                                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_wishlists`      | One row per list: user id **or** session id, title, slug, default flag, privacy.                                                              |
| `{prefix}aiowc_wishlist_items` | Saved items: product, variation, quantity, date added, note, priority and the price when it was saved. Unique on list, product and variation. |

## Background jobs

| Hook                              | Interval | Group            | Work                                                         |
| --------------------------------- | -------- | ---------------- | ------------------------------------------------------------ |
| `aiowc_wishlist_price_drop_check` | 12 hours | `aiowc-wishlist` | Finds items past the drop threshold and emails their owners. |
| `aiowc_wishlist_cleanup`          | daily    | `aiowc-wishlist` | Removes lists abandoned for longer than `cleanupDays`.       |

## Entitlement limits

`wishlist` is granted on the free tier, so the entitlement imposes nothing. The store's own limits are `maxWishlistsPerUser`, the `cleanupDays` window and the 120-requests-a-minute rate limit on the session-guarded routes.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- **The settings prefix collides with Waitlist.** Both modules declare `SETTINGS_PREFIX = 'aiowc_wl_'` and both persist to `aiowc_wl_settings`. Wishlist reads through `ModuleSettings`, which merges its own defaults over whatever the row holds, so it keeps working — but the two modules' keys share one row, and Waitlist, which seeds only when the row is empty, never writes its own.
- **A default wishlist's privacy is read from a legacy option.** `WishlistRepository::createDefault()` calls `get_option('aiowc_wl_default_privacy', 'private')` rather than the bundled setting. Once the bundled row exists the migration deletes that legacy key, so a newly created default list is always `private` regardless of `defaultPrivacy` (`includes/Modules/Wishlist/Repository/WishlistRepository.php:143`).
- **`showCount` has no effect on the storefront.** It is stored, returned by the settings API and offered in the admin form, but no front-end handler reads it.
- There is no admin screen for browsing or editing individual wishlists; the overview reports totals and the most-saved products only.
