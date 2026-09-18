# VendorOrder, not CheckoutSession, is the primary transactional aggregate

The single-shop `VendorOrder` — not the parent `CheckoutSession` — is the primary transactional aggregate for order fulfillment. `CheckoutSession` is a thin, short-lived saga that fans a `Cart` out into independent `VendorOrder`s and then has no further lifecycle of its own. Every locked business rule (item-level rejection, independent delivery methods, no multi-vendor COD, per-vendor commission) operates at the single-vendor-order level, not at a composite "checkout" level.

**Considered Options:** Modeling checkout as one composite order object spanning all shops in the cart was considered and rejected — it would force cross-shop coordination that the business rules explicitly disallow (see ADR-0006).
