---
id: seo
title: "SEO & Schema Markup"
description: "Per-object meta titles and descriptions, product structured data, Open Graph tags, an XML sitemap, and redirects with 404 logging. Free core."
keywords:
  - woocommerce seo
  - product schema
  - open graph
  - xml sitemap
format: md
---
## Goal

Give a WooCommerce store the SEO basics without a separate SEO plugin: per-object meta titles and
descriptions, product structured data, Open Graph tags, an XML sitemap, redirects with 404 logging, and a
per-page score that says what is missing.

## Tier and entitlement

| Field           | Value         |
| --------------- | ------------- |
| Tier            | **Free core** |
| Entitlement key | `seo`         |
| Admin tab       | `seo`         |
| Module key      | `seo`         |
| Settings prefix | `aiowc_seo_`  |

This is one of the two modules in this group that ship in the free tier. Hooks still register only when
`aiowc_module_enabled_seo` is true.

## What the code does

### Meta tags and titles

`Frontend/MetaTagHandler.php` writes the meta tags on `wp_head` at priority 1, and overrides the document
title through both `pre_get_document_title` and `document_title_parts` at priority 20. Meta is stored per
object, keyed by object type and object ID, so a product, post, page or term can each carry its own.

### Structured data

`Frontend/SchemaHandler.php` writes JSON-LD on `wp_head` at priority 5, emitting `Product` (with nested
`Offer`, `Brand` and `AggregateRating`), `Organization`, `WebSite` and `BreadcrumbList`.

**It disables WooCommerce's own equivalents** so the page does not carry two competing graphs:

```php
add_filter('woocommerce_structured_data_product', '__return_empty_array');
add_filter('woocommerce_structured_data_breadcrumblist', '__return_empty_array');
```

That is worth knowing before enabling the module alongside another SEO plugin that also emits product
schema.

### Sitemap

Two rewrite rules, added on `init`, served on `template_redirect`:

| URL                                | Serves                                |
| ---------------------------------- | ------------------------------------- |
| `/aiowc-sitemap.xml`               | The sitemap index                     |
| `/aiowc-sitemap-{type}-{page}.xml` | One paginated sitemap per object type |

Which post types are included comes from the `sitemap_post_types` setting. The cached sitemap is
invalidated on `save_post`, `delete_post`, `edited_term` and `delete_term`, all at priority 20.

Note the filenames: this is the plugin's own sitemap at `aiowc-sitemap.xml`, not WordPress's core
`wp-sitemap.xml`.

### Redirects and 404s

`Frontend/RedirectHandler.php` processes redirects on `template_redirect` at priority 1, and logs 404s at
priority 99. It watches `post_updated` so that a changed permalink can produce a redirect, and adds an
`allowed_redirect_hosts` filter so an off-site target is permitted where one is configured. Each redirect
row carries its own `redirect_type`, so the status code is per redirect rather than global.

### Score

`Service/ScoreService.php` grades an object out of 100 and returns a letter grade. The checks are meta
title length (30–60 characters), meta description length (120–160), presence of a focus keyword, the
keyword appearing in the title, in the description and in the content, content length, a featured image
for social sharing, Open Graph tags, and the presence of internal links.

## Settings

Read through `ModuleSettings` with the `aiowc_seo_` prefix; defaults come from `SeoModule::defaults()`.
Three of them are stored as JSON.

| Setting               | Default                                     | Meaning                                               |
| --------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `enable_schema`       | `true`                                      | Emit JSON-LD structured data                          |
| `enable_og`           | `true`                                      | Emit Open Graph tags                                  |
| `enable_sitemap`      | `true`                                      | Serve the XML sitemap                                 |
| `enable_redirects`    | `true`                                      | Process redirects and log 404s                        |
| `default_og_image`    | empty                                       | Image used when an object has none                    |
| `schema_organization` | JSON: site name, home URL and an empty logo | The `Organization` graph node                         |
| `sitemap_post_types`  | JSON: `["product","post","page"]`           | Which types the sitemap covers                        |
| `auto_redirect_404`   | `false`                                     | Whether a logged 404 becomes a redirect automatically |

## Admin screen

Admin tab `seo`. It lists per-object meta with
its score, manages redirects, previews the schema for a product, triggers a sitemap regeneration, and
carries the settings form.

## Database schema

Created by `Schema/DatabaseSchema.php` at schema version `1.0.0`.

| Table                         | Holds                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `{prefix}aiowc_seo_meta`      | Per-object meta title, description, focus keyword and score |
| `{prefix}aiowc_seo_redirects` | Source URL, target URL and redirect type                    |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope, and every route requires the manage
permission.

### Meta and score

| Method | Path                                   | Purpose                                                | Required args |
| ------ | -------------------------------------- | ------------------------------------------------------ | ------------- |
| GET    | `/seo/meta`                            | List meta rows, filterable by `object_type`, paginated | —             |
| GET    | `/seo/meta/{object_type}/{object_id}`  | Read one object's meta                                 | —             |
| POST   | `/seo/meta/{object_type}/{object_id}`  | Save one object's meta                                 | —             |
| DELETE | `/seo/meta/{object_type}/{object_id}`  | Delete one object's meta                               | —             |
| GET    | `/seo/score/{object_type}/{object_id}` | Score and per-check detail for one object              | —             |
| GET    | `/seo/overview`                        | Aggregate figures for the admin overview               | —             |

### Redirects

| Method             | Path                  | Purpose                                        | Required args              |
| ------------------ | --------------------- | ---------------------------------------------- | -------------------------- |
| GET                | `/seo/redirects`      | List redirects, paginated                      | —                          |
| POST               | `/seo/redirects`      | Create a redirect; `redirect_type` is optional | `source_url`, `target_url` |
| PUT / PATCH / POST | `/seo/redirects/{id}` | Update a redirect                              | —                          |
| DELETE             | `/seo/redirects/{id}` | Delete a redirect                              | —                          |

### Schema, sitemap and settings

| Method             | Path                               | Purpose                                         | Required args |
| ------------------ | ---------------------------------- | ----------------------------------------------- | ------------- |
| GET                | `/seo/schema/preview/{product_id}` | The JSON-LD that would be emitted for a product | —             |
| POST               | `/seo/sitemap/regenerate`          | Rebuild the sitemap now                         | —             |
| GET                | `/seo/settings`                    | Read settings                                   | —             |
| PUT / PATCH / POST | `/seo/settings`                    | Update settings                                 | —             |

## WordPress and WooCommerce integration

| Hook                                                        | Priority | Effect                                                    |
| ----------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `wp_head`                                                   | 1        | Meta tags and Open Graph                                  |
| `wp_head`                                                   | 5        | JSON-LD structured data                                   |
| `pre_get_document_title`                                    | 20       | Replaces the document title                               |
| `document_title_parts`                                      | 20       | Adjusts the title parts                                   |
| `woocommerce_structured_data_product`                       | —        | Emptied, so WooCommerce does not also emit product schema |
| `woocommerce_structured_data_breadcrumblist`                | —        | Emptied, likewise for breadcrumbs                         |
| `template_redirect`                                         | 1        | Applies a matching redirect                               |
| `template_redirect`                                         | 99       | Logs a 404                                                |
| `post_updated`                                              | 10       | Notices a permalink change                                |
| `init`                                                      | —        | Adds the two sitemap rewrite rules                        |
| `query_vars`                                                | —        | Registers `aiowc_sitemap` and `aiowc_sitemap_page`        |
| `save_post` / `delete_post` / `edited_term` / `delete_term` | 20       | Invalidates the cached sitemap                            |

No shortcode and no block are registered.

## Background jobs

Both run through Action Scheduler in the `aiowc-seo` group.

| Hook                           | Schedule                     | Purpose                            |
| ------------------------------ | ---------------------------- | ---------------------------------- |
| `aiowc_seo_sitemap_regenerate` | Daily, from midnight         | Rebuilds the sitemap               |
| `aiowc_seo_score_recalculate`  | Weekly, from Sunday midnight | Recalculates scores across objects |

## Entitlement limits

`seo` is a free-tier entitlement, so the module is available without a premium licence. No cap on meta
rows, redirects or sitemap entries is implemented; sitemap size is handled by pagination.

## Related documentation

- [Module Architecture](/reference/architecture)
