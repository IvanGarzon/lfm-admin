# Future Roadmap & TODO

This document tracks planned features, architectural improvements, and future sub-modules identified during development.

## 📦 Inventory Module

Planned enhancements to expand the Inventory grouping:

- [ ] **Stock Management / Adjustments**:
  - Track stock history (in/out logs).
  - Manual stocktake/adjustment interface.
  - Low stock automation and alerts.
- [ ] **Categories & Collections**:
  - Manage product categories (Seasonal, Supplies, etc.).
  - Bulk assign products to categories.
- [ ] **Supplier Management**:
  - Database of vendors/suppliers.
  - Link products to preferred suppliers.
  - Track purchase prices vs. selling prices.
- [ ] **Warehouse / Locations**:
  - Support for multiple inventory locations (Studio, Retail, Warehouse).
  - Inter-location stock transfers.

## 💰 Finance Module

- [ ] **Profit & Loss Dashboard**: Specialized view for financial health.
- [ ] **Tax Reporting**: Automated GST calculation exports for BAS/accounting.
- [ ] **Expense Categories**: More granular control over transaction types.

## 🛠 Architectural Goals

- [ ] **Unified Drawer System**: Continue refactoring all sidebars to match the `TransactionDrawer` / `ProductDrawer` premium layout.
- [ ] **Form Consistency**: Ensure all forms follow the `ProductForm` / `TransactionForm` pattern (discriminating unions for Create/Update inputs).
- [ ] **Validation Limits**: Audit all schemas to ensure `VALIDATION_LIMITS` are applied consistently.
- [ ] **Unsaved Changes Protection**: Roll out the `useUnsavedChanges` hook to the Customers and Employees modules.
