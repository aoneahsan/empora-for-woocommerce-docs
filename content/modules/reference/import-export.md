---
id: import-export
title: "Product Import/Export"
description: "Move products in and out as CSV or XML through batched jobs: the core fields on the free plan, every field with variations on a paid plan, with per-row validation, a log and reusable column mappings."
keywords:
  - woocommerce product import
  - csv export
  - xml product feed
  - catalogue migration
format: md
---
## Overview

The Import/Export module moves products in and out of a store as CSV or XML. An upload becomes a job; the job is processed in batches, each row validated and written through the WooCommerce product API, with a per-row log. Column mappings can be detected from the file's own headers and saved for reuse.

It is for catalogue migration and bulk maintenance — bringing a supplier feed in, taking a snapshot out, moving a catalogue to another store, repeating any of them without re-describing the columns each time.

## What each plan moves

| | Free plan, and the WordPress.org build | Any paid plan, premium build |
| --- | --- | --- |
| Fields | 12: `id`, `type`, `sku`, `name`, `status`, `short_description`, `description`, `regular_price`, `sale_price`, `stock_quantity`, `stock_status`, `categories` | All 50, below |
| Variations | Not exported | One row each, straight after its parent |
| Products exported | Every status except trash: published, scheduled, draft, pending and private | Same |
| An import column outside the plan | Skipped; the row still saves | Read |
| Runs per month | No cap | No cap |

The 50 fields, in the order an export writes them: `id`, `type`, `sku`, `global_unique_id` (GTIN, UPC, EAN or ISBN, on WooCommerce 9.2 and later), `name`, `slug`, `parent`, `status`, `featured`, `catalog_visibility`, `short_description`, `description`, `regular_price`, `sale_price`, `date_on_sale_from`, `date_on_sale_to`, `tax_status`, `tax_class`, `manage_stock`, `stock_quantity`, `stock_status`, `low_stock_amount`, `backorders`, `sold_individually`, `virtual`, `downloadable`, `downloads`, `download_limit`, `download_expiry`, `weight`, `length`, `width`, `height`, `shipping_class`, `categories`, `tags`, `brands`, `images`, `attributes`, `default_attributes`, `upsells`, `cross_sells`, `grouped_products`, `product_url`, `button_text`, `purchase_note`, `reviews_allowed`, `menu_order`, `date_created`, `meta`.

How the harder fields are written, so a file can be prepared by hand:

- **Linked products** (`parent`, `upsells`, `cross_sells`, `grouped_products`) by SKU, or `id:123` for a product without one. A link to a product the store does not have yet is skipped, so keep parents above their variations.
- **Categories** as paths, `Clothing > Shirts`; a missing category is created under the right parent.
- **Attributes** as JSON: a list of `{name, taxonomy, options, visible, variation}` on a product, and an object of attribute to value on a variation (`{"pa_colour": "red"}`). A global attribute the store lacks is created.
- **Downloads** as a JSON list of `{name, file}`; WooCommerce still checks each file against its approved download folders.
- **Custom fields** (`meta`) as a JSON object. Keys starting with an underscore hold other plugins' internal state and are neither exported nor imported.
- **Yes/no fields** as `yes` or `no`; dates in ISO 8601.

Sales counts and ratings are not moved: they describe orders and reviews, not the product.

## Availability

| Item            | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Module key      | `import_export`                                            |
| Tier            | Free (the core fields); a paid plan moves every field      |
| Entitlement key | `import_export`                                            |
| Admin tab       | `import-export`, under **Operations**                      |
| Enabled option  | `aiowc_module_enabled_import_export` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                 |

Enabling the module creates the three tables below, seeds the settings row and schedules the cleanup job.

## Settings

Stored in the option row `aiowc_ie_settings`.

| Key                        | Default                                                                            | Meaning                                                          |
| -------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `default_format`           | `csv`                                                                              | Format offered first.                                            |
| `batch_size`               | `50`                                                                               | Rows processed per batch, by both the job and the process route. |
| `enable_scheduled_imports` | `false`                                                                            | Stored flag. No scheduled-import path reads it in this release.  |
| `import_images`            | `true`                                                                             | Whether an import fetches product images.                        |
| `update_existing`          | `true`                                                                             | Whether a matching product is updated rather than skipped.       |
| `export_fields`            | `id`, `name`, `sku`, `regular_price`, `sale_price`, `stock_quantity`, `categories` | Fields an export includes by default.                            |

## Formats and files

Uploads are accepted with a `.csv` or `.xml` extension only; anything else is refused. Exports are written as `export-<jobId>-<hash>.<format>`, again CSV or XML, in a protected uploads folder; the hash keeps the name from being guessed on a server that ignores `.htaccess`.

## How a job runs

1. `POST /import-export/import` uploads the file, validates it, counts its rows and creates a job row holding the format, path, total rows, the column mapping and the options.
2. `POST /import-export/jobs/{id}/process` processes one batch of `batch_size` rows and returns the job's new state.
3. The first batch is scheduled when the job is created, and while the state is still `processing` the background job reschedules itself for the next one, so a job finishes without the admin screen open.
4. `GET /import-export/jobs/{id}` reports progress; `GET /import-export/jobs/{id}/logs` returns the per-row log; `GET /import-export/jobs/{id}/download` returns a finished export.

Exports follow the same shape through `POST /import-export/export`.

## Mappings

`POST /import-export/detect-mapping` reads a file's headers and proposes a mapping onto product fields. A mapping can be saved, listed and deleted, so the same supplier file can be re-imported without redoing the column work.

## Admin screen

The **Import/Export** tab runs the whole flow: upload a file, review the detected mapping, start an import or an export, watch the job list, and manage saved mappings and settings.

## REST API endpoints

All routes are on `aiowc/v1` and require `manage_woocommerce`, plus a REST nonce on cookie-authenticated requests. Like the bulk-edit routes, these return their payload directly rather than wrapped in the shared response envelope.

| Method | Path                                | Purpose                                                             |
| ------ | ----------------------------------- | ------------------------------------------------------------------- |
| POST   | `/import-export/import`             | Upload a file and create an import job. The file is sent as `file`. |
| POST   | `/import-export/export`             | Create an export job.                                               |
| POST   | `/import-export/detect-mapping`     | Propose a column mapping from a file's headers.                     |
| GET    | `/import-export/fields`             | The product fields available to map or export.                      |
| GET    | `/import-export/jobs`               | List jobs.                                                          |
| GET    | `/import-export/jobs/{id}`          | Read one job's status and progress.                                 |
| POST   | `/import-export/jobs/{id}/process`  | Process the next batch of that job.                                 |
| GET    | `/import-export/jobs/{id}/logs`     | The per-row log for that job.                                       |
| GET    | `/import-export/jobs/{id}/download` | Download a finished export.                                         |
| GET    | `/import-export/mappings`           | List saved mappings.                                                |
| POST   | `/import-export/mappings`           | Save a mapping.                                                     |
| DELETE | `/import-export/mappings/{id}`      | Delete a mapping.                                                   |
| GET    | `/import-export/settings`           | Read the settings above.                                            |
| POST   | `/import-export/settings`           | Update the settings above.                                          |

None of these routes declare individual arguments; the payloads are read from the JSON body, the query string or the upload.

## WooCommerce integration

The module registers no storefront hook, no shortcode and no block. Products are read and written through the WooCommerce product API, so an import respects WooCommerce's own validation and an export reflects what WooCommerce reports rather than raw database rows.

## Database schema

| Table                           | Holds                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `{prefix}aiowc_import_jobs`     | Jobs: type, format, file path, total and processed rows, mapping, options and status. |
| `{prefix}aiowc_import_mappings` | Saved column mappings.                                                                |
| `{prefix}aiowc_import_logs`     | One row per processed row, with its outcome.                                          |

## Background jobs

| Hook                      | Schedule                      | Work                                                                                                                              |
| ------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_ie_process_import` | Single action, self-repeating | Processes one import batch, then reschedules itself while the job is still processing.                                            |
| `aiowc_ie_process_export` | Single action, self-repeating | The same for exports.                                                                                                             |
| `aiowc_ie_cleanup`        | Daily                         | Deletes upload and export files older than 7 days, and log rows older than 30 days. Both ages are fixed in the job, not settings. |

## Entitlement limits

`import_export` is on for every plan, and no plan caps how many runs it makes; the only bound on a job is `batch_size` per batch. What the plan decides is the field set in the table above.

## Health check

The module reports a warning when its tables are missing, and otherwise reports that it is functioning normally.
