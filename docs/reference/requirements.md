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
| WordPress | 6.0 | Tested up to current 6.x. |
| WooCommerce | 8.0 | Must be installed and active. |
| PHP | 8.1 | 8.2 / 8.3 recommended. |

## HPOS (High-Performance Order Storage)

Empora declares **full HPOS compatibility**. You can run WooCommerce's High-Performance Order Storage and Empora together; the plugin uses WooCommerce CRUD/data APIs rather than direct post-meta access where order data is involved. You can confirm this under **WooCommerce → Status** — Empora lists itself as HPOS-compatible.

## Hosting notes

- **Outbound HTTPS** must be allowed so the plugin can reach the license/update server for activation and validation.
- Standard WooCommerce hosting (PHP 8.1+, MySQL/MariaDB) is sufficient. No special extensions are required for the core; some integrations (e.g. image/barcode generation) benefit from common PHP extensions being present.
- For large catalogues, give PHP enough memory for bulk operations (Bulk Edit, Import/Export).

## Multisite

Empora runs on a standard single site. On WordPress Multisite, activate per-site as you would any WooCommerce plugin; license site-counting is keyed to site URL.

## Browser support (admin)

The admin panel is a modern React application and targets current evergreen browsers (latest Chrome, Firefox, Safari, Edge).

## Related

- [Installation](/getting-started/installation)
- [Architecture](/reference/architecture)
