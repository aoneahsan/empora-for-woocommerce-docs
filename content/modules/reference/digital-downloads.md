---
id: digital-downloads
title: "Digital Downloads Enhanced"
description: "Replace WooCommerce download URLs with tokenised links carrying their own limit and expiry, logging every attempt and revocable from the admin API."
keywords:
  - woocommerce digital downloads
  - download limits
  - secure download links
  - download expiry
format: md
---
## Overview

The Digital Downloads module replaces WooCommerce's own download URLs with tokenised links it owns. Each downloadable line of a paid order gets one link with its own download limit and expiry; every attempt is checked and logged; and a link can be reset or revoked from the admin API.

It is for stores selling files that want per-link limits, expiry, an audit trail of who fetched what, and optional restriction by IP.

## Availability

| Item            | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| Module key      | `digital_downloads`                                            |
| Tier            | Premium                                                        |
| Entitlement key | `digital_downloads`                                            |
| Admin tab       | `downloads`, under **Operations**                              |
| Enabled option  | `aiowc_module_enabled_digital_downloads` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                     |

Enabling the module creates the three tables below, seeds the defaults and schedules the two jobs.

## Settings

Stored in the bundled option row `aiowc_dd_settings`; legacy per-key options `aiowc_dd_<key>` are migrated on first read.

| API name                | Stored key                | Default | Meaning                                                                                                       |
| ----------------------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `defaultDownloadLimit`  | `default_download_limit`  | `3`     | Downloads allowed per issued link.                                                                            |
| `defaultExpiryDays`     | `default_expiry_days`     | `7`     | Days a newly issued link stays valid.                                                                         |
| `enableIpRestriction`   | `enable_ip_restriction`   | `false` | Apply the link's IP rules and the distinct-IP cap.                                                            |
| `maxIpsPerDownload`     | `max_ips_per_download`    | `2`     | Distinct IPs a link may be used from. `0` means unlimited.                                                    |
| `enableDownloadLogging` | `enable_download_logging` | `true`  | Write a log row for each allowed and refused attempt.                                                         |
| `cleanupDays`           | `cleanup_days`            | `90`    | Age at which log rows are deleted.                                                                            |
| `linkTokenLength`       | `link_token_length`       | `32`    | Length of the generated token.                                                                                |
| `forceDownload`         | `force_download`          | `true`  | Stream the file through WooCommerce's forced-download path where the file is local; otherwise redirect to it. |

Five further settings are stored and returned by the settings routes but are not read anywhere in the module, so changing them has no effect in this release: `enable_secure_links`, `enable_pdf_watermark`, `watermark_text`, `redirect_after_download` and `redirect_url`.

## How a download works

1. On `woocommerce_order_status_completed` or `woocommerce_payment_complete`, one link row is issued per downloadable line, taking its limit from `default_download_limit` and its expiry from `default_expiry_days`.
2. `woocommerce_customer_available_downloads` is filtered so My Account and the order emails point at the token URL, `?aiowc_download=<token>`, rather than WooCommerce's own.
3. On `template_redirect` (priority 5) a request carrying that query variable is served. The token must match `[a-f0-9]{16,128}`; an unknown token is a 404.
4. The link is evaluated in order: active, not expired, under its download limit, and — when IP restriction is on — allowed by the link's IP rules and under the distinct-IP cap.
5. A refusal is logged (when logging is on) and answered with 403 and a specific message: expired, limit reached, or not permitted from this location.
6. An allowed request writes a `started` log row, increments the download count, marks the row `completed`, fires `aiowc_secure_download_served`, and delivers the file through `WC_Download_Handler`.
7. On `woocommerce_order_status_refunded` or `woocommerce_order_status_cancelled` the order's links are revoked.

Delivery uses `WC_Download_Handler::download_file_force()` for a local file when `force_download` is on, and `download_file_redirect()` otherwise. With WooCommerce inactive the request is refused with a 500 rather than served.

## Admin screen

The **Downloads** tab lists active download permissions — customer, product, downloads left and access expiry — with a refresh control. It reads `GET /downloads/permissions` and directs the user to the order edit screen to change a permission.

## REST API endpoints

All routes are on `aiowc/v1` and require `manage_woocommerce`, plus a REST nonce on cookie-authenticated requests. The customer-facing path is the token URL above, not a REST route.

| Method             | Path                            | Purpose                                                               | Required args |
| ------------------ | ------------------------------- | --------------------------------------------------------------------- | ------------- |
| GET                | `/downloads/permissions`        | List issued links; accepts `page`, `per_page`, `order_id`, `user_id`. | –             |
| GET                | `/downloads/links/{id}/logs`    | Attempt log for one link; accepts `page`, `per_page`.                 | `id`          |
| POST               | `/downloads/links/{id}/reset`   | Reset a link's used-download count.                                   | `id`          |
| POST               | `/downloads/links/{id}/revoke`  | Revoke a link.                                                        | `id`          |
| GET                | `/downloads/stats/{product_id}` | Download statistics for one product.                                  | `product_id`  |
| GET                | `/downloads/settings`           | Read the settings above.                                              | –             |
| PUT / PATCH / POST | `/downloads/settings`           | Update the settings above.                                            | –             |

## WooCommerce integration

| Hook                                       | Priority | What the module does                                              |
| ------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `woocommerce_order_status_completed`       | 10       | Issues one tokenised link per downloadable line.                  |
| `woocommerce_payment_complete`             | 10       | Same, for gateways that complete payment without a status change. |
| `woocommerce_order_status_refunded`        | 10       | Revokes the order's links.                                        |
| `woocommerce_order_status_cancelled`       | 10       | Revokes the order's links.                                        |
| `woocommerce_customer_available_downloads` | 20       | Rewrites My Account and email download URLs to the token URL.     |
| `template_redirect`                        | 5        | Serves `?aiowc_download=<token>`.                                 |

The module fires `aiowc_secure_download_served` with the link row and the requesting IP after a successful delivery, which other code can hook.

## Database schema

| Table                                 | Holds                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_download_links`        | One row per issued link: order, product, download id, token, limit, count used, expiry, active flag. |
| `{prefix}aiowc_download_logs`         | Every attempt: link, user, order, product, IP, user agent, status, file path and failure reason.     |
| `{prefix}aiowc_download_restrictions` | Per-link IP rules, consulted only while `enableIpRestriction` is on.                                 |

There is no admin route for editing the restriction rows; the table is read by the access check but written to only outside this module's REST surface.

## Background jobs

| Hook                                   | Schedule | Work                                                       |
| -------------------------------------- | -------- | ---------------------------------------------------------- |
| `aiowc_digital_downloads_expire_links` | Hourly   | Marks links past their expiry.                             |
| `aiowc_digital_downloads_cleanup`      | Daily    | Deletes log rows older than `cleanupDays` (minimum 1 day). |

## Entitlement limits

`digital_downloads` is an on/off grant with no licence-side quota. The limits a customer meets — downloads per link, days of validity, distinct IPs — are all store settings.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
