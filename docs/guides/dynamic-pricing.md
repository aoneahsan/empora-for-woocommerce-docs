---
id: dynamic-pricing
title: Dynamic Pricing Guide
description: Configure quantity discounts and percentage-off rules with Empora's free Dynamic Pricing, and learn what the premium advanced pricing rules add.
keywords:
  - woocommerce dynamic pricing
  - woocommerce quantity discounts
  - bulk pricing woocommerce
sidebar_position: 3
---

# Dynamic Pricing Guide

Dynamic Pricing lets you change the price a customer pays based on rules rather than a single fixed number. Empora ships a **free basic** tier and a **premium advanced** tier.

## Free basic tier

The free-core Dynamic Pricing module covers the two most common cases:

- **Quantity discounts** — the per-unit price drops as the cart quantity rises (e.g. 1–4 at full price, 5–9 at 10% off, 10+ at 20% off).
- **Percentage-off** — a straight percentage discount on matching products.

To set it up:

1. Enable **Dynamic Pricing** under **Empora → Modules**.
2. Open **Settings → Dynamic Pricing**.
3. Add a rule: pick the products/category it applies to, choose quantity tiers or a flat percentage, and save.

## Premium advanced tier

The premium **Dynamic Pricing Rules** / **Quantity Rules** modules extend this with:

- **Tiered** rules across multiple thresholds and product groups.
- **Role-based** pricing (e.g. wholesale customers via the **Wholesale** module).
- **Scheduled** pricing windows (sales that start/stop automatically).
- **Quantity rules** — minimum/maximum/step quantities per product.

These require an active license. Enable them the same way once your license unlocks them.

## How rules combine

When several rules could apply, the module resolves them deterministically (most-specific / best-for-customer, depending on your configuration). Test a representative cart after creating rules so the final price matches your intent.

## Worked example

> A coffee roaster sells 250 g bags at \$12. They want: 6+ bags → 10% off, 12+ bags → 18% off, and wholesale-role customers always at 25% off.
>
> - Free tier handles the 6+/12+ quantity tiers.
> - The 25% wholesale-role rule needs the premium role-based pricing + Wholesale modules.

## Tips

- Keep tiers simple and legible on the product page — shoppers should understand the deal at a glance.
- Avoid overlapping rules that fight each other; verify with a test cart.
- Combine with **Smart Coupons** for code-based promotions on top of automatic pricing.

## Related

- [Free core modules](/modules/free-core)
- [Premium modules](/modules/premium)
