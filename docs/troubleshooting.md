---
id: troubleshooting
title: Troubleshooting
description: Fixes for common Empora for WooCommerce issues — activation, license, modules not appearing, storefront rendering, and caching.
keywords:
  - empora troubleshooting
  - woocommerce plugin not working
  - license not activating
sidebar_position: 90
---

# Troubleshooting

## The Empora menu doesn't appear

- Confirm **WooCommerce is installed and active**. Empora stays dormant without it.
- Confirm PHP is **8.1+** and WordPress is **6.0+** (see [Requirements](/reference/requirements)).
- Check for a fatal error from a conflicting plugin in your server error log.

## A premium module is greyed out / missing

- It is not part of your plan. Open **Empora → Settings → License** and read the **entitlement list** — only listed modules are unlocked.
- If you just upgraded, wait for the next license validation or reload the License page to refresh entitlements.

## License won't activate

| Message | Cause | Fix |
|---|---|---|
| Invalid license key | Typo or wrong account | Re-copy from [your dashboard](https://empora.aoneahsan.com/dashboard/license). |
| License limit reached | All site slots used | Deactivate an unused site or upgrade the plan. |
| Request failed / timeout | Server can't reach the license API | Allow outbound HTTPS to `empora-api.aoneahsan.com`. |

See [Activating your license](/getting-started/activating-your-license).

## A `todo` keeps showing on the Dashboard

The Dashboard config checker flags required setup. Open the flagged item — it links to the screen where you complete it (onboarding step, a security constant, an integration key). Once satisfied, the item flips to `ok`.

## Storefront feature doesn't render

- Confirm the module is **enabled** (Modules grid) and **configured** (Settings tab).
- Your theme may override WooCommerce templates — check the theme's WooCommerce template overrides.
- A **full-page cache** can serve stale markup. Exclude AJAX endpoints (e.g. the product-filter request) from caching.

## Changes don't take effect

- Clear any object cache / page cache after changing settings.
- Hard-refresh the admin (the React admin may hold a cached view) and reload **Settings**.

## Integration (Square, Klaviyo, SMS, …) not syncing

- Re-check the credentials on that module's Settings tab.
- Confirm outbound HTTPS to that provider's endpoint is allowed (see [Privacy & Data](/reference/privacy-and-data) for the endpoints).
- Look at the module's diagnostics/logs view if it has one.

## Still stuck?

- Free plugin support: the [WordPress.org support forum](https://wordpress.org/support/plugin/empora-for-woocommerce/).
- Premium support + contact: [empora.aoneahsan.com/support](https://empora.aoneahsan.com/support).
