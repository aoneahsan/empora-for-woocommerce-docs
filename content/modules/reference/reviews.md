---
id: reviews
title: "Reviews Enhancement"
description: "Extend WooCommerce reviews rather than replace them: pros and cons, sub-ratings, a recommend flag and photos attached to the WordPress comment."
keywords:
  - woocommerce reviews
  - verified purchase
  - review photos
  - sub-ratings
format: md
---
## Goal

Extend WooCommerce's own product reviews rather than replace them. A review remains a WordPress comment;
this module attaches structured extras to it — pros and cons, sub-ratings, a recommend flag, photos and
videos, helpful votes and a shop reply — and shows a rating summary above the review list.

## Tier and entitlement

| Field           | Value         |
| --------------- | ------------- |
| Tier            | **Free core** |
| Entitlement key | `reviews`     |
| Admin tab       | `reviews`     |
| Module key      | `reviews`     |
| Settings prefix | `aiowc_rev_`  |

This is one of the two modules in this group that ship in the free tier; the rest are premium. Hooks
still register only when `aiowc_module_enabled_reviews` is true.

## What the code does

- Extra fields added to the WooCommerce review form and saved on `comment_post` against the comment.
- A rating summary rendered above the product's review list.
- A verified-purchase badge injected into the review text through the `comment_text` filter.
- Review media and helpful-vote buttons rendered after each review's text.
- Helpful votes recorded per review, and an endpoint returning the most helpful reviews for a product.
- A shop reply stored against the review, with its own timestamp.
- Media moderation: uploads are held for approval unless `auto_approve_media` is on, and the shop can
  list, approve or delete them.
- When a review comment is deleted, the module's own rows for it are removed (`delete_comment`).

### Structured fields stored per review

`pros`, `cons`, `quality_rating`, `value_rating`, `features_rating` and `recommended`.

### Media upload handling

Uploads go to the WordPress media handling in `wp_handle_upload()`. The type check is done on the bytes
on disk with `wp_check_filetype_and_ext()` rather than on the client-supplied `Content-Type`, and only
`image/jpeg`, `image/png`, `image/gif`, `image/webp` and `video/mp4` are accepted. The verified type is
what is passed on to WordPress.

## Settings

Individual options, each prefixed `aiowc_rev_`, registered in the `aiowc_reviews` group on `admin_init`.
Defaults come from `ReviewsModule::getDefaultSettings()`.

| Option (`aiowc_rev_` + key) | Default | Meaning                                           |
| --------------------------- | ------- | ------------------------------------------------- |
| `enable_pros_cons`          | `true`  | Offer the pros and cons fields                    |
| `enable_sub_ratings`        | `true`  | Offer quality, value and features ratings         |
| `enable_recommendations`    | `true`  | Offer the "would recommend" flag                  |
| `enable_voting`             | `true`  | Offer helpful votes                               |
| `enable_photos`             | `true`  | Accept photo uploads                              |
| `enable_videos`             | `false` | Accept video uploads                              |
| `auto_approve_media`        | `false` | Publish uploaded media without moderation         |
| `max_photos`                | `5`     | Photos allowed per review                         |
| `enable_reminders`          | `true`  | Send review reminder emails                       |
| `reminder_days`             | `7`     | Days after an order that the reminder is sent     |
| `auto_hide_reports`         | `5`     | Reports at which a review is hidden automatically |
| `verified_badge_only`       | `false` | Show only reviews from verified purchasers        |

## Admin screen

Admin tab `reviews`. Three tabs, with the
active tab held in the URL hash under `reviewsTab`:

- **Overview** — review activity.
- **Review Media** — the media moderation queue, with approve and delete.
- **Settings** — the options above.

## Database schema

Created by `Schema/DatabaseSchema.php` at schema version `1.0.0`. The review itself stays a WordPress
comment; these tables hold only the extras.

| Table                         | Holds                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| `{prefix}aiowc_reviews_meta`  | Pros, cons, sub-ratings and the recommend flag, keyed by comment ID |
| `{prefix}aiowc_reviews_votes` | Helpful votes and reports                                           |
| `{prefix}aiowc_reviews_media` | Uploaded photos and videos, with their approval state               |

## REST endpoints

Namespace `aiowc/v1`. These return a bare response body rather than the shared envelope.

### Public and customer

| Method | Path                                     | Purpose                                               | Required args     | Permission               |
| ------ | ---------------------------------------- | ----------------------------------------------------- | ----------------- | ------------------------ |
| GET    | `/products/{product_id}/reviews/summary` | Rating summary for a product                          | `product_id`      | Rate-limited public read |
| GET    | `/products/{product_id}/reviews/helpful` | Most helpful reviews, up to `limit`                   | `product_id`      | Rate-limited public read |
| GET    | `/reviews/{id}`                          | Read one review's extras                              | `id`              | Rate-limited public read |
| POST   | `/reviews/{id}/vote`                     | Cast a helpful vote or a report; `reason` is optional | `id`, `vote_type` | Public write check       |
| POST   | `/reviews/{id}/meta`                     | Save pros, cons, sub-ratings and the recommend flag   | `id`              | Review owner             |
| POST   | `/reviews/{id}/media`                    | Upload a photo or video                               | `id`              | Review owner             |

### Shop

Permission: admin.

| Method | Path                          | Purpose                                            | Required args |
| ------ | ----------------------------- | -------------------------------------------------- | ------------- |
| POST   | `/reviews/{id}/reply`         | Post the shop's reply to a review                  | `id`, `reply` |
| GET    | `/reviews/media`              | Media queue, filterable by `status`, up to `limit` | —             |
| POST   | `/reviews/media/{id}/approve` | Approve one media item                             | `id`          |
| DELETE | `/reviews/media/{id}`         | Delete one media item                              | `id`          |
| GET    | `/reviews/settings`           | Read settings                                      | —             |
| POST   | `/reviews/settings`           | Update settings                                    | —             |

## WooCommerce and WordPress integration

| Hook                                           | Effect                                            |
| ---------------------------------------------- | ------------------------------------------------- |
| `woocommerce_before_single_product_reviews`    | Renders the rating summary                        |
| `woocommerce_product_review_comment_form_args` | Adjusts the review form arguments                 |
| `comment_form_before_fields`                   | Adds the extended fields to the form              |
| `comment_post`                                 | Saves the extended fields against the new comment |
| `comment_text`                                 | Adds the verified-purchase badge                  |
| `woocommerce_review_after_comment_text`        | Renders review media, and the voting buttons      |
| `wp_enqueue_scripts`                           | Loads the module's assets                         |
| `delete_comment`                               | Removes the module's rows for a deleted review    |

No shortcode and no block are registered.

## Background jobs

Both run through Action Scheduler in the `aiowc-reviews` group.

| Hook                           | Schedule                  | Purpose                                                                                                                    |
| ------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_reviews_moderation`     | Hourly                    | Hides reviews whose report count has reached `auto_hide_reports`; the shop notice is rate-limited to once a day per review |
| `aiowc_reviews_send_reminders` | Daily, first run at 10:00 | Emails customers `reminder_days` after their order asking for a review                                                     |

## Entitlement limits

`reviews` is a free-tier entitlement, so the module is available without a premium licence. `max_photos`
is a per-review setting rather than a licence limit, and no cap on reviews, votes or total media is
implemented.

## Related documentation

- [Module Architecture](/reference/architecture)
