---
id: amazon-affiliates
title: "Amazon Affiliates"
description: "Import Amazon products as WooCommerce affiliate listings with your tracking ID, click counts and the Associates disclosure. Requires your own Amazon Product Advertising API keys; without them the module shows Not connected."
keywords:
  - woocommerce amazon affiliate
  - amazon associates woocommerce
  - product advertising api
  - affiliate disclosure
format: md
---
## Overview

Amazon Affiliates imports Amazon products into WooCommerce as external (affiliate) products. Each one links
to Amazon with your Associates tracking ID, counts the clicks it sends, shows its price with the time it was
fetched, and carries the disclosure Amazon requires.

:::warning Requires your own Amazon API keys
The module talks to Amazon through the **Product Advertising API**, using **your** access key, secret key and
Associates tracking ID. Amazon issues API access only to approved Associates accounts that meet its sales
requirements. Empora does not provide these keys.

Until all three are saved, the module shows **Not connected**: importing, searching and price refreshes are
refused with a `not_connected` response, and no request is ever sent to Amazon.
:::

It is a premium module. Enable it from **Empora → Modules** once your license includes `amazon-affiliates`;
enabling it creates its clicks table and schedules its two jobs.

## Availability

| Item            | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Module key      | `amazon-affiliates`                                          |
| Tier            | Premium — lowest plan **Enterprise**                         |
| Entitlement key | `amazon-affiliates`                                          |
| Enabled option  | `aiowc_module_enabled_amazon-affiliates` (off until enabled) |
| REST namespace  | `aiowc/v1`                                                   |

## Connecting

Save your access key, secret key and tracking ID, and choose your Amazon marketplace (amazon.com by default).
The two keys are stored encrypted and are write-only: reading the settings tells you whether each key is
set, never its value. Saving a blank key leaves the stored one unchanged; disconnecting clears both.

If Amazon rejects the keys, the module says so (`keys_rejected`) rather than reporting a connection.

## The disclosure

Amazon requires you to tell visitors that you earn from qualifying purchases. The module prints the
disclosure beside the buy button of every imported product, and can also print it in the site footer.

The default text is: *"As an Amazon Associate we earn from qualifying purchases."* You can reword it, up to
300 characters, but the new text must still mention Amazon, that you earn, and qualifying purchases or
commission. Text that does not is refused when you save it.

## Settings

Stored in the bundled option row `aiowc_amz_settings`.

| Key                      | Default            | What it does                                                    |
| ------------------------ | ------------------ | --------------------------------------------------------------- |
| `access_key`             | —                  | Your API access key. Write-only, stored encrypted.              |
| `secret_key`             | —                  | Your API secret key. Write-only, stored encrypted.              |
| `partner_tag`            | —                  | Your Associates tracking ID.                                    |
| `marketplace`            | `www.amazon.com`   | The Amazon marketplace your account belongs to.                 |
| `button_text`            | "Buy on Amazon"    | The buy button label.                                           |
| `show_disclosure_footer` | off                | Also show the disclosure in the site footer.                    |
| `disclosure_text`        | the standard text  | The disclosure, checked as described above.                     |
| `price_cache_hours`      | `24`               | How long a fetched price is shown (1–24 hours).                 |
| `click_retention_days`   | `90`               | How long click records are kept (1–3,650 days).                 |

## What an import keeps

Import by ASIN — one at a time or up to ten together, each reported on its own — or search Amazon and
import from the results. An imported product keeps its title (which you can edit), the Amazon link with your
tracking ID, the main image address, the price and the time that price was fetched. The image is shown from
Amazon, not copied to your site.

## On the storefront

- **Buy button** — goes through your site first, which counts the click, then sends the visitor to the
  product's Amazon page. Only a secure Amazon marketplace address is followed.
- **Price** — shown with "Price as of" and the time it was fetched. Once it is older than the
  `price_cache_hours` setting it is replaced by "See the current price on Amazon"; an item Amazon lists as
  unavailable reads "Currently unavailable on Amazon".
- **Image** — the Amazon image is used when the product has no image of its own.

## REST API endpoints

All require an administrator. Routes marked **keys** answer `409 not_connected` until the module is
connected.

| Method             | Path                                       | Keys | Purpose                                                  |
| ------------------ | ------------------------------------------ | ---- | -------------------------------------------------------- |
| GET                | `/amazon-affiliates/status`                |      | Connected or not, which keys are set, and the marketplace. |
| DELETE             | `/amazon-affiliates/credentials`           |      | Clear both stored keys.                                  |
| POST               | `/amazon-affiliates/import`                | keys | Import one ASIN (`asin`) or up to ten (`asins`).         |
| GET                | `/amazon-affiliates/search`                | keys | Search Amazon by keywords, department and page.          |
| GET                | `/amazon-affiliates/products`              |      | Your imported products.                                  |
| POST               | `/amazon-affiliates/products/{id}/refresh` | keys | Refresh one product's price now.                         |
| GET                | `/amazon-affiliates/report`                |      | Clicks per product over a period.                        |
| GET                | `/amazon-affiliates/settings`              |      | Read the settings.                                       |
| PUT / PATCH / POST | `/amazon-affiliates/settings`              |      | Update the settings.                                     |

## Database schema

| Table                         | Holds                                                   |
| ----------------------------- | ------------------------------------------------------- |
| `{prefix}aiowc_amazon_clicks` | One row per click to Amazon: product, ASIN and time.    |

## Background jobs

| Job               | Does                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `PriceRefreshJob` | Hourly, refreshes up to ten products whose price is older than the cache window. Does nothing while not connected. |
| `ClickCleanupJob` | Deletes click records older than `click_retention_days`.                                  |

Both are unscheduled when the module is disabled; imported products and click records stay.

## Entitlement limits

The entitlement is a single on/off grant. Without `amazon-affiliates` the module stays locked and none of the
above loads.
