---
id: installation
title: Installation
description: Install Empora for WooCommerce from the WordPress.org plugin directory or by uploading the plugin zip. Covers requirements and post-install steps.
keywords:
  - install empora
  - woocommerce plugin install
  - upload wordpress plugin
sidebar_position: 1
---

# Installation

## Requirements

| Requirement | Minimum |
|---|---|
| WordPress | 6.0 or higher |
| WooCommerce | 8.0 or higher (installed and active) |
| PHP | 8.1 or higher |

WooCommerce must be installed and active before you activate Empora. If WooCommerce is missing, Empora stays dormant and shows an admin notice instead of activating its modules.

## Option A — install from WordPress.org (free)

1. In your WordPress admin, go to **Plugins → Add New**.
2. Search for **Empora for WooCommerce**.
3. Click **Install Now**, then **Activate**.
4. Open **Empora** in the admin menu. The free core modules are available immediately.

Direct listing: [wordpress.org/plugins/empora-for-woocommerce](https://wordpress.org/plugins/empora-for-woocommerce/)

## Option B — upload the plugin zip

Use this for the premium build (downloaded after purchase) or any zip distribution.

1. Go to **Plugins → Add New → Upload Plugin**.
2. Choose the `empora-for-woocommerce-*.zip` file and click **Install Now**.
3. Click **Activate**.
4. To enable premium modules, [activate your license](/getting-started/activating-your-license).

:::tip Premium vs free build
The WordPress.org build contains the free core. The premium build additionally bundles the premium modules and the in-plugin updater. Both install the same way; the difference is which modules can be enabled.
:::

## After activation

When Empora activates it:

- Registers the **Empora** top-level admin menu (Dashboard, Modules, Settings, Reports, License).
- Declares **HPOS compatibility** with WooCommerce.
- Creates any database tables its enabled modules need (for example, wishlist, compare, reviews metadata, and so on).
- Leaves every premium module **off** until you enable it.

## Updating

- **Free build:** updates arrive through the normal WordPress.org update channel — you will see them under **Dashboard → Updates** and **Plugins**.
- **Premium build:** the bundled updater checks the license/update server and offers updates in-place once your license is active.

## Uninstalling

Deactivating the plugin disables its modules but leaves your data in place. Deleting the plugin runs its uninstall routine. If you want to keep your data (wishlists, reviews, settings) when deleting, export it first via the relevant module's Import/Export tools.

## Next

- [Quick start](/getting-started/quick-start)
- [Activate your license](/getting-started/activating-your-license)
