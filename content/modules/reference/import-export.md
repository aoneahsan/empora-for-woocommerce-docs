---
id: import-export
title: "Product Import/Export"
description: "Move products in and out as CSV or XML through batched jobs, with per-row validation, a log, and column mappings you can save and reuse."
keywords:
  - woocommerce product import
  - csv export
  - xml product feed
  - catalogue migration
format: md
---
## Overview

The Import/Export module moves products in and out of a store as CSV or XML. An upload becomes a job; the job is processed in batches, each row validated and written through the WooCommerce product API, with a per-row log. Column mappings can be detected from the file's own headers and saved for reuse.

It is for catalogue migration and bulk maintenance — bringing a supplier feed in, taking a snapshot out, repeating either without re-describing the columns each time.

## Availability

| Item            | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Module key      | `import_export`                                            |
| Tier            | Premium                                                    |
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

Uploads are accepted with a `.csv` or `.xml` extension only; anything else is refused. Exports are written as `export-<jobId>-<date>.<format>`, again CSV or XML.

## How a job runs

1. `POST /import-export/import` uploads the file, validates it, counts its rows and creates a job row holding the format, path, total rows, the column mapping and the options.
2. `POST /import-export/jobs/{id}/process` processes one batch of `batch_size` rows and returns the job's new state.
3. While the state is still `processing`, the background job reschedules itself for the next batch. The first batch is driven by the process route.
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

`import_export` is an on/off grant. The licence's default entitlement set also carries `maxImportsPerMonth` and `maxExportsPerMonth`, both `0` in the unlicensed defaults, but no code in this module reads them — in this release nothing counts or caps runs, and the only bound on a job is `batch_size` per batch.

## Health check

The module reports a warning when its tables are missing, and otherwise reports that it is functioning normally.
