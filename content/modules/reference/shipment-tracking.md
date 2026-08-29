---
id: shipment-tracking
title: "Shipment Tracking"
description: "Add tracking numbers to orders and show the tracking link to customers in order emails, on the thank-you page and in My Account."
keywords:
  - woocommerce shipment tracking
  - tracking number
  - carrier tracking
  - order tracking
format: md
---
## Overview

The Shipment Tracking module allows store owners to add tracking information to WooCommerce orders and automatically display tracking links to customers through emails and My Account pages.

## Features

### Core Features

- **Multiple Tracking Entries**: Add multiple shipment tracking entries per order
- **Built-in Providers**: Pre-configured tracking URLs for major carriers (FedEx, UPS, USPS, DHL, etc.)
- **Custom Providers**: Add custom shipping providers with custom tracking URL templates
- **Email Integration**: Automatically include tracking info in WooCommerce order emails
- **My Account Display**: Show tracking information on the customer's order view page
- **Order Received Page**: Display tracking on the thank you page

### Admin Features

- **Order Meta Box**: HPOS-compatible meta box on order edit screen
- **Admin Dashboard Page**: Central management UI with 4 tabs:
  - **Overview**: Statistics and recent tracking activity
  - **Providers**: Manage default and custom providers
  - **Settings**: Configure email and display settings
  - **Diagnostics**: Health checks and maintenance actions

## File Structure

```
includes/Modules/ShipmentTracking/
├── ShipmentTrackingModule.php          # Main module entry point
├── Schema/
│   └── DatabaseSchema.php              # Database table schema
├── DTO/
│   └── TrackingEntry.php               # Tracking entry data structure
├── Repository/
│   └── TrackingRepository.php          # CRUD operations for tracking entries
├── Service/
│   ├── ProviderRegistry.php            # Provider management and URL building
│   ├── TrackingService.php             # Business logic
│   └── DiagnosticsService.php          # Health checks
├── Frontend/
│   ├── EmailHandler.php                # Email injection
│   └── AccountHandler.php              # My Account display
├── Admin/
│   └── OrderMetaBox.php                # Order edit screen meta box
├── Jobs/
│   └── TrackingCleanupJob.php          # Cleanup orphaned entries
└── Rest/
    └── ShipmentTrackingRest.php        # REST API endpoints
```

## Database Schema

### Table: `{prefix}aiowc_shipment_tracking_entries`

| Column            | Type              | Description                             |
| ----------------- | ----------------- | --------------------------------------- |
| `id`              | BIGINT PK         | Auto-increment                          |
| `order_id`        | BIGINT            | WC order ID (indexed)                   |
| `provider_key`    | VARCHAR(50)       | Provider slug (e.g., 'fedex')           |
| `provider_name`   | VARCHAR(100)      | Display name                            |
| `tracking_number` | VARCHAR(100)      | Tracking number                         |
| `tracking_url`    | VARCHAR(500) NULL | Custom URL (overrides provider default) |
| `shipped_at`      | DATETIME NULL     | Ship date                               |
| `created_at`      | DATETIME          | Entry created                           |
| `updated_at`      | DATETIME          | Last modified                           |

## Default Shipping Providers

| Provider       | Key              | Tracking URL                                                                                              |
| -------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| FedEx          | `fedex`          | `https://www.fedex.com/fedextrack/?trknbr={tracking_number}`                                              |
| UPS            | `ups`            | `https://www.ups.com/track?tracknum={tracking_number}`                                                    |
| USPS           | `usps`           | `https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}`                                  |
| DHL            | `dhl`            | `https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}`                                      |
| DHL eCommerce  | `dhl_ecommerce`  | `https://webtrack.dhlecs.com/orders?trackingNumber={tracking_number}`                                     |
| Royal Mail     | `royal_mail`     | `https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}`                           |
| Australia Post | `australia_post` | `https://auspost.com.au/mypost/track/#/details/{tracking_number}`                                         |
| Canada Post    | `canada_post`    | `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking_number}`            |
| Deutsche Post  | `deutsche_post`  | `https://www.deutschepost.de/sendung/simpleQuery.html?locale=en_GB&form.sendungsnummer={tracking_number}` |
| Aramex         | `aramex`         | `https://www.aramex.com/track/shipments?ShipmentNumber={tracking_number}`                                 |

## REST API Endpoints

All endpoints require `manage_woocommerce` capability.

### Settings

| Method | Endpoint                               | Description         |
| ------ | -------------------------------------- | ------------------- |
| GET    | `/aiowc/v1/shipment-tracking/settings` | Get module settings |
| PUT    | `/aiowc/v1/shipment-tracking/settings` | Update settings     |

### Providers

| Method | Endpoint                                             | Description             |
| ------ | ---------------------------------------------------- | ----------------------- |
| GET    | `/aiowc/v1/shipment-tracking/providers`              | List all providers      |
| POST   | `/aiowc/v1/shipment-tracking/providers`              | Add custom provider     |
| PUT    | `/aiowc/v1/shipment-tracking/providers/{key}`        | Update provider         |
| DELETE | `/aiowc/v1/shipment-tracking/providers/{key}`        | Delete custom provider  |
| POST   | `/aiowc/v1/shipment-tracking/providers/{key}/toggle` | Toggle provider enabled |

### Statistics & Diagnostics

| Method | Endpoint                                  | Description         |
| ------ | ----------------------------------------- | ------------------- |
| GET    | `/aiowc/v1/shipment-tracking/statistics`  | Overview stats      |
| GET    | `/aiowc/v1/shipment-tracking/diagnostics` | Health check        |
| POST   | `/aiowc/v1/shipment-tracking/cleanup`     | Trigger cleanup job |

### Tracking Entries

| Method | Endpoint                                               | Description           |
| ------ | ------------------------------------------------------ | --------------------- |
| GET    | `/aiowc/v1/shipment-tracking/orders/{orderId}/entries` | Get entries for order |
| POST   | `/aiowc/v1/shipment-tracking/orders/{orderId}/entries` | Add tracking entry    |
| GET    | `/aiowc/v1/shipment-tracking/entries/{id}`             | Get single entry      |
| PUT    | `/aiowc/v1/shipment-tracking/entries/{id}`             | Update entry          |
| DELETE | `/aiowc/v1/shipment-tracking/entries/{id}`             | Delete entry          |
| GET    | `/aiowc/v1/shipment-tracking/entries/recent`           | Get recent entries    |

## Settings

### Email Settings

- **Include in Completed Order Email**: Include tracking info in completed order email
- **Include in Shipped Order Email**: Include tracking in shipped status email
- **Include in Processing Order Email**: Include tracking in processing email

### Display Settings

- **Show in Order View**: Display tracking on My Account order view
- **Show in Order Emails**: Display tracking information in emails
- **Show Provider Logo**: Display shipping provider logos when available
- **Date Format**: Format for displaying ship dates

## Usage

### Adding Tracking from Admin

1. Go to WooCommerce > Orders
2. Edit an order
3. Find the "Shipment Tracking" meta box
4. Select a provider, enter tracking number, and optionally set ship date
5. Click "Add Tracking"

### Viewing Tracking as Customer

Customers can view tracking information:

- In order confirmation/completion emails
- On the "Thank You" page after checkout
- In My Account > Orders > View Order

## WooCommerce Hooks

### Email Integration

```php
// Add tracking to order emails
add_action('woocommerce_email_after_order_table', [$this, 'displayTrackingInEmail']);
```

### Account Page Integration

```php
// Display on order view page
add_action('woocommerce_order_details_after_order_table', [$this, 'displayTrackingOnOrderView']);

// Display on thank you page
add_action('woocommerce_thankyou', [$this, 'displayTrackingOnThankYou']);
```

## HPOS Compatibility

The module is fully compatible with WooCommerce High-Performance Order Storage (HPOS):

- Uses `$order->get_meta()` and `$order->update_meta_data()` instead of post meta functions
- Uses action hooks instead of `add_meta_box()` for order edit screen

## Background Jobs

### Tracking Cleanup Job

- **Hook**: `aiowc_shipment_tracking_cleanup`
- **Schedule**: Daily
- **Purpose**: Removes orphaned tracking entries (entries for deleted orders)

## Observability Events

| Event                                | Description                |
| ------------------------------------ | -------------------------- |
| `shipment_tracking_page_viewed`      | Admin viewed tracking page |
| `shipment_tracking_settings_saved`   | Settings were updated      |
| `shipment_tracking_entry_added`      | Tracking entry added       |
| `shipment_tracking_entry_updated`    | Tracking entry updated     |
| `shipment_tracking_entry_deleted`    | Tracking entry deleted     |
| `shipment_tracking_provider_added`   | Custom provider added      |
| `shipment_tracking_provider_deleted` | Custom provider deleted    |
| `shipment_tracking_provider_toggled` | Provider enabled/disabled  |
| `shipment_tracking_cleanup_run`      | Cleanup job executed       |
| `shipment_tracking_diagnostics_run`  | Diagnostics check run      |

## Related Documentation

- [Module Architecture](/reference/architecture)
