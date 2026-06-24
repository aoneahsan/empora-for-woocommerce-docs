---
id: faq
title: FAQ
description: Frequently asked questions about Empora for WooCommerce — licensing, WooCommerce/HPOS compatibility, free vs premium, data handling, and support.
keywords:
  - empora faq
  - woocommerce plugin faq
  - do i need a license
sidebar_position: 91
---

# Frequently Asked Questions

### Does this plugin require WooCommerce?

Yes. WooCommerce 8.0 or higher must be installed and active.

### Do I need a paid license to use the plugin?

No. Seven core modules are free and work indefinitely without a license. A paid license is only required to enable premium modules.

### What license plans are available?

Free (no license required), Professional, Business, and Enterprise. Each tier unlocks a different combination of premium modules and a different number of connected sites. Pricing and the exact module split are on [empora.aoneahsan.com/pricing](https://empora.aoneahsan.com/pricing).

### Is it compatible with HPOS (High-Performance Order Storage)?

Yes. Empora declares full compatibility with WooCommerce HPOS. You can confirm it under **WooCommerce → Status**.

### What data is sent to external services?

By default, almost none. The free core makes no external calls. Premium licensing contacts the license server only when you enter a key. Per-module integrations (Square, Klaviyo, SMS, etc.) are off until you enable them. Your customer and order data stays on your site unless you actively enable an integration that sends it. Full disclosure: [Privacy & Data](/reference/privacy-and-data).

### Can I use one license on multiple sites?

Yes, up to your plan's site limit. Activation binds a license to a site URL; deactivate a site to free a slot for another.

### Will enabling lots of modules slow my store down?

Only enabled modules register their hooks and front-end behaviour — disabled modules add no runtime cost. Enable what you need and leave the rest off.

### What happens to my data if I disable a module or the plugin?

Disabling a module keeps its data so you can re-enable later. Deleting the plugin runs its uninstall routine; export anything you want to keep first.

### How do updates work?

The free build updates through WordPress.org. The premium build uses a bundled updater that checks the license/update server and updates in place once your license is active.

### Where do I get support?

Free: the [WordPress.org support forum](https://wordpress.org/support/plugin/empora-for-woocommerce/). Premium and general contact: [empora.aoneahsan.com/support](https://empora.aoneahsan.com/support).

### Is the free core really free forever?

Yes. The free core remains fully functional indefinitely without a license. A license only unlocks premium modules.
