# Invoice Feature Enhancement Plan

## User Priorities (Confirmed)

- 🎯 **Primary Goal:** Improve cash flow (faster payments)
- 🔧 **Integrations:** Stripe (payments) + Xero (accounting)
- ⏱️ **Timeline:** Medium scope (1-2 months / 8 weeks)
- 📊 **Schema Migrations:** Evaluate on case-by-case basis

---

## Executive Summary

Based on comprehensive analysis of the invoices feature compared to quotes, current workflows, and integration opportunities, this plan outlines **strategic enhancements focused on accelerating cash flow and reducing payment cycles**.

**Key Findings:**

- Invoices feature is well-implemented but has 15+ high-value opportunities
- Quotes feature has 2.3x more hooks (46 vs 20) and significantly more automation
- **Critical cash flow gaps:** No automated reminders, no payment links, no late fee enforcement
- **High-ROI integrations:** Stripe payment links (30-40% DSO reduction), Xero sync (reconciliation automation)
- **Quick wins available:** Automated reminders (Week 1-2), bulk operations, code quality fixes

**Recommended 8-Week Roadmap:**

- **Phase 1 (Weeks 1-2):** Automated reminders + code quality + Stripe prep
- **Phase 2 (Weeks 3-5):** Stripe payment links (BIGGEST CASH FLOW IMPACT)
- **Phase 3 (Weeks 6-8):** Late fees + Xero sync + bulk operations

---

## Priority Matrix

### 🔴 HIGH PRIORITY - HIGH IMPACT (Do First)

#### 1. Automated Payment Reminder System

**Impact:** Reduces manual work, improves cash flow
**Effort:** Medium (1-2 sprints)
**Dependencies:** Inngest (already available)

**What to Build:**

- Daily Inngest function similar to quote expiry reminders
- Escalating reminder strategy:
  - 7 days before due: Gentle reminder
  - 3 days overdue: Urgent reminder
  - 7 days overdue: Final notice
  - 30 days overdue: Collection escalation
- Email template variations for each escalation level
- Rate limiting per customer (respect communication preferences)

**Technical Approach:**

- Create `/src/lib/inngest/functions/send-invoice-reminders.ts`
- Use existing `sendInvoiceReminder` mutation
- Add `reminderLevel` field to track escalation stage
- Emit event for Slack notification integration

**Files to Create/Modify:**

- New: `/src/lib/inngest/functions/send-invoice-reminders.ts`
- Modify: `/prisma/schema.prisma` (add reminderLevel enum)
- Modify: `/src/features/finances/invoices/services/invoice-email.service.ts` (add escalation templates)

---

#### 2. Complete Email Preview Flow ("Send Without Email" Option)

**Impact:** User experience parity with quotes
**Effort:** Low (2-3 days)
**Dependencies:** None

**Current Issue:**

- TODO comments at lines 322 (invoice-drawer.tsx) and 133 (invoice-list.tsx)
- Users cannot skip email when marking as pending
- Quotes have this feature, invoices don't

**What to Build:**

- Add `sendEmail: boolean` parameter to `markInvoiceAsPending` mutation
- Update EmailPreviewDialog props to support "Mark as Pending (No Email)"
- Match quotes pattern exactly (quote-list.tsx lines 159-170)

**Files to Modify:**

- `/src/actions/finances/invoices/mutations.ts` (markInvoiceAsPending signature)
- `/src/features/finances/invoices/components/invoice-drawer.tsx` (remove TODO, add parameter)
- `/src/features/finances/invoices/components/invoice-list.tsx` (remove TODO, add handleMarkAsSentWithoutEmail)

---

#### 3. Stripe Payment Link Integration

**Impact:** Direct customer payment, reduced manual reconciliation
**Effort:** Medium-High (2-3 sprints)
**Dependencies:** Stripe account, webhook setup

**What to Build:**

- Generate Stripe checkout session on invoice creation (optional toggle)
- Add `paymentLinkUrl` and `stripePaymentIntentId` fields to Invoice model
- Webhook handler for payment confirmation → auto-update invoice status
- "Pay Now" button in invoice email template and PDF
- Payment method selection (if multiple options)

**Technical Approach:**

- Add Stripe SDK integration
- Create `/src/lib/stripe/invoice-checkout.ts` utility
- Webhook endpoint: `/api/webhooks/stripe/payment`
- Atomic payment recording on successful payment

**Schema Changes:**

```prisma
model Invoice {
  // ... existing fields
  paymentLinkUrl: String?
  stripePaymentIntentId: String?
  stripeCheckoutSessionId: String?
}
```

**Files to Create/Modify:**

- New: `/src/lib/stripe/invoice-checkout.ts`
- New: `/src/app/api/webhooks/stripe/payment/route.ts`
- Modify: `/src/features/finances/invoices/components/invoice-form.tsx` (add "Enable Online Payment" toggle)
- Modify: `/src/templates/invoice-template.tsx` (add "Pay Now" button)

---

### 🟡 MEDIUM PRIORITY - HIGH VALUE (Do Soon)

#### 4. Recurring Invoice Automation

**Impact:** Huge time savings for subscription-based services
**Effort:** High (3-4 sprints)
**Dependencies:** Schema migration, Inngest

**What to Build:**

- Recurring invoice configuration (frequency, start/end dates)
- Inngest function to auto-generate invoices on schedule
- UI for setting up recurring invoice templates
- Handle mid-cycle cancellations and pauses
- Customer notification before generation

**Schema Changes:**

```prisma
model Invoice {
  // ... existing fields
  isRecurring: Boolean @default(false)
  recurringFrequency: RecurringFrequency? // MONTHLY, QUARTERLY, YEARLY
  recurringEndDate: DateTime?
  nextInvoiceDate: DateTime?
  parentInvoiceId: String? // Link to original template
  billingPeriodStart: DateTime?
  billingPeriodEnd: DateTime?
}

enum RecurringFrequency {
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

**Files to Create/Modify:**

- New: `/src/lib/inngest/functions/generate-recurring-invoices.ts`
- New: `/src/features/finances/invoices/components/dialogs/recurring-invoice-dialog.tsx`
- Modify: `/prisma/schema.prisma` (add recurring fields)
- Modify: `/src/features/finances/invoices/components/invoice-form.tsx` (add recurring setup)

---

#### 5. Late Fee Automation

**Impact:** Enforce payment discipline, increase revenue recovery
**Effort:** Medium (2-3 sprints)
**Dependencies:** Compliance review (AU consumer law)

**What to Build:**

- Configurable late fee rules (percentage, flat rate, threshold days)
- Daily Inngest function to calculate and apply late fees
- Status history tracking for fee application
- Customer notification when fee applied
- PDF/receipt generation includes late fees

**Configuration:**

```typescript
export const LATE_FEE_CONFIG = {
  enabled: true,
  gracePeriodDays: 30,
  feePercentage: 1.5, // per month
  maxFeePercentage: 10, // cap at 10% of invoice
  flatFeeAmount: 0, // or $X
} as const;
```

**Schema Changes:**

```prisma
model InvoiceLateFee {
  id: String @id @default(cuid())
  invoiceId: String
  invoice: Invoice @relation(fields: [invoiceId], references: [id])
  amount: Decimal
  percentage: Decimal
  appliedDate: DateTime @default(now())
  appliedBy: String? // userId
  reason: String
  createdAt: DateTime @default(now())
}
```

**Files to Create/Modify:**

- New: `/src/lib/inngest/functions/calculate-invoice-late-fees.ts`
- New: `/src/features/finances/invoices/config/late-fee-config.ts`
- Modify: `/prisma/schema.prisma` (add InvoiceLateFee model)
- Modify: Invoice total calculation to include late fees

---

#### 6. Advanced Bulk Operations

**Impact:** Efficiency for finance teams managing many invoices
**Effort:** Low-Medium (1-2 sprints)
**Dependencies:** None

**Current Gaps:**

- Only status updates available
- Missing: bulk send reminders, bulk export, bulk download PDFs

**What to Add:**

1. **Bulk Send Reminders** - Select multiple overdue invoices, send reminders
2. **Bulk Download PDFs as ZIP** - Generate archive of selected invoices
3. **Bulk Export to CSV** - For accounting reconciliation
4. **Batch Payment Entry** - Record multiple payments at once

**Technical Approach:**

- Extend `/src/features/finances/invoices/components/bulk-actions-bar.tsx`
- Add parallel processing for PDF generation (avoid timeout)
- Use archiver library for ZIP creation
- CSV export with configurable columns

**Files to Modify:**

- `/src/features/finances/invoices/components/bulk-actions-bar.tsx`
- New: `/src/actions/finances/invoices/bulk-export.ts`
- New: `/src/actions/finances/invoices/bulk-download-pdfs.ts`

---

#### 7. Xero Accounting Integration

**Impact:** Automated reconciliation, eliminate double-entry
**Effort:** High (3-4 sprints)
**Dependencies:** Xero API access, OAuth setup

**What to Build:**

- Bi-directional invoice sync (LFM ↔ Xero)
- Payment reconciliation (auto-match payments)
- Tax code mapping (GST)
- Contact/customer sync
- OAuth authentication flow

**Technical Approach:**

- Use Xero Node SDK
- Create `/src/lib/xero/` integration utilities
- Inngest function for periodic sync
- Webhook handlers for real-time updates
- Conflict resolution strategy

**Files to Create:**

- New: `/src/lib/xero/client.ts` (Xero API client)
- New: `/src/lib/xero/invoice-sync.ts` (invoice sync logic)
- New: `/src/lib/xero/payment-sync.ts` (payment reconciliation)
- New: `/src/lib/inngest/functions/xero-sync.ts` (scheduled sync)
- New: `/src/app/api/webhooks/xero/route.ts` (webhook handler)

---

### 🟢 LOW PRIORITY - NICE TO HAVE (Future)

#### 8. Invoice Versioning/Amendments

**Impact:** Audit trail for invoice corrections
**Effort:** High (3-4 sprints)
**Pattern:** Reuse quote versioning architecture

**What to Build:**

- Similar to quote versions (versionNumber, parentInvoiceId)
- Create amendment with diff tracking
- Version navigation in drawer
- Original invoice remains for record-keeping

**Schema Changes:**

```prisma
model Invoice {
  // ... existing fields
  versionNumber: Int @default(1)
  parentInvoiceId: String?
  parentInvoice: Invoice? @relation("InvoiceVersions", fields: [parentInvoiceId], references: [id])
  versions: Invoice[] @relation("InvoiceVersions")
}
```

---

#### 9. Follow-up Email Sequences (Like Quotes)

**Impact:** Better customer engagement for overdue invoices
**Effort:** Medium (2 sprints)
**Pattern:** Reuse quote follow-up email system

**What to Build:**

- Follow-up email capability similar to quotes
- Conditional follow-up based on days overdue
- Template variations (friendly, urgent, final notice)

---

#### 10. Item-Level Attachments

**Impact:** Support proofs of delivery, receipts, documentation
**Effort:** High (3-4 sprints)
**Pattern:** Reuse quote item attachment system

**What to Build:**

- Attach files to individual invoice items
- Display in invoice preview and PDF
- Use existing quote item attachment dialogs as reference

---

#### 11. Invoice Analytics Enhancements

**Impact:** Better insights for finance team
**Effort:** Medium-High (2-3 sprints)

**Missing Analytics:**

- Payment cycle analysis (average days to pay)
- Customer profitability scores
- Invoice aging report (0-30, 30-60, 60-90, 90+ buckets)
- Cash flow forecasting
- Collection rate dashboard
- Payment method success rates

**Files to Create:**

- `/src/features/finances/invoices/components/analytics/payment-cycle-chart.tsx`
- `/src/features/finances/invoices/components/analytics/aging-report.tsx`
- `/src/features/finances/invoices/components/analytics/cash-flow-forecast.tsx`

---

## Code Quality Fixes

### Outstanding Issues

1. **Replace console.error with logger** (CLAUDE.md violation):
   - `/src/features/finances/invoices/components/dialogs/record-payment-dialog.tsx:100` — still pending

2. **Fix Export Placeholder:**
   - `/src/features/finances/invoices/components/invoice-analytics.tsx:67-69` — verify if still showing an alert placeholder

### Resolved

- TODO comments in `invoice-drawer.tsx` and `invoice-list.tsx` — resolved
- `console.error` in `invoice-repository.ts` — verify current state

---

## Recommended Implementation Sequence (UPDATED FOR CASH FLOW FOCUS)

### Phase 1 (Weeks 1-2): Quick Wins + Foundation

**Goal:** Immediate improvements + prepare for Stripe integration

1. 🔄 Fix console.error → logger migration (code quality) — `record-payment-dialog.tsx:100` still pending
2. ✅ Resolve TODO comments - sendEmail parameter (UX parity)
3. 🔄 Implement automated payment reminders (CASH FLOW IMPACT) — Inngest infrastructure in place, reminder function not yet built
4. 🔄 Add bulk send reminders action (EFFICIENCY)
5. 🔄 Stripe account setup & API key configuration (PREP)

**Deliverables:**

- Automated reminder emails reducing manual effort by 80%
- Complete email preview flow matching quotes
- Stripe integration ready for Phase 2

---

### Phase 2 (Weeks 3-5): Payment Links (HIGH CASH FLOW IMPACT)

**Goal:** Enable direct customer payments via Stripe

1. ✅ Stripe checkout session generation
2. ✅ Payment webhook handler (auto-update invoice status)
3. ✅ "Pay Now" button in email template & PDF
4. ✅ Payment confirmation flow
5. ✅ Bulk download PDFs as ZIP (bonus: send to customers)

**Schema Changes Required:**

```prisma
model Invoice {
  paymentLinkUrl: String?
  stripePaymentIntentId: String?
  stripeCheckoutSessionId: String?
}
```

**Deliverables:**

- Customers can pay invoices directly from email/PDF
- Automatic payment reconciliation (no manual entry)
- Faster payment cycles (estimated 30-40% reduction in DSO)

---

### Phase 3 (Weeks 6-8): Late Fees + Xero Sync (CASH FLOW ENFORCEMENT)

**Goal:** Enforce payment discipline & integrate accounting

**Option A - With Schema Migration (Recommended):**

1. ✅ Late fee calculation automation
2. ✅ Xero invoice sync (bi-directional)
3. ✅ Xero payment reconciliation
4. ✅ Advanced bulk operations (CSV export)

**Schema Changes Required:**

```prisma
model InvoiceLateFee {
  id: String @id @default(cuid())
  invoiceId: String
  invoice: Invoice @relation(fields: [invoiceId], references: [id])
  amount: Decimal
  percentage: Decimal
  appliedDate: DateTime
  reason: String
}
```

**Option B - Without Schema Migration (If Preferred):**

1. ✅ Xero invoice sync only
2. ✅ Advanced bulk operations
3. ✅ Enhanced analytics (aging report, payment cycle)
4. Defer late fees to future phase

**Deliverables:**

- Late fees automatically calculated for overdue invoices (if Option A)
- Xero bi-directional sync (invoices, payments, tax codes)
- Accounting reconciliation automated
- CSV export for manual analysis

---

### Post-Phase 3: Optional Future Enhancements

- Recurring invoice automation (requires schema migration)
- Invoice versioning/amendments
- Advanced analytics dashboard
- Follow-up email sequences
- Item-level attachments

---

## Expected Cash Flow Impact (Primary Objective)

### Days Sales Outstanding (DSO) Reduction

**Current Baseline:** Measure current average days to payment
**Expected Improvements:**

- **Phase 1 (Automated Reminders):** 10-15% DSO reduction
  - Proactive reminders before due date reduce forgetfulness
  - Escalating reminders create urgency for overdue invoices
- **Phase 2 (Stripe Payment Links):** Additional 20-30% DSO reduction
  - Instant payment capability removes friction
  - Customers pay immediately from email (no login required)
  - Credit card payments process instantly vs. bank transfer delays
- **Phase 3 (Late Fees):** 5-10% DSO reduction
  - Creates financial incentive for on-time payment
  - Reduces serial late payers

**Combined Impact:** 35-55% reduction in DSO

- **Example:** If current DSO is 45 days, expect reduction to ~25-30 days
- **Cash Flow Benefit:** Faster access to working capital, reduced credit risk

### Collection Rate Improvement

**Current Baseline:** Measure % of invoices paid by due date
**Expected Improvements:**

- **Phase 1:** +15-20% on-time payment rate (reminders nudge customers)
- **Phase 2:** +25-35% on-time payment rate (instant payment option)
- **Phase 3:** +10-15% on-time payment rate (late fee deterrent)

**Combined Impact:** 50-70% improvement in on-time collections

### Revenue Acceleration

**Scenario:** $500K annual invoiced revenue, current DSO 45 days

- **Before:** Average outstanding receivables = $500K × (45/365) = $61,644
- **After (30 days DSO):** Average outstanding receivables = $500K × (30/365) = $41,096
- **Cash Released:** $20,548 working capital freed up
- **Plus:** Late fee revenue (estimated 2-5% of total AR annually)

---

## Success Metrics

### Primary: Cash Flow Metrics

1. **Days Sales Outstanding (DSO)**
   - Baseline: Measure current (estimate 40-50 days for AU B2B)
   - Target: Reduce to 25-30 days (35-55% improvement)
   - Measure: Monthly calculation of average collection period

2. **Collection Rate**
   - Baseline: % invoices paid by due date (estimate 60-70%)
   - Target: 90%+ on-time payment rate
   - Measure: Weekly tracking of on-time vs. late payments

3. **Overdue Invoice Value**
   - Baseline: Total $ value of overdue invoices
   - Target: 50% reduction in overdue balances
   - Measure: Weekly overdue balance report

### Secondary: Operational Metrics

4. **Automation Rate**
   - Baseline: X manual reminder sends per week
   - Target: 80% reduction in manual reminder sends
   - Measure: Track automated vs. manual reminder ratio

5. **Payment Method Mix**
   - Baseline: 100% bank transfer/cash (slow methods)
   - Target: 40%+ via Stripe payment links (instant)
   - Measure: Track payment method distribution

6. **Time to Payment (from Invoice Send)**
   - Baseline: Average days from send to payment
   - Target: 50% reduction (instant payment option)
   - Measure: Track send-to-payment timeline

### Tertiary: Customer Experience

7. **Customer Satisfaction**
   - Baseline: Survey current satisfaction with payment process
   - Target: +25% improvement score
   - Measure: NPS, customer feedback surveys

---

## Risk Mitigation

### Technical Risks

- **Stripe integration complexity:** Start with basic checkout, iterate
- **Schema migrations:** Test thoroughly in staging, backup production
- **Email deliverability:** Monitor bounce rates, use existing email queue

### Business Risks

- **Late fee compliance:** Legal review required (AU consumer law)
- **Customer resistance to automation:** Allow opt-out of automated reminders
- **Over-automation:** Keep human touch options available

---

## Dependencies & Prerequisites

### Required Services

- ✅ Inngest (already configured)
- ✅ Email queue (already working)
- 🔄 Stripe account (need to set up)
- 🔄 Xero developer account (need to set up)

### Required Approvals

- Late fee policy (legal review)
- Stripe payment gateway (business decision)
- Xero integration scope (accounting policy)

---

## Verification & Testing

### End-to-End Testing Scenarios

1. **Automated Reminders:**
   - Create overdue invoice → wait for cron → verify email sent
   - Check escalation levels (gentle → urgent → final)
   - Verify rate limiting (no spam)

2. **Payment Links:**
   - Create invoice with payment link → customer pays → verify auto-update
   - Test webhook handling → verify payment recorded
   - Check receipt generation → verify email sent

3. **Late Fees:**
   - Create overdue invoice past threshold → wait for calculation → verify fee applied
   - Check status history → verify audit trail
   - Test PDF generation → verify fee included

4. **Xero Sync:**
   - Create invoice in LFM → verify synced to Xero
   - Record payment in Xero → verify updated in LFM
   - Test conflict resolution → verify proper handling

5. **Bulk Operations:**
   - Select 10 invoices → send reminders → verify all sent
   - Select 20 invoices → export CSV → verify data accuracy
   - Select 5 invoices → download ZIP → verify PDFs included

### Performance Testing

- Bulk operations with 1000+ invoices
- Concurrent webhook processing (Stripe payments)
- Inngest function execution time
- Email queue throughput

---

## Feature Comparison: Quotes vs Invoices

### Features in Quotes NOT in Invoices (Adoption Opportunities)

1. **Quote Versioning** → Could add Invoice Amendments
2. **Favourites/Starred** → Could add for quick re-invoicing
3. **Follow-up Emails** → High value for overdue invoices (RECOMMENDED)
4. **Item Attachments** → Could support proof of delivery
5. **Advanced Analytics** → Conversion funnel, time-to-decision
6. **Multiple Email Types** → Invoices only have 2 vs quotes' 6

### Features in Invoices NOT in Quotes

1. **Payment Tracking** (appropriate - quotes don't need this)
2. **Receipt Generation** (appropriate - quotes don't need this)
3. **Overdue Tracking** (appropriate - quotes have expiry instead)
4. **Mark as Draft** (invoices can regress, quotes cannot)

---

## Integration Roadmap

### Phase 1: Internal Integrations (Weeks 1-2)

- ✅ Quote → Invoice link (already exists)
- 🔄 Add reverse link (invoice shows source quote)
- 🔄 Customer payment preference sync

### Phase 2: Payment Integration (Weeks 3-5)

- ✅ Stripe payment links (HIGH PRIORITY)
- 🔄 Stripe webhook processing
- 🔄 Automatic payment reconciliation

### Phase 3: Accounting Integration (Weeks 6-8)

- ✅ Xero invoice sync (bi-directional)
- 🔄 Xero payment reconciliation
- 🔄 Tax code mapping

### Future: Advanced Integrations

- Zapier/Make workflows
- Multi-currency support
- Alternative payment gateways (PayPal, Square)
- SMS reminders (Twilio)

---

## Conclusion

This plan prioritizes **high-impact, achievable improvements** that:

1. ✅ Reduce manual work (automated reminders, bulk ops)
2. ✅ Improve cash flow (payment links, late fees) - **PRIMARY OBJECTIVE**
3. ✅ Enhance accounting (Xero sync, reconciliation)
4. ✅ Enable business scale (recurring invoices, integrations)

**Recommended Starting Point:** Phase 1 (Weeks 1-2) - Automated reminders + code quality fixes for immediate cash flow improvement with minimal risk.

**Biggest Impact:** Phase 2 (Weeks 3-5) - Stripe payment links expected to deliver 20-30% DSO reduction alone.

---

**Author:** Ivancho Garzon \<Lehenbizico>
**Last Updated:** 2026-04-12
**Status:** Ready for implementation — Phase 1 items partially complete (see notes below)
**Priority:** Focus on cash flow improvements (automated reminders, payment links, late fees)
