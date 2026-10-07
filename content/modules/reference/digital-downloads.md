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
| `enableSecureLinks`     | `enable_secure_links`     | `true`  | Point My Account and order emails at the token URL. Off hands back WooCommerce's own URLs; links already issued keep working. |
| `redirectAfterDownload` | `redirect_after_download` | `false` | Serve an interstitial page that starts the download, then sends the customer to `redirect_url`.               |
| `redirectUrl`           | `redirect_url`            | `''`    | Where the interstitial sends the customer. Checked with `wp_validate_redirect()` on save and on every use.    |
| `enablePdfWatermark`    | `enable_pdf_watermark`    | `false` | Stamp `watermark_text` on every page of a PDF download. **Premium edition only** — see below.                 |
| `watermarkText`         | `watermark_text`          | `Licensed to {customer_email} - order {order_number} - {date}` | The stamped text; placeholders `{customer_email}`, `{order_number}`, `{date}`, cut at 200 characters. |

The settings read also returns two read-only facts for the admin screen: `watermarkAvailable` (whether this build carries the PDF toolchain) and `watermarkFallbacks` (downloads served without a watermark, option `aiowc_dd_watermark_fallbacks`).

### Redirect after download

A response cannot both send a file and navigate, so with `redirect_after_download` on the token URL first serves a small page. It starts the real download in a hidden frame, then moves to `redirect_url` after about four seconds; both steps are also plain links, so nothing depends on scripts. The real download URL carries a nonce bound to the link's token, and the serving path refuses the token without it while the feature is on, so the page cannot be skipped. The page is not counted as a download; the download it starts is, once. An address that fails `wp_validate_redirect()` (not this site or a host in `allowed_redirect_hosts`) is not used.

### PDF watermarking (premium edition)

Watermarking uses FPDI + FPDF (`setasign/fpdi`), which ship only in the premium build. The free core build leaves them out, and its admin screen hides the setting and says watermarking is part of the premium edition. When it is on, a download of a **local** `.pdf` is served as a stamped **copy** built in memory; the original file is only read, and remote files are served unstamped.

🔴 **Limit:** the open-source FPDI parser cannot read a PDF whose cross-reference table is a compressed stream (common since PDF 1.5), nor an encrypted or damaged file. Such a file is served **without a watermark** — the download never fails — the failure is logged, and the admin screen shows how many downloads were served this way, with the advice to save the file as PDF 1.4. Removing the limit needs setasign's commercial PDF-Parser add-on.

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

The **Downloads** tab lists active download permissions — customer, product, downloads left and access expiry — with a refresh control. It reads `GET /downloads/permissions` and directs the user to the order edit screen to change a permission. A settings card below it edits every setting above, including the redirect and, in the premium edition, the watermark.

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
