---
id: reporting
title: "Advanced Reports & Analytics"
description: "Report on sales, customers and inventory beyond the WooCommerce defaults, keep periodic snapshots, export a report and email one on a schedule."
keywords:
  - woocommerce reports
  - sales analytics
  - scheduled report email
  - inventory report
format: md
---
## Goal

Report on sales, customers and inventory beyond what WooCommerce shows by default, keep periodic
snapshots so trends survive, export a report, and email one on a schedule.

## Tier and entitlement

| Field           | Value        |
| --------------- | ------------ |
| Tier            | Premium      |
| Entitlement key | `reporting`  |
| Admin tab       | `reporting`  |
| Module key      | `reporting`  |
| Settings prefix | `aiowc_rep_` |

Hooks register only when `aiowc_module_enabled_reporting` is true and the licence permits the `reporting`
entitlement.

## Reports

Three services produce the figures: `SalesReportService`, `CustomerReportService` and
`InventoryReportService`. The export layer recognises eleven report types:

| Group     | Report types                                                            |
| --------- | ----------------------------------------------------------------------- |
| Sales     | `sales_overview`, `revenue_by_period`, `top_products`, `top_categories` |
| Customers | `new_customers`, `customer_ltv`, `customer_segments`                    |
| Inventory | `low_stock`, `out_of_stock`, `stock_value`, `stock_movement`            |

The sales and customer endpoints take a `start_date`, an `end_date` and a `group_by`; the inventory
endpoint takes a stock `threshold`.

## Export formats — what actually happens

`Service/ExportService.php` builds an HTML table for the chosen report, then:

- If the `TCPDF` class is available, it renders a landscape A4 PDF from that HTML.
- If it is not, it returns the HTML itself, for the client to print to PDF.

**TCPDF is not a dependency of this plugin.** It is absent from `composer.json` and from the vendor tree,
and the module manifest records the gap as `missing classes: TCPDF`. So on a stock install a PDF export
returns printable HTML, not a PDF file. A site that installs TCPDF independently gets the PDF path.

## Settings

Read through `ModuleSettings` with the `aiowc_rep_` prefix; defaults are `ReportingModule::DEFAULTS`.

| Setting              | Default  | Meaning                                          |
| -------------------- | -------- | ------------------------------------------------ |
| `snapshot_frequency` | `daily`  | How often a snapshot is taken                    |
| `email_reports`      | `false`  | Whether scheduled report emails are sent         |
| `default_date_range` | `30`     | Days a report covers when no range is given      |
| `currency_display`   | `symbol` | Whether amounts show a currency symbol or a code |
| `cleanup_days`       | `90`     | Age at which report working data is pruned       |
| `snapshot_retention` | `365`    | Days snapshots are kept                          |

## Admin screen

Admin tab `reporting`. It shows the sales,
customer and inventory reports over a chosen date range, manages email schedules, and carries the
settings form.

The module also contributes a **Store Overview** card to the WordPress dashboard, registered through the
plugin's shared `DashboardCardRegistry`. The registry owns the `wp_dashboard_setup` hook and the
capability gate; the module supplies only the card.

## Database schema

Created by `Schema/DatabaseSchema.php` at schema version `1.0.0`.

| Table                            | Holds                                                           |
| -------------------------------- | --------------------------------------------------------------- |
| `{prefix}aiowc_report_snapshots` | Periodic snapshots of report figures                            |
| `{prefix}aiowc_report_schedules` | Scheduled report emails: type, frequency, recipients and format |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

### Reports

Permission: view.

| Method | Path                   | Purpose                                                           | Required args |
| ------ | ---------------------- | ----------------------------------------------------------------- | ------------- |
| GET    | `/reporting/sales`     | Sales figures over `start_date`–`end_date`, grouped by `group_by` | —             |
| GET    | `/reporting/customers` | Customer figures over the same parameters                         | —             |
| GET    | `/reporting/inventory` | Inventory figures at a stock `threshold`                          | —             |

### Export and schedules

Permission: manage.

| Method             | Path                        | Purpose                                                             | Required args               |
| ------------------ | --------------------------- | ------------------------------------------------------------------- | --------------------------- |
| GET                | `/reporting/export`         | Export one `report_type` in a `format`, over an optional date range | `report_type`               |
| GET                | `/reporting/schedules`      | List email schedules                                                | —                           |
| POST               | `/reporting/schedules`      | Create a schedule; also accepts `frequency` and `format`            | `report_type`, `recipients` |
| DELETE             | `/reporting/schedules/{id}` | Delete a schedule                                                   | —                           |
| GET                | `/reporting/settings`       | Read settings                                                       | —                           |
| PUT / PATCH / POST | `/reporting/settings`       | Update settings                                                     | —                           |

There is no endpoint to update an existing schedule; a change means deleting and recreating it.

## WooCommerce and WordPress integration

The module registers no storefront hook, no shortcode and no block. It reads WooCommerce order and
product data through the report services and contributes the dashboard card described above.

## Background jobs

All three run through Action Scheduler in the `aiowc` group, on fixed intervals defined as constants in
the jobs rather than as settings.

| Hook                    | Interval           | Purpose                                                |
| ----------------------- | ------------------ | ------------------------------------------------------ |
| `aiowc_report_snapshot` | 6 hours (21,600s)  | Writes a snapshot row                                  |
| `aiowc_report_email`    | 1 hour (3,600s)    | Sends due scheduled reports                            |
| `aiowc_report_cleanup`  | 24 hours (86,400s) | Prunes snapshots and working data past their retention |

The `snapshot_frequency` setting describes the intended cadence; the snapshot job's own recurrence is the
fixed 6-hour interval above.

## Entitlement limits

The `reporting` entitlement gates the module as a whole. No cap on report runs, schedules or snapshot
rows is implemented in the module's code; retention is governed by `cleanup_days` and
`snapshot_retention`.

## Related documentation

- [Module Architecture](/reference/architecture)
