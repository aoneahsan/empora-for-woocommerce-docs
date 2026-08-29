---
id: configuring-modules
title: Configuring Modules
description: How the Empora for WooCommerce Modules grid and unified Settings page work — enabling, disabling, and configuring each module behind tabs backed by a single settings store.
keywords:
  - configure woocommerce modules
  - empora settings
  - enable disable woocommerce features
sidebar_position: 4
---

# Configuring Modules

Empora keeps configuration in two places: the **Modules** grid (turn features on/off) and the **Settings** page (configure the ones you turned on).

## The Modules grid

**Empora → Modules** shows every available module grouped by category, with a one-click enable/disable toggle per module.

- **Free-core modules** are always toggleable.
- **Premium modules** appear once your license unlocks them; if a module is greyed out, your plan does not include it (see [Activating your license](/getting-started/activating-your-license)).

Enabling a module registers its hooks, REST routes, and any front-end behaviour immediately. Disabling it unregisters them without deleting your data.

## The unified Settings page

**Empora → Settings** collects every enabled module's settings behind tabs. There is no separate options screen scattered per module — everything is in one place, backed by a single `aiowc_module_settings` store. This keeps configuration discoverable and makes export/import of settings straightforward.

To configure a module:

1. Enable it on the **Modules** grid.
2. Open **Settings** and select its tab.
3. Adjust options and **Save**.

## The Dashboard's pending-configuration card

**Empora → Dashboard** runs a config checker that surfaces anything still needing attention. Each item has a status of `ok` or `todo`:

- A `todo` item means a required configuration step (onboarding, a security constant, an API key, etc.) is not yet satisfied.
- The card links straight to the place you fix it.

This is your at-a-glance "is anything half-configured?" view. Aim for an all-`ok` dashboard before going live.

## Order of operations for a new store

1. Install + activate (WooCommerce first).
2. Activate your license (if you have one).
3. Enable the modules you need on the **Modules** grid — start small.
4. Configure each on **Settings**.
5. Clear any `todo` items on the **Dashboard**.
6. Verify behaviour on the storefront.

## Data and uninstalling

Disabling a module preserves its data; you can re-enable later and pick up where you left off. Deleting the plugin runs its uninstall routine — export anything you want to keep first via the relevant module's Import/Export tools.

## Next

- [Guides](/guides/product-filters)
- [Troubleshooting](/troubleshooting)
