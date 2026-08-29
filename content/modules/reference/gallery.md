---
id: gallery
title: "Product Gallery"
description: "Replace the product gallery with one holding video and 360-degree items, its own ordering and alt text, and a layout you set per product."
keywords:
  - woocommerce product gallery
  - product video
  - 360 product view
  - gallery layout
format: md
---
## Overview

The Gallery module replaces the WooCommerce product gallery with one that also holds video and 360-degree items, keeps its own ordering and alt text, and can be laid out per product. YouTube and Vimeo URLs are parsed into an embed and a thumbnail.

It is for stores whose product media is more than a row of stills — a demonstration video beside the photographs, a spin view, a different layout on one product than the rest.

## Availability

| Item            | Value                                                |
| --------------- | ---------------------------------------------------- |
| Module key      | `gallery`                                            |
| Tier            | Premium                                              |
| Entitlement key | `gallery`                                            |
| Admin tab       | `gallery`, under **Product Experience**              |
| Enabled option  | `aiowc_module_enabled_gallery` (off until turned on) |
| REST namespace  | `aiowc/v1`                                           |

Enabling the module creates the two tables below, seeds the defaults and schedules the thumbnail cleanup job.

## Settings

Store-wide defaults, stored in the bundled option row `aiowc_gal_settings`; legacy per-key options `aiowc_gal_<key>` are migrated on first read.

| API name            | Stored key           | Default  | Meaning                                                             |
| ------------------- | -------------------- | -------- | ------------------------------------------------------------------- |
| `enableZoom`        | `enable_zoom`        | `true`   | Zoom on the main image.                                             |
| `enableLightbox`    | `enable_lightbox`    | `true`   | Open media in a lightbox.                                           |
| `enableVideo`       | `enable_video`       | `true`   | Allow video items in the gallery.                                   |
| `enable360`         | `enable_360`         | `false`  | Allow 360-degree items.                                             |
| `thumbnailPosition` | `thumbnail_position` | `bottom` | Where the thumbnail strip sits: `bottom`, `top`, `left` or `right`. |
| `galleryLayout`     | `gallery_layout`     | `slider` | Store-wide default layout.                                          |
| `zoomType`          | `zoom_type`          | `inner`  | `inner`, `window` or `lens`.                                        |
| `lightboxAnimation` | `lightbox_animation` | `fade`   | `fade`, `slide` or `zoom`.                                          |
| `videoAutoplay`     | `video_autoplay`     | `false`  | Whether an embedded video starts on its own.                        |
| `thumbnailsPerRow`  | `thumbnails_per_row` | `4`      | Thumbnails per row in the strip.                                    |

A product may override the layout, and carry its own options, through the per-product settings routes; those rows live in a separate table keyed uniquely by product.

## Media items

Each item belongs to a product and carries a type, the media URL, an optional thumbnail URL, alt text, a sort order and a JSON options blob. The type is one of `image`, `video` or `360`, enforced by the column definition.

Video URLs are parsed for YouTube — watch, embed, short and Shorts forms — and Vimeo. The service derives the video id, builds the embed markup at a requested size with optional autoplay, and resolves a thumbnail for the item.

## Admin screens

### Plugin admin tab

The **Gallery** tab holds the store-wide settings form: layout, thumbnail position and count, zoom on or off and its type, lightbox on or off and its animation, video and 360 support, and video autoplay. It saves through the settings route.

### Product edit screen

The module adds an **Enhanced Product Gallery** meta box to the product editor's side column, listing the product's media and offering add, remove and per-product layout controls. It saves on `save_post_product`.

## REST API endpoints

All routes are on `aiowc/v1` and require `manage_woocommerce` — plus a REST nonce on cookie-authenticated requests — except the product media read, which is open and rate limited to 120 requests a minute.

| Method             | Path                                      | Purpose                                                                       | Required args             |
| ------------------ | ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| GET                | `/gallery/products/{product_id}/media`    | The product's gallery items. Open read.                                       | `product_id`              |
| POST               | `/gallery/products/{product_id}/media`    | Add an item; accepts `media_type`, `thumbnail_url`, `alt_text`, `sort_order`. | `product_id`, `media_url` |
| PUT / PATCH / POST | `/gallery/media/{id}`                     | Update an item's URL, thumbnail, alt text or position.                        | `id`                      |
| DELETE             | `/gallery/media/{id}`                     | Delete an item.                                                               | `id`                      |
| PUT / PATCH / POST | `/gallery/products/{product_id}/reorder`  | Reorder a product's items.                                                    | `product_id`, `order`     |
| GET                | `/gallery/products/{product_id}/settings` | Read the product's own gallery settings.                                      | `product_id`              |
| POST               | `/gallery/products/{product_id}/settings` | Update them; accepts `layout`.                                                | `product_id`              |
| GET                | `/gallery/settings`                       | Read the store-wide settings above.                                           | –                         |
| POST               | `/gallery/settings`                       | Update the store-wide settings above.                                         | –                         |

## WooCommerce integration

Storefront handlers are skipped inside `wp-admin`, and the admin handler only runs there.

| Hook                                              | Priority | What the module does                             |
| ------------------------------------------------- | -------- | ------------------------------------------------ |
| `wp_enqueue_scripts`                              | 10       | Loads the gallery assets.                        |
| `woocommerce_single_product_image_thumbnail_html` | 10       | Filters WooCommerce's own thumbnail markup.      |
| `woocommerce_before_single_product_summary`       | 5        | Replaces the default gallery with this module's. |
| `add_meta_boxes`                                  | 10       | Adds the gallery meta box to the product editor. |
| `save_post_product`                               | 10       | Saves the meta box.                              |
| `admin_enqueue_scripts`                           | 10       | Loads the meta box assets.                       |

The module registers no shortcode and no block.

## Database schema

| Table                            | Holds                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_gallery_media`    | Gallery items: product, type (`image`, `video`, `360`), media URL, thumbnail URL, sort order, alt text, options JSON. |
| `{prefix}aiowc_gallery_settings` | Per-product layout and options, one row per product.                                                                  |

## Background jobs

| Hook                              | Interval | Group           | Work                                                         |
| --------------------------------- | -------- | --------------- | ------------------------------------------------------------ |
| `aiowc_gallery_thumbnail_cleanup` | 24 hours | `aiowc-gallery` | Removes generated thumbnails that no gallery item refers to. |

## Entitlement limits

`gallery` is an on/off grant with no licence-side cap on media items or products. `thumbnailsPerRow` is a display setting, not a limit on how much media a product may hold.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
