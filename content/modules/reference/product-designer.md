---
id: product-designer
title: "Product Designer"
description: "Let customers personalise a product with text and images inside print areas you define. The design travels from cart to order with a preview and a production file, stored in your site's WordPress uploads folder."
keywords:
  - woocommerce product designer
  - product personalisation
  - custom t-shirt designer
  - print areas
format: md
---
## Overview

Product Designer lets a customer personalise a product — text and images placed inside print areas you
define — before adding it to the cart. The design is saved with a preview image, travels with the cart item
into the order, and appears on the order screen with its preview and production file for you to download.

Files stay on your own site, in the WordPress uploads folder. Nothing is sent to an external storage
service.

It is a premium module. Enable it from **Empora → Modules** once your license includes `product-designer`;
enabling it creates its two tables and schedules the daily cleanup job.

## Availability

| Item            | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Module key      | `product-designer`                                          |
| Tier            | Premium — lowest plan **Business**                          |
| Entitlement key | `product-designer`                                          |
| Enabled option  | `aiowc_module_enabled_product-designer` (off until enabled) |
| REST namespace  | `aiowc/v1`                                                  |

## Product templates

The designer is switched on per product, through that product's template.

| Template field      | Values                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| Enabled             | Shows the designer on this product.                                                 |
| Required            | The product cannot be added to the cart without a design.                           |
| Print areas         | 1–10 areas, each with a name, its position on the product image, and its printed width and height. |
| Fonts               | Up to 20 fonts customers may use.                                                   |
| Ink colours         | Up to 50 colours customers may use.                                                 |
| Uploads             | 0–20 images per design; allowed types `png`, `jpg` and `svg` (PNG and JPG by default); 1–50 MB each (10 by default). |
| Sharpness minimum   | 300–10,000 px (1,500 by default). A smaller upload is accepted with a warning that it may print soft. |
| Production format   | `png300` (default), `pdf` or `svg`, recorded on the template. The production file is currently saved as a PNG. |

A design may contain only text layers and image layers. An image layer can reference only an upload the
module itself stored, never an outside URL, and every position is kept inside its print area.

:::note SVG uploads
SVG is off unless a template allows it. When it is allowed, each SVG is rebuilt from a list of safe drawing
elements and attributes: scripts, event handlers, embedded content and outside links are removed, and a file
that cannot be reduced to that safe form is refused.
:::

## Settings

Stored in the bundled option row `aiowc_pd_settings`.

| Key                        | Default | What it does                                                                 |
| -------------------------- | ------- | ---------------------------------------------------------------------------- |
| `max_design_kb`            | `200`   | Largest saved design (10–2,048 KB).                                          |
| `max_preview_kb`           | `2048`  | Largest preview image (100–8,192 KB).                                        |
| `max_layers`               | `50`    | Layers per design (1–200).                                                   |
| `draft_retention_days`     | `30`    | Designs never ordered, and uploads no order uses, are deleted after this (1–365 days). |
| `ordered_upload_retention` | `90d`   | Customer uploads on an order are deleted `90d` or `1y` after the order is completed, or kept (`never`). The design and its production file are always kept. |

The settings response also reports where files are stored: `uploads`.

## Where files are kept

Files are saved under `wp-content/uploads/aiowc-designs/` in year and month folders, with random 32-character
names, a `.htaccess` that blocks direct requests on Apache, and an empty `index.php`.

:::caution Servers that ignore .htaccess
On nginx and other servers that ignore `.htaccess`, the random file name is the only thing preventing a
direct download. Add a rule denying direct access to `wp-content/uploads/aiowc-designs/`. Administrators
download files through authenticated REST routes, and file paths are never shown to customers.
:::

## REST API endpoints

| Method             | Path                                           | Who                         | Purpose                                              |
| ------------------ | ---------------------------------------------- | --------------------------- | ---------------------------------------------------- |
| POST               | `/product-designer/designs`                    | Storefront, guests included | Save a design with its preview; returns a design key. |
| POST               | `/product-designer/uploads`                    | Storefront, guests included | Upload an image; returns its key, size, effective DPI and any warnings. |
| GET                | `/product-designer/products/{id}/template`     | Administrator               | Read a product's template.                           |
| PUT / PATCH / POST | `/product-designer/products/{id}/template`     | Administrator               | Save a product's template.                           |
| GET                | `/product-designer/orders/{order_id}/designs`  | Administrator               | The designs on an order.                             |
| GET                | `/product-designer/designs/{key}/preview`      | Administrator               | Download the preview image.                          |
| GET                | `/product-designer/designs/{key}/production`   | Administrator               | Download the production file.                        |
| GET                | `/product-designer/settings`                   | Administrator               | Read the settings.                                   |
| PUT / PATCH / POST | `/product-designer/settings`                   | Administrator               | Update the settings.                                 |

The two storefront routes require the WordPress REST nonce and are rate limited per IP address.

## Database schema

| Table                                  | Holds                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `{prefix}aiowc_product_designs`        | One row per design: its key, product, customer, design data, file paths, order and status. |
| `{prefix}aiowc_product_design_uploads` | One row per customer upload: its key, owner, type, size and file path.      |

## WooCommerce integration

- The designer's configuration loads only on products whose designer is enabled; every other page is
  unaffected.
- Add to cart carries the design key. It must belong to a draft design for that same product, and a product
  whose template requires a design refuses the add without one.
- At checkout the design is attached to the order line and marked as ordered.
- The order screen shows each personalised line's preview and production-file links. Orders are read through
  WooCommerce's order API, so HPOS stores are supported.

## Background jobs

`DraftCleanupJob` (`aiowc_product_designer_cleanup`) runs daily, 200 rows at a time. It deletes expired drafts
and unused uploads, applies the ordered-upload retention, and never removes an ordered design. It is
unscheduled when the module is disabled; rows and files stay.

## Entitlement limits

The entitlement is a single on/off grant. Without `product-designer` the module stays locked and none of the
above loads.
