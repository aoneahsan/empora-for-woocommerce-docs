---
id: product-filters
title: Product Filters Guide
description: Configure Empora's AJAX product filters for WooCommerce shop and category pages — filter types, custom taxonomies, and storefront placement.
keywords:
  - woocommerce ajax filters
  - woocommerce product filters
  - filter by attribute woocommerce
sidebar_position: 1
---

# Product Filters Guide

Product Filters is a **free-core** module that adds AJAX filtering to your shop and category pages: customers narrow products and results update without a full page reload.

## Enable it

1. **Empora → Modules** → toggle **Product Filters** on.
2. **Empora → Settings → Product Filters**.

## Choose filter types

Typical filter types you can enable:

- **Price** — slider or range inputs.
- **Attributes** — any WooCommerce product attribute (colour, size, material, …).
- **Categories** and **Tags**.
- **Rating** — filter by review score.
- **Custom taxonomies** — register your own and filter by them.

Enable only the filters that matter for your catalogue; too many filters slow shoppers down.

## Placement

Filters render on shop/category archive pages. Depending on your theme you can place the filter panel in a sidebar widget area or above the product grid. The module hooks into WooCommerce's standard archive templates, so most well-built themes work without changes.

## Performance notes

- Filtering is done over **AJAX**, so only the product grid re-renders.
- For very large catalogues, prefer fewer, higher-signal filters and lean on attributes that are actually set on products.
- Combine with the **Smart Search** premium module if you want fuzzy product search alongside structured filters.

## Common pitfalls

| Symptom | Fix |
|---|---|
| A filter shows no options | The underlying attribute/taxonomy has no terms assigned to products. Assign terms first. |
| Filters don't appear | Theme overrides WooCommerce archive templates. Check your theme's WooCommerce template overrides. |
| Results look stale | A page cache is serving an old grid. Exclude the archive AJAX endpoint from full-page caching. |

## Related

- [Free core modules](/modules/free-core)
- [Configuring modules](/modules/configuring-modules)
