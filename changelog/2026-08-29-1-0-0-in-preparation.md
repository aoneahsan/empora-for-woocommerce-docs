---
title: 1.0.0 — in preparation
description: Empora for WooCommerce 1.0.0 has not been released yet. What the first release contains, and what this changelog will carry once it ships.
slug: 1-0-0-in-preparation
authors: [aoneahsan]
tags: [release]
date: 2026-08-29
---

**Empora for WooCommerce 1.0.0 has not been released yet.** No version has been published to
WordPress.org, to CodeCanyon, or to the Play Store. This page is the changelog those releases will
appear in, and this first entry records what 1.0.0 contains so the documentation and the software
describe the same thing when it ships.

<!-- truncate -->

## What 1.0.0 contains

**78 modules**, each independently switchable, of which 75 register and are usable in this version.
Seven of them are the free core and need no license: Product Filters, Reviews Enhancement, Wishlist,
Product Compare, Social Media Integration, SEO & Schema Markup, and Dynamic Pricing. The rest are
unlocked by a plan. The full list, with the plan each module belongs to, is the
[module reference](/modules/reference).

**One admin surface.** A single **Empora** menu in WordPress admin holding the Modules grid, a unified
Settings store, a Dashboard reporting license and module status, and Reports.

**HPOS compatibility.** Empora declares compatibility with WooCommerce High-Performance Order Storage and
reads orders through the WooCommerce order APIs rather than querying post tables directly, so it runs on
stores that have made the switch.

**Plans that the software enforces.** Five tiers — Free, Starter, Professional, Business and Enterprise —
with per-plan module sets, site counts and record limits. See [Plans & pricing](/pricing).

## What 1.0.0 does not contain

Being specific about this matters more than the feature list:

- **No self-serve purchase.** No payment provider ships in 1.0, so there is no checkout. Paid plans are
  arranged by [contacting the author](/support). The plans themselves are real and enforced.
- **Three modules do not register:** `inventory`, `livechat` and `store_credit`. They are in the catalogue
  and marked **Not in 1.0** in the module reference. They cannot be enabled in this version.
- **No WordPress.org listing yet.** Installation is by uploading the plugin ZIP — see
  [Installation](/getting-started/installation).

## Requirements

WordPress 6.2 or newer, WooCommerce 8.0 or newer, PHP 8.1 or newer. Details and hosting notes are in
[Requirements & compatibility](/reference/requirements).

## Subscribing

This changelog publishes an [RSS feed](https://empora-docs.aoneahsan.com/changelog/rss.xml). Subscribe to it if you want release notes
without checking back.
