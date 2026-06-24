---
id: quick-start
title: Quick Start
description: Get Empora for WooCommerce running in about five minutes — install, enable your first modules, and configure them from the unified admin.
keywords:
  - empora quick start
  - woocommerce toolkit setup
  - enable woocommerce modules
sidebar_position: 2
---

# Quick Start

This walks you from a fresh install to a configured store feature in about five minutes.

## 1. Confirm prerequisites

WooCommerce 8.0+ is installed and active, and you are on WordPress 6.0+ with PHP 8.1+. See [Installation](/getting-started/installation) if not.

## 2. Open the Empora dashboard

In the WordPress admin sidebar, click **Empora**. The **Dashboard** shows:

- Your license state (Free, or the active plan name and entitlements).
- Which modules are enabled.
- A **pending configuration** card that flags anything still needing setup (it shows a `todo` marker until a required step is done).

## 3. Enable a free module

1. Go to **Empora → Modules**.
2. Find **Product Filters** in the grid (it is part of the free core).
3. Toggle it **on**. The module registers its front-end behaviour immediately.

## 4. Configure it

1. Open **Empora → Settings**.
2. Select the **Product Filters** tab.
3. Choose the filter types you want (price, attribute, category, rating, etc.) and save.

All module settings live behind tabs on this one Settings page, backed by a single `aiowc_module_settings` store — there is no scattered options screen per module.

## 5. Verify on the storefront

Open a shop or category page on your site. The filters you enabled now render and filter products over AJAX without a full page reload.

## 6. (Optional) Unlock premium modules

If you have a license, [activate it](/getting-started/activating-your-license), then return to **Empora → Modules** to enable premium modules such as Advanced Shipping, Gift Cards, or Subscriptions.

## What to read next

- [All modules](/modules/overview) — the full catalogue.
- [Configuring modules](/modules/configuring-modules) — how enable/disable and per-module settings work.
- [Product Filters guide](/guides/product-filters) — a deeper walkthrough.
