---
id: setup
title: "Setting up a white-label deployment"
description: "How a white-label Empora is set up after you pay: your domain, your brand, the build and the licence file the deployment serves."
slug: /white-label/setup
sidebar_position: 3
last_update:
  date: 2026-11-14
keywords:
  - empora white label
  - white-label woocommerce plugin
  - white label setup
---

# Setting up your deployment

Nothing here needs you to run a server. We do the setup; you send us what only you have.

1. **You pay by Wise transfer.** The pay button opens our payment page in the same tab, with the transfer details.
   You send the transfer and give us its reference; once we confirm it, our licence service issues your licence
   and emails you its key and a certificate.
2. **Your brand.** We email you to collect your product name, logo and colours, and the domain the dashboard will
   run on.
3. **Your domain.** You point the domain at the address we give you. DNS is yours to change; we cannot do it for you.
4. **The build.** We build the dashboard and the plugin under your brand and deploy the dashboard on your domain.
5. **The licence file.** The deployment serves `/.well-known/empora-white-label-license.json`, which names your
   licence. At that point the key checks as active on the [verify page](https://empora.aoneahsan.com/verify-license).

A deployment checks its own licence when it starts and when a visitor returns to the tab. If our licence service
cannot be reached, it keeps working and checks again next time; it is never switched off for being offline.
