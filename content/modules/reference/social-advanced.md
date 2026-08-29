---
id: social-advanced
title: "Social Media Integration (Advanced)"
description: "Share buttons with counts, Facebook and Google sign-in, moderated shopper photos, and a catalogue push to Facebook, Instagram and Pinterest."
keywords:
  - woocommerce social sharing
  - social login
  - user generated content
  - product catalogue feed
format: md
---
## Overview

The Social module does four separate things: it draws share buttons on the product page and counts what gets shared, it offers Facebook and Google sign-in buttons on the WooCommerce login and registration forms, it accepts photo or video submissions from shoppers against a product and holds them for moderation, and it pushes the product catalogue to Facebook, Instagram and Pinterest.

It is for stores that want product pages to carry share counts and shopper photos, and that already have Meta and Pinterest developer credentials. Nothing external happens without those credentials — the catalogue sync returns zero synced rather than failing.

This is a free-tier module: it is granted by the default entitlements, so it works without a licence.

## Availability

| Item            | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Module key      | `social-advanced`                                            |
| Tier            | Free                                                         |
| Entitlement key | `social-advanced`                                            |
| Admin tab       | `social-advanced`, under **Marketing & Email**               |
| Enabled option  | `aiowc_module_enabled_social-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                   |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs. Disabling it unschedules them.

## Settings

Stored in the bundled option row `aiowc_soc_settings`; legacy per-key options `aiowc_soc_<key>` are migrated on first read.

| Stored key              | Default | Meaning                                                                   |
| ----------------------- | ------- | ------------------------------------------------------------------------- |
| `enable_share_buttons`  | `true`  | Draw the share buttons and the share counts on the product page.          |
| `enable_social_login`   | `true`  | Draw the Facebook and Google buttons on the login and registration forms. |
| `enable_user_content`   | `true`  | Declared, but read nowhere in the module — see [Known gaps](#known-gaps). |
| `facebook_app_id`       | `''`    | Meta app id used to build the Facebook login URL.                         |
| `facebook_access_token` | `''`    | Graph API token used by the catalogue sync.                               |
| `facebook_catalog_id`   | `''`    | Target catalogue for the Facebook and Instagram sync.                     |
| `google_client_id`      | `''`    | Google OAuth client id used to build the Google login URL.                |
| `pinterest_feed_key`    | `''`    | Gate on writing the Pinterest feed file; empty means the feed is skipped. |
| `oauth_callback_url`    | `''`    | Redirect URI put in the provider login URLs.                              |

The share-button and social-login settings are read once, when hooks are registered: turning either off means the matching handler is never constructed on that request.

**There is no settings route and no settings form.** The module registers seven REST routes and none of them reads or writes these values, so they can currently only be changed in the database.

## Admin screen

The **Social Media** tab has two sub-tabs.

**Content review** has two cards. **Submissions** is the moderation queue, read from `GET /social/content/queue`: a paged table of id, product, type, content, caption and submitted date, filtered by whether a submission is waiting for review, approved or rejected, with approve and reject on each row. Both decisions take effect immediately and there is no undo. Below it, a second card reads the _approved_ content on a product id, so an approval can be confirmed as a shopper would see it.

**Catalogue sync** pushes the catalogue to one platform or to all of them, and reports per-platform results. A platform missing from the response was not run, which the screen distinguishes from a platform that ran and synced nothing.

## Share tracking

Six platforms are recognised: `facebook`, `twitter`, `pinterest`, `linkedin`, `whatsapp`, `email`. Anything else is refused. Each share is counted per product and platform in a single row with a unique key on the pair, so counts accumulate rather than duplicating.

`ShareTrackingService::fetchExternalShareCount()` can merge an externally reported count into the stored one; the hourly job uses it to refresh the most-shared products.

## Catalogue sync

| Platform  | What happens                                                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facebook  | Posts products to `graph.facebook.com/v18.0/{catalog_id}/products`. Needs both the token and the catalogue id; without them it returns zero synced and no error. |
| Instagram | Delegates to the Facebook sync — it is the same catalogue, not a separate integration.                                                                           |
| Pinterest | Writes an XML feed file to the uploads directory. Needs `pinterest_feed_key` to be set.                                                                          |

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                           | Purpose                                                                                                       | Permission                                       | Required args               |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------- |
| POST   | `/social/share`                | Record a share of a product on a platform, and return the new count.                                          | Open to guests, REST nonce, 30 requests a minute | `product_id`, `platform`    |
| POST   | `/social/login`                | Exchange a provider access token for a linked WordPress user id.                                              | Open to guests, REST nonce, 30 requests a minute | `provider`, `token`         |
| GET    | `/social/content/{product_id}` | List the **approved** content on a product, capped at 50 rows.                                                | Open read, 120 requests a minute                 | `product_id`                |
| GET    | `/social/content/queue`        | The moderation queue: submissions by `status` (default `pending`), paged with `page` and `per_page` (max 50). | `manage_woocommerce`                             | –                           |
| POST   | `/social/content`              | Submit content against a product; it is stored with status `pending`.                                         | Signed-in user                                   | `product_id`, `content_url` |
| POST   | `/social/content/{id}/approve` | Approve one submission.                                                                                       | `manage_woocommerce`                             | `id`                        |
| POST   | `/social/content/{id}/reject`  | Reject one submission.                                                                                        | `manage_woocommerce`                             | `id`                        |
| POST   | `/social/sync-catalog`         | Run the catalogue sync for `facebook`, `instagram`, `pinterest` or `all`.                                     | `manage_woocommerce`                             | –                           |

## Social login

`SocialLoginService` accepts `facebook` and `google` only. Given an access token it fetches the provider profile and then resolves a user in a fixed order: an existing link for that provider id, otherwise the currently signed-in user (which links the provider to that account), otherwise an existing WordPress user with the same email address, otherwise a newly created user.

The second step is particular to this module: when someone is already signed in, the provider account is attached to that session's user regardless of the email the provider returned. The separate [Social Login](/modules/reference/social-login) module has no such step — it goes straight from "no existing link" to matching on email.

## WooCommerce integration

| Hook                                 | Priority | What the module does                                                  |
| ------------------------------------ | -------- | --------------------------------------------------------------------- |
| `woocommerce_single_product_summary` | 38       | Draws the six share buttons (only when `enable_share_buttons` is on). |
| `woocommerce_product_meta_end`       | 10       | Draws the share counts under the product meta.                        |
| `woocommerce_login_form`             | 10       | Draws the Facebook and Google buttons on the login form.              |
| `woocommerce_register_form`          | 10       | Draws the same buttons on the registration form.                      |

**Shortcodes**

| Shortcode                                            | Renders                                     |
| ---------------------------------------------------- | ------------------------------------------- |
| `[aiowc_social_login]`                               | The provider buttons anywhere on the site.  |
| `[aiowc_social_share product_id="123"]`              | The share buttons for a named product.      |
| `[aiowc_social_gallery product_id="123" limit="12"]` | The approved shopper content for a product. |

## Database schema

| Table                         | Holds                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- |
| `{prefix}aiowc_social_shares` | One row per product and platform with its share count and last update.    |
| `{prefix}aiowc_social_logins` | Provider links: user id, provider, provider user id, email, display name. |
| `{prefix}aiowc_user_content`  | Shopper submissions: product, user, type, URL, caption and status.        |

## Background jobs

| Hook                         | Interval | Work                                                                     |
| ---------------------------- | -------- | ------------------------------------------------------------------------ |
| `aiowc_social_sync_catalog`  | daily    | Runs the Facebook, Instagram and Pinterest syncs and records the counts. |
| `aiowc_social_update_shares` | hourly   | Refreshes external share counters for up to 50 products.                 |

## Entitlement limits

`social-advanced` is granted on the free tier, so the entitlement imposes nothing. The practical limits are the module's own: 50 approved items per product read, 2,000 products in the Pinterest feed, and 50 products per share-refresh pass.

## Known gaps

- **The public product read is approved-only.** `listContent` hardcodes the status to `approved` and takes no status argument, which is correct for a shop page. Anything else — pending or rejected — is reachable only through the administrator queue route.
- **No settings route.** The nine settings above have no read or write endpoint and no form.
- **`enable_user_content` has no effect.** It is defined in `DEFAULTS` and read nowhere.
- Instagram is not a separate integration — it reuses the Facebook catalogue call.
