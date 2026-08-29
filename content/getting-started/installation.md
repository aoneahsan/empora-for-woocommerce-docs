---
id: installation
title: Installation
description: Install Empora for WooCommerce by uploading the plugin ZIP to WordPress. Covers requirements, activation, what the plugin creates, updating and uninstalling.
keywords:
  - install empora
  - woocommerce plugin install
  - upload wordpress plugin zip
  - empora requirements
  - activate woocommerce plugin
sidebar_position: 1
---

# Installation

Empora installs like any other WordPress plugin: upload a ZIP, activate it, and a new **Empora** menu
appears in your admin. The whole thing takes about two minutes on a site that already runs WooCommerce.

## Before you start

| Requirement | Minimum |
|---|---|
| WordPress | 6.2 or newer |
| WooCommerce | 8.0 or newer, installed and active |
| PHP | 8.1 or newer |

WooCommerce must be installed and active **before** you activate Empora. If it is missing, Empora does not
activate its modules — it stays dormant and shows an admin notice instead, so a missing dependency can never
half-break your store. Full detail, including HPOS and multisite notes, is in
[Requirements & compatibility](/reference/requirements).

:::info Not yet on WordPress.org
Empora is not listed in the WordPress.org plugin directory yet, so **Plugins → Add New → Search** will not
find it. Installing means uploading the ZIP, as below. When the directory listing goes live, this page will
say so and the [changelog](/changelog) will carry the announcement.
:::

## Install the plugin

1. Download the plugin ZIP. The free build is available from
   [empora.aoneahsan.com](https://empora.aoneahsan.com); the premium build is the one you receive after
   arranging a plan (see [Plans & pricing](/pricing)).
2. In WordPress admin, go to **Plugins → Add New → Upload Plugin**.
3. Choose the `empora-for-woocommerce-*.zip` file and click **Install Now**.
4. Click **Activate**.
5. Open **Empora** in the admin menu. The free core modules are usable straight away.

To turn on premium modules, [activate your license](/getting-started/activating-your-license) next.

:::tip Free build or premium build
Both builds install identically; the difference is which modules they contain. The free build carries the
seven free core modules. The premium build additionally carries the premium modules and the in-plugin
updater — but which of those it will actually let you enable is decided by your license, not by the ZIP.
:::

## What activation does

When Empora activates it:

- Registers the **Empora** top-level admin menu — Dashboard, Modules, Settings, Reports and License.
- Declares **HPOS compatibility** with WooCommerce, so it is safe on stores using High-Performance Order
  Storage.
- Creates the database tables its enabled modules need, such as wishlist and compare storage.
- Leaves **every premium module off.** Nothing changes on your storefront until you switch a module on
  yourself. Activating the plugin is not the same as enabling a feature, which is deliberate: you decide
  what runs.

## If something goes wrong

The two failures worth knowing in advance:

- **The plugin will not activate.** Almost always a version floor — check PHP and WordPress against the
  table above. WordPress refuses the activation and names the reason.
- **Empora activates but the menu shows a notice about WooCommerce.** WooCommerce is missing, inactive, or
  older than 8.0. Install or update it, and the notice clears on the next admin page load.

Everything else is in [Troubleshooting](/troubleshooting).

## Updating

- **Premium build** — the bundled updater checks the license server and offers updates in place, the same
  way any other plugin update appears under **Dashboard → Updates**. It needs an active license to see them.
- **Free build** — until the WordPress.org listing exists, updating means uploading the newer ZIP over the
  installed copy. Your settings and data are kept; WordPress replaces the plugin files only.

New versions are announced in the [changelog](/changelog), which publishes an
[RSS feed](https://empora-docs.aoneahsan.com/changelog/rss.xml).

## Uninstalling

Deactivating the plugin switches its modules off and leaves your data alone, so deactivating to test a
conflict is safe and reversible.

**Deleting** the plugin runs its uninstall routine, which removes the data its modules created. If you want
to keep anything — wishlists, settings, review metadata — export it first from the relevant module before
you delete. Deactivate and delete are different actions with different consequences; only the second one
removes data.

## Next

- [Quick start](/getting-started/quick-start) — your first module, configured, in five minutes.
- [Activate your license](/getting-started/activating-your-license) — unlock the premium modules.
- [Module reference](/modules/reference) — all 78 modules and the plan each needs.
