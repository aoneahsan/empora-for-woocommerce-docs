---
title: Bundle contents, paying from a balance on the Checkout block, and overpaid orders
description: The Bundles editor now builds a bundle's contents and where it is shown, customers can pay from store credit and wallet on the Checkout block, and an order edited to charge less can return the difference.
slug: bundle-contents-and-checkout-balance-2026-10-26
authors: [empora-team]
tags: [modules, release]
date: 2026-10-26
---

Three things changed in the plugin since the last update here, and the reference pages now describe them.

<!-- truncate -->

## Bundle contents in the Bundles editor

The bundle dialog builds the whole bundle: up to 50 items, each with its product, its variation when the
product is variable, default, minimum and maximum quantities, an optional item discount and an **optional**
switch. You also choose the product pages that show the offer. Saving checks everything at once and points at
each problem. See [Product Bundles](/modules/reference/bundles#bundle-contents).

## Paying from a balance on the Checkout block

Store credit and wallet money can now pay part or all of an order on the Checkout block as well as the classic
checkout. Store credit is used first, then the wallet, and when the balance covers the order no payment method
is needed. See [Wallet → Spending at checkout](/modules/reference/wallet#spending-at-checkout).

## Overpaid orders

When an order paid partly from a balance is edited to charge less, the order screen shows the overpaid amount
and returns it to the customer's balance in one step. See
[Wallet → Overpaid orders](/modules/reference/wallet#overpaid-orders).
