---
id: email-automation
title: "Email & Automations"
description: "Customise transactional email templates and run workflows that react to order, customer, cart and stock events with rules, delays and actions."
keywords:
  - woocommerce email templates
  - marketing automation
  - order email workflow
  - email branding
format: md
---
## Goal

Provide store owners with customizable email templates and automation workflows for customer engagement, similar to AutomateWoo.

## Entitlement Key

`email_automation`

## Available Plans

- Professional
- Business
- Enterprise

## Features

### Email Template System

- Brand profile customization:
  - Logo, colors (primary, secondary, text, background)
  - Typography (font family, footer text)
  - Social links (Facebook, Twitter, Instagram, LinkedIn, YouTube, Pinterest)
  - Custom CSS
- Template editor:
  - Subject line, heading, body (HTML + plain text)
  - Dynamic placeholders with live preview
  - Test email sending
- WooCommerce email override:
  - Toggle to use custom templates for transactional emails
  - Support for order, customer, and system emails

### Workflow Engine

- Visual workflow builder
- Triggers:
  - Order events (created, processing, completed, cancelled, refunded, on-hold)
  - Customer events (registered, first order)
  - Cart abandoned
  - Back in stock
- Conditions/Rules:
  - Customer role, order total, cart subtotal
  - Product/category/tag in order
  - Currency, shipping/billing country
  - First-time customer, order count, total spent
  - Match type: ALL or ANY
- Actions:
  - Send email (customer, admin, or custom recipient)
  - Add/remove customer tag
  - Add customer/order note
  - Create coupon (percent, fixed cart, fixed product)
  - Delay (minutes, hours, days)
  - Change order status

### Abandoned Cart Recovery

- Automatic cart detection (60+ minute inactivity)
- Cart tracking with session, user, and email
- Recovery workflow triggers
- Recovery status tracking

### Background Jobs

- `aiowc_ea_detect_abandoned_carts` - Every 15 minutes
- `aiowc_ea_run_workflow_action` - Delayed action execution
- `aiowc_ea_cleanup_logs` - Daily log cleanup (30-day retention)

## Database Tables

| Table                       | Purpose                     |
| --------------------------- | --------------------------- |
| `aiowc_email_brand_profile` | Brand styling configuration |
| `aiowc_email_templates`     | Email template content      |
| `aiowc_workflows`           | Workflow definitions        |
| `aiowc_workflow_logs`       | Execution history           |
| `aiowc_abandoned_carts`     | Cart tracking               |
| `aiowc_workflow_executions` | Idempotency tracking        |

## Admin UI

### Tabs

1. **Templates** - Brand profile editor, template list/editor, preview
2. **Workflows** - Workflow list, visual builder (trigger, rules, actions)
3. **Logs** - Execution history with filters and detail view
4. **Diagnostics** - System health checks, cleanup tools

## REST API Endpoints

| Method         | Endpoint                                    | Description           |
| -------------- | ------------------------------------------- | --------------------- |
| GET            | `/email-automation/overview`                | Dashboard stats       |
| GET/PUT        | `/email-automation/brand-profile`           | Brand settings        |
| GET            | `/email-automation/templates`               | List templates        |
| GET/PUT        | `/email-automation/templates/:id`           | Single template       |
| POST           | `/email-automation/templates/:id/reset`     | Reset to default      |
| GET/POST       | `/email-automation/workflows`               | List/create workflows |
| GET/PUT/DELETE | `/email-automation/workflows/:id`           | Single workflow       |
| POST           | `/email-automation/workflows/:id/toggle`    | Enable/disable        |
| POST           | `/email-automation/workflows/:id/duplicate` | Clone workflow        |
| GET            | `/email-automation/logs`                    | Paginated logs        |
| GET            | `/email-automation/logs/:id`                | Single log detail     |
| POST           | `/email-automation/preview`                 | Preview email HTML    |
| POST           | `/email-automation/send-test`               | Send test email       |
| GET            | `/email-automation/diagnostics`             | Health checks         |
| POST           | `/email-automation/cleanup`                 | Manual cleanup        |

## File Structure

```
includes/Modules/EmailAutomation/
├── EmailAutomationModule.php
├── Schema/DatabaseSchema.php
├── DTO/
│   ├── BrandProfile.php
│   ├── EmailTemplate.php
│   ├── Workflow.php
│   ├── WorkflowAction.php
│   ├── WorkflowRule.php
│   └── WorkflowLog.php
├── Repository/
│   ├── BrandProfileRepository.php
│   ├── EmailTemplateRepository.php
│   ├── WorkflowRepository.php
│   ├── WorkflowLogRepository.php
│   └── AbandonedCartRepository.php
├── Service/
│   ├── EmailRenderer.php
│   ├── TemplateOverrideService.php
│   ├── PlaceholderResolver.php
│   ├── TriggerRegistry.php
│   ├── RuleEvaluator.php
│   ├── ActionExecutor.php
│   ├── WorkflowEngine.php
│   ├── IdempotencyService.php
│   ├── AbandonedCartDetector.php
│   └── DiagnosticsService.php
├── Rest/EmailAutomationRest.php
├── Frontend/EmailPreviewHandler.php
└── Jobs/
    ├── AbandonedCartDetectorJob.php
    ├── WorkflowRunnerJob.php
    └── LogCleanupJob.php
```

## Observability Events

| Event                      | Properties                |
| -------------------------- | ------------------------- |
| `email_template_updated`   | templateKey               |
| `email_test_sent`          | templateKey, recipient    |
| `workflow_created`         | triggerType, actionsCount |
| `workflow_toggled`         | workflowId, enabled       |
| `workflow_trigger_fired`   | triggerType, workflowId   |
| `workflow_action_executed` | actionType, success       |
| `abandoned_cart_detected`  | cartTotal, hasEmail       |
