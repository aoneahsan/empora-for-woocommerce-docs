---
id: requirements
title: Requirements & Compatibility
description: Empora for WooCommerce system requirements — WordPress, WooCommerce, and PHP versions — plus HPOS compatibility and hosting notes.
keywords:
  - empora requirements
  - woocommerce hpos compatible
  - php 8.1 woocommerce
sidebar_position: 1
---

# Requirements & Compatibility

## Minimum versions

| Component | Minimum | Notes |
|---|---|---|
| WordPress | 6.2 | Tested up to 6.8. |
| WooCommerce | 8.0 | Must be installed and active. Tested up to 9.8. |
| PHP | 8.1 | 8.2 or 8.3 recommended. |

Below any of these floors the plugin will not activate its modules. WordPress checks the WordPress and
PHP requirements itself before it will let the plugin activate; WooCommerce is checked by Empora on
load, and a missing or too-old WooCommerce leaves Empora dormant with an admin notice rather than
breaking the site.

## HPOS (High-Performance Order Storage)

Empora declares **full HPOS compatibility**. You can run WooCommerce's High-Performance Order Storage and Empora together; the plugin uses WooCommerce CRUD/data APIs rather than direct post-meta access where order data is involved. You can confirm this under **WooCommerce → Status** — Empora lists itself as HPOS-compatible.

## Hosting notes

- **Outbound HTTPS** must be allowed so the plugin can reach the license/update server for activation and validation.
- Standard WooCommerce hosting (PHP 8.1 or newer, MySQL or MariaDB) is sufficient. The core needs no special PHP extensions; some modules that generate images or barcodes work better where the common image extensions are present.
- For large catalogues, give PHP enough memory for bulk operations (Bulk Edit, Import/Export).

## Multisite

Empora runs on a standard single site. On WordPress Multisite, activate per-site as you would any WooCommerce plugin; license site-counting is keyed to site URL.

## Browser support (admin)

The admin panel is a modern React application and targets current evergreen browsers (latest Chrome, Firefox, Safari, Edge).

## Related

- [Installation](/getting-started/installation)
- [Architecture](/reference/architecture)
