---
id: privacy-and-data
title: Privacy & Data Handling
description: Exactly what data Empora for WooCommerce sends, to which endpoints, and under what conditions — plus what never leaves your site.
keywords:
  - empora privacy
  - woocommerce gdpr
  - plugin data handling
  - third party endpoints
sidebar_position: 5
---

# Privacy & Data Handling

This page mirrors the plugin's own Privacy Policy disclosure (the canonical version ships inside the plugin `readme.txt` and at [empora.aoneahsan.com/privacy](https://empora.aoneahsan.com/privacy)). The principle: **your store data stays on your site** unless you actively enable an integration that sends it somewhere.

## What never leaves your site

Customer personal data, order details, your product catalogue, and store settings live on your own WordPress installation and are **never** transmitted to the author's servers. The only customer/order data that leaves your site is what you actively push through a third-party integration you turn on (for example, syncing an order to Klaviyo).

## 1. License activation & validation (premium only)

- **Endpoint:** `https://empora-api.aoneahsan.com`
- **When:** only when an admin enters a license key (Settings → License → Activate) and on scheduled re-validations.
- **Data sent:** license key, site URL, site name, WordPress version, WooCommerce version, PHP version, plugin version.
- **Why:** to verify the license and determine which premium modules this site may enable.
- **Opt-out:** don't enter a license key. With no key, the plugin makes no calls here and the free core works fully.

## 2. File / media uploads (premium features only)

- **Endpoint:** `https://fileshub.zaions.com/api/v1`
- **When:** only when an admin uses a feature that uploads media (PDF invoices, gift-card images, import/export attachments).
- **Data sent:** the file you choose to upload, plus an auth token.
- **Opt-out:** don't enable the premium modules that upload files.

## 3. Per-module third-party integrations (off by default)

These are off until you enable the module and configure credentials. What is sent depends on the module:

| Integration | Endpoint | Data |
|---|---|---|
| Square | `connect.squareup.com` | Product / inventory / payment sync. |
| Klaviyo | `a.klaviyo.com` | Customer + order events. |
| Google Listings & Ads | Google | Product feed sync. |
| Multi-Currency rates | exchangerate.host / openexchangerates.org | Currency code list only — no store data. |
| Social Login | OAuth providers | Standard OAuth handshake when a customer chooses it. |
| SMS | Twilio (etc.) | Message body + recipient phone, only when SMS is enabled. |

## 4. Telemetry & analytics

This release includes **no** built-in usage analytics. If telemetry is added later, it will be opt-in by default and disclosed here and in the plugin.

## GDPR / compliance notes

- Because store/customer data stays on your site, you remain the data controller for it.
- Where you enable an integration, that provider acts as a processor (or its own controller) for the data you send it — review each provider's terms.
- Document any enabled integrations in your own store privacy policy so your customers' disclosures match reality.

## Canonical sources

- Plugin Privacy Policy: bundled in `readme.txt` and at [empora.aoneahsan.com/privacy](https://empora.aoneahsan.com/privacy).
- Author privacy policy: [zaions.com/privacy](https://zaions.com/privacy).

## Related

- [License API](/reference/license-api)
- [FAQ](/faq)
