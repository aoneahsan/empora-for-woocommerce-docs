---
id: email-customizer
title: "Email Template Customizer"
description: "Brand the emails WooCommerce already sends: logo, colours, typeface, text size, content blocks and custom CSS, with a sample-order preview and a test email to yourself."
keywords:
  - woocommerce email customizer
  - woocommerce email template
  - branded order emails
  - woocommerce email logo
format: md
---
## Overview

Email Template Customizer changes how WooCommerce's own transactional emails look: the logo, colours,
typeface, text size, header alignment, which content blocks appear and in what order, and optional custom
CSS. It works through WooCommerce's email hooks and options, so it applies to WooCommerce's templates and to
a theme's template overrides.

The module sends no email of its own apart from the test email an administrator sends to themselves. It
creates no database table.

It is a premium module. Enable it from **Empora → Modules** once your license includes `email-customizer`.

## Availability

| Item            | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Module key      | `email-customizer`                                          |
| Tier            | Premium — lowest plan **Professional**                      |
| Entitlement key | `email-customizer`                                          |
| Enabled option  | `aiowc_module_enabled_email-customizer` (off until enabled) |
| REST namespace  | `aiowc/v1`                                                  |

## Settings

Stored in the bundled option row `aiowc_emc_settings`.

| Setting                | Values                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Preset                 | `classic` (default), `clean` or `bold`. Choosing one sets its colours, typeface and header alignment; every field stays editable. |
| Colours                | Header background, header text, page background, body text, accent (buttons and links), button text. Hex values. |
| Typeface               | `system`, `helvetica` (default), `georgia`, `verdana` or `mono`.                           |
| Text size              | 12–20 px (default 15).                                                                     |
| Header alignment       | `left` (default), `center` or `right`.                                                     |
| Blocks                 | Intro message, order summary, addresses, button and footer — each can be switched off and reordered. Product images in the order summary can be switched off. |
| Button text            | Up to 40 characters (default "View your order").                                           |
| Footer text            | Up to 200 characters.                                                                      |
| Intro messages         | One per email: processing, completed, invoice, refunded, new account and password reset. Up to 2,000 characters; limited to the HTML WordPress allows in posts. |
| Custom CSS             | Up to 10,000 bytes, cleaned before it is saved (see below).                                |

### Logo

Upload a PNG or JPG, up to 1 MB and at least 400 px wide. The file is checked by its content, not its name.
SVG is refused because many email apps do not display it. The logo is added to your media library and shows
at up to 200 px wide. Removing the logo takes it out of the emails and leaves the file in the library.

### Custom CSS

Custom CSS ends up inside emails your customers open, so it is cleaned by removing anything unsafe: `<`
characters, comments, `@import`, `expression(`, `behavior:`, `-moz-binding`, `javascript:` and `vbscript:`.
A `url(...)` is kept only for an `https://` address. What the settings screen shows after saving is exactly
what runs.

## What changes in each email

- **Logo, colours and footer text** apply to every WooCommerce email.
- **Typeface, text size, alignment, accent colour and custom CSS** apply to HTML emails.
- **Blocks** — their order and on/off state — apply to customer HTML emails. Emails sent to the shop, and
  every plain-text email, keep WooCommerce's standard layout so no order details go missing.
- Emails with no order (new account, password reset) show the intro after the header and the button above
  the footer.

## Preview and test email

The preview renders a chosen email exactly as WooCommerce would send it, for a sample order built in memory
and never saved. Eight emails can be previewed, in HTML or plain text: processing, completed, invoice,
refunded, on hold, new account, password reset, and the shop's new-order email.

The test email goes only to the signed-in administrator's own address, never to an address in the request,
and is limited to 5 every 10 minutes. It is sent with WordPress's `wp_mail()`; if the site cannot send mail,
the response says so and suggests an SMTP plugin.

## REST API endpoints

All require an administrator.

| Method             | Path                          | Purpose                                                   |
| ------------------ | ----------------------------- | --------------------------------------------------------- |
| POST               | `/email-customizer/preview`   | Render one email (`email_type`, `format`) for a sample order. |
| POST               | `/email-customizer/send-test` | Send that email to your own address.                      |
| POST               | `/email-customizer/logo`      | Upload the logo (multipart `file`).                       |
| DELETE             | `/email-customizer/logo`      | Remove the logo from the emails.                          |
| GET                | `/email-customizer/settings`  | Read the settings.                                        |
| PUT / PATCH / POST | `/email-customizer/settings`  | Update the settings. The logo is set only by its upload route. |

## Entitlement limits

The entitlement is a single on/off grant. Without `email-customizer` the module stays locked and WooCommerce's
emails look as they did before.
