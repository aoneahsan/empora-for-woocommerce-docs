---
id: invoicing
title: "PDF Invoices & Packing Slips"
description: "Number and store an invoice or packing slip per order from a template, and link the customer to it from order emails and My Account."
keywords:
  - woocommerce pdf invoice
  - packing slip
  - invoice numbering
  - order documents
format: md
---
## Overview

The Invoicing module numbers and stores a document per order — an invoice or a packing slip — built from a template, and gives the customer a link to it from the order emails and from My Account. Store staff generate, list, view and delete documents from the admin screen.

It is for stores that need a numbered document per order with their own company details, tax number and layout on it.

## What the module produces

Documents are generated and stored as **HTML**, not as PDF files. `InvoiceGenerator` renders the template and writes the result to `wp-content/uploads/aiowc-invoices/<year>/<month>/<invoice-number>.html`, and stores that path in the invoice row's `pdf_path` column. The download route returns the rendered HTML in its response body.

A separate `PdfGeneratorService` exists that would render through TCPDF or Dompdf, falling back to writing HTML when neither is present. Neither library is a declared dependency of the plugin, and no shipped code path calls that service: the generator and the REST routes both use the HTML path above. The module manifest records the two missing classes as a known issue.

The directory is protected on creation with an `.htaccess` denying access and an empty `index.php`, so documents are not served directly from uploads on an Apache host.

## Availability

| Item            | Value                                                  |
| --------------- | ------------------------------------------------------ |
| Module key      | `invoicing`                                            |
| Tier            | Premium                                                |
| Entitlement key | `invoicing`                                            |
| Admin tab       | `invoicing`, under **Operations**                      |
| Enabled option  | `aiowc_module_enabled_invoicing` (off until turned on) |
| REST namespace  | `aiowc/v1`                                             |

Enabling the module creates the two tables below, seeds the defaults and schedules the two jobs.

## Settings

Stored in the bundled option row `aiowc_inv_settings`; legacy per-key options `aiowc_inv_<key>` are migrated on first read.

| API name            | Stored key            | Default    | Meaning                                                                                    |
| ------------------- | --------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `companyName`       | `company_name`        | site title | Company name printed on the document.                                                      |
| `companyAddress`    | `company_address`     | empty      | Company address block.                                                                     |
| `companyLogoUrl`    | `company_logo_url`    | empty      | Logo shown on the document.                                                                |
| `taxNumber`         | `tax_number`          | empty      | Tax or VAT registration number.                                                            |
| `invoicePrefix`     | `invoice_prefix`      | `INV-`     | Prefix on generated numbers.                                                               |
| `nextInvoiceNumber` | `next_invoice_number` | `1`        | The next sequence number.                                                                  |
| `templateId`        | `template_id`         | `0`        | Template used; `0` means the built-in one.                                                 |
| `autoAttachEmail`   | `auto_attach_email`   | `true`     | Whether a link to the invoice is added to customer order emails.                           |
| `paperSize`         | `paper_size`          | `a4`       | Stored size. Only the unused PDF service reads it, so it has no effect on the HTML output. |

## Admin screens

The **Invoices** tab has two sub-tabs:

| Sub-tab      | What it offers                                                                    |
| ------------ | --------------------------------------------------------------------------------- |
| **Invoices** | The invoice list with its filters, generation for an order, viewing and deletion. |
| **Settings** | A form over the company details, numbering and email settings above.              |

An order meta box exists in the code (`Frontend/OrderHandler.php`, with `admin_post` handlers for generating and viewing) but it is never registered: the module initialises only the email and account handlers. There is no invoice control on the WooCommerce order edit screen in this release.

## REST API endpoints

All routes are on `aiowc/v1`. "Manage" means `manage_woocommerce` plus a REST nonce on cookie-authenticated requests.

| Method             | Path                                | Purpose                                                                             | Required args | Permission |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------- | ------------- | ---------- |
| POST               | `/invoicing/generate`               | Generate a document for an order; `type` selects invoice or packing slip.           | `order_id`    | Manage     |
| GET                | `/invoicing/invoices`               | List documents; accepts `page`, `per_page`, `type`, `status`, `order_id`, `search`. | –             | Manage     |
| GET                | `/invoicing/invoices/{id}`          | Read one document record.                                                           | `id`          | Manage     |
| DELETE             | `/invoicing/invoices/{id}`          | Delete the record and its stored file.                                              | `id`          | Manage     |
| GET                | `/invoicing/invoices/{id}/download` | Return the rendered document.                                                       | `id`          | See below  |
| GET                | `/invoicing/overview`               | Counts for the admin overview.                                                      | –             | Manage     |
| GET                | `/invoicing/settings`               | Read the settings above.                                                            | –             | Manage     |
| PUT / PATCH / POST | `/invoicing/settings`               | Update the settings above.                                                          | –             | Manage     |

The download route has its own check: a user with `manage_woocommerce` is allowed; otherwise the caller must be signed in, and the invoice must exist. An anonymous caller is refused with 401.

## WooCommerce integration

| Hook                                          | What the module does                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `woocommerce_email_after_order_table`         | Adds an invoice link to customer order emails, in both HTML and plain text.                   |
| `woocommerce_my_account_my_orders_actions`    | Adds an invoice action button to the My Account orders list.                                  |
| `woocommerce_order_details_after_order_table` | Shows an invoice download section on the order detail page, only to the order's own customer. |
| `template_redirect`                           | Serves `?aiowc_invoice=<id>&key=<order key>`.                                                 |

The email link is added only when `autoAttachEmail` is on, only to customer-facing mail (never the admin copy), and only for the completed, processing, invoice and on-hold customer emails. It links to the first non-cancelled document of type `invoice` for that order.

The public view path takes the invoice id and the WooCommerce order key. The order key is treated as the credential and compared with `hash_equals`; a caller with `manage_woocommerce` or the order's own customer is allowed. A missing invoice or order is a 404.

## Database schema

| Table                             | Holds                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_invoices`          | One row per document: order, number, type, status, stored file path, total, tax total, currency, issue date. |
| `{prefix}aiowc_invoice_templates` | Document templates.                                                                                          |

## Background jobs

Both are Action Scheduler recurring actions in the `aiowc-invoicing` group.

| Hook                         | Interval | Work                                                                                                   |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `aiowc_invoice_cleanup`      | Weekly   | Deletes documents older than 365 days. The retention period is fixed in the job, not a setting.        |
| `aiowc_invoice_number_reset` | Daily    | Once per calendar year, prefixes the invoice prefix with the new year and resets the next number to 1. |

`AutoGenerateJob` exists in the module but is never instantiated or registered, so documents are not generated automatically on an order transition. Generation is a deliberate call to `POST /invoicing/generate`.

## Entitlement limits

`invoicing` is an on/off grant with no licence-side cap on the number of documents. Retention is bounded by the cleanup job's fixed 365 days.

## Health check

The module reports a warning when its tables are missing, when WooCommerce is inactive, or when the invoice storage directory is not writable, and otherwise reports that it is functioning normally.
