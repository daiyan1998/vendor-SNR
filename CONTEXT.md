# Vendors Hub

A multivendor marketplace connecting customers with verified physical shops. Its purpose is to digitize existing physical retail into a discoverable, transactable online presence, without transferring ownership of the customer relationship, pricing, or fulfillment away from the shop.

## Shared Vocabulary

**Verified shop**:
A shop that has completed physical-presence verification and may publish listings and receive orders. Verification is the product's core trust signal.
_Avoid_: "Approved shop", "active shop" (verification is a distinct state, not general account status).

**Vendor**:
Informal/role term for a Shop acting as a seller. Retained only where it's already baked into locked entity names (VendorOrder, VendorLedger, V2V); the entity itself is always **Shop**.
_Avoid_: Using "Vendor" as an entity name for new concepts — prefer "Shop".

**Money**:
An amount paired with a currency. Used wherever a price or monetary figure is recorded (listing price, bargain offer, commission entry, invoice).

**PhoneNumber**:
A country code + number pair with a verified flag. The sole identity credential in this product — see OTP and Session. There is no password.

**Address**:
A customer delivery address: line1, line2, city, area, optional geo-coordinates.

**RatingScore**:
An integer 1–5, used for product and shop-service ratings.

**AvailabilityLabel**:
The only stock signal ever shown to a customer: one of In Stock / Limited / Available / Out of Stock. Never an exact quantity, regardless of how a listing tracks inventory internally.
_Avoid_: "Stock count", "quantity remaining" (never customer-facing).

## Identity & Access

Central user identity, sessions, shop membership, roles, and permission overrides.

**User**:
The single central identity for a person, holding their phone credential and sessions. A User has no fixed global role — capabilities come entirely from memberships (shop staff, business ownership, admin), so the same person can act in different capacities across different shops.
_Avoid_: "Account" (ambiguous between User and Shop).

**ShopInvitation**:
A pending offer from a Shop to a phone number to join with a specific Role, keyed by phone number rather than User — the number need not be registered yet. Resolves into a ShopMembership on acceptance, or terminates on decline, cancellation by the Shop, or a 7-day expiry. A new ShopInvitation may be sent after a prior one terminates.

**ShopMembership**:
The link between a User and a Shop, carrying a Role plus any per-user overrides. Created the moment a ShopInvitation is accepted, and tracks accept → removal from there.
_Avoid_: conflating with ShopInvitation — a ShopMembership only exists post-acceptance and always has a User attached; before that, it's just a pending ShopInvitation.

**Role**:
A named permission bundle, either vendor-side (Shop Owner, Shop Manager, Salesperson) — scoped to a single Shop via a ShopMembership — or admin-side (Super Admin, Admin, Moderator) — global/platform-level, with no Shop scoping at all. Role defaults are fixed platform-wide, never customized per shop, and can only be widened per user via an override — see Permission override.

**Permission override**:
A per-user or per-shop grant that widens a Role's default permissions (e.g., letting a specific Salesperson accept bargains without promoting them to Manager). Effective permissions = Role defaults + overrides — overrides only ever widen, never narrow, and only a Shop Owner may grant one.

**OTP**:
The one-time code sent to a PhoneNumber to prove ownership. It is the entire credential — Registration and Login both end the same way: an OTP verified against a PhoneNumber, with no password involved anywhere in the product.
_Avoid_: "Password", "credential" alone (PhoneNumber + OTP together are the credential).

**Session**:
An authenticated device instance tied to a User, created the moment an OTP verification succeeds. Registration and Login both terminate in a Session directly — there is no separate login step after a successful OTP. A User may hold multiple concurrent Sessions (e.g. phone app and web at once) — logging in on one device never invalidates another.
_Avoid_: "Token" (Session is the domain concept; its implementation — cookie, JWT, etc. — is not).

## Shop & Verification

Shop/Business lifecycle, verification workflow, shop settings.

**Business**:
An entity that groups multiple Shops under one owner. Thin — it has no responsibilities beyond ownership grouping.

**Shop**:
The unit of trust and of the customer relationship. Owns its memberships, its verification status, and its settings. A Shop is either owned directly by a User or owned via a Business.
_Avoid_: "Store", "Vendor" as an entity name — see Vendor above.

**ShopVerification**:
The evidence and state-transition record (Pending → Verified/Rejected, Verified → Revoked) tracking a single Shop's verification. Always scoped to one Shop — never inherited from a parent Business or a sibling Shop.

## Catalog & Inventory

Canonical products, shop listings, variants, stock/availability.

**Product** (canonical):
The platform-owned product identity and its shared attributes, independent of any shop. Multiple shops can each create their own listing against the same Product.
_Avoid_: "Item" (too generic — distinguish Product from ShopListing).

**ProductVariant**:
A specific variant (size, color, model) of a canonical Product.

**ShopListing**:
A shop's own price, availability, and media against a Product — vendor-owned and mutated independently of the canonical Product it references.
_Avoid_: "Listing" alone when the canonical Product is also in scope — be explicit about which one is meant.

**InventoryRecord**:
The stock state behind a ShopListing: either exact-quantity tracking or an availability-label. Customers only ever see the derived AvailabilityLabel, never the underlying quantity.

## Bargaining & Messaging

Conversations, structured offers, negotiated pricing.

**Conversation**:
One thread per customer–shop pair (never per staff member), owning its Messages and embedded BargainOffers. Any staff member with messaging permission can respond within it.

**Message**:
A single entry in a Conversation — either plain text or a structured offer type.

**BargainOffer**:
An offer or counter-offer with a price, an expiry, and a status, embedded as a structured Message inside a Conversation rather than a standalone concept.

**Accepted price**:
A time-limited (24–48h), customer-specific price produced by an accepted BargainOffer. It never permanently changes the public listing price.
_Avoid_: "Discount", "negotiated price" without the time-limited, single-customer qualifier.

## Cart & Checkout

Cart composition, checkout session orchestration.

**Cart**:
A customer's in-progress selection, which can span multiple shops at once.

**CheckoutSession**:
The short-lived process that converts a Cart into one or more independent VendorOrders (one per shop). It has no lifecycle of its own beyond that fan-out.
_Avoid_: "Order" for the CheckoutSession itself — the checkout is not an order; it produces orders.

## Order Fulfillment

Vendor orders, order items, the fulfillment state machine, delivery info.

**VendorOrder**:
One shop's portion of a checkout — the primary transactional unit of order fulfillment. Owns its OrderItems, its status history, and its delivery info, and progresses independently of any other shop's VendorOrder from the same checkout.
_Avoid_: bare "Order" (ambiguous — always qualify as VendorOrder or OrderItem).

**OrderItem**:
A single product line within a VendorOrder, with its own state machine (Pending → Confirmed → … → Completed, plus Cancelled/Rejected/Return branches). Rejection and cancellation happen at the item level, not the whole order.

**OrderStatusHistoryEntry**:
An immutable, append-only record of one OrderItem state transition: status, timestamp, and acting party.

## Returns & Disputes

Return requests, dispute escalation and resolution.

**ReturnRequest**:
A return/refund request against one specific, `Completed` OrderItem, created within the active return window.

**Dispute**:
An escalated disagreement over a ReturnRequest, raised after vendor inactivity or explicit objection by either party, resolved by an Admin/Moderator.

## V2V Coordination

Inter-vendor sourcing requests, invisible to the customer.

**V2VRequest**:
A request from one shop (short on stock) to source inventory from another shop. The requesting shop remains the sole customer-facing fulfiller — this is inventory sourcing between shops, not drop-shipping to the customer.
_Avoid_: "Vendor-to-vendor sale" (the customer never sees or transacts with the source shop).

## Financial Ledger

Commission accrual/finalization, vendor ledger, invoicing — explicitly not payment execution.

**VendorLedger**:
A per-shop running accounting record of commission entries, entirely independent of whether Vendors Hub ever holds any money.

**CommissionEntry**:
A single commission line tied to one OrderItem. Starts Provisional and becomes Final once that item's return/dispute window closes with no open case.

**CommissionInvoice**:
A periodic (weekly) bundle of Final commission entries for one shop, separate in cadence and purpose from subscription billing.

## Reviews

Product/shop review capture and publication.

**Review**:
A product rating + a shop-service rating pair, submitted once per (Customer, OrderItem), only after that OrderItem reaches `Completed`.
_Avoid_: Treating product rating and shop-service rating as the same number — they're two distinct dimensions captured together.

## Subscription & Billing

Tier assignment, cap enforcement, boosting entitlement — not payment execution.

**Subscription**:
A shop's current tier (Basic/Professional/Premium) and its cap usage (listing count, staff seats).

**Boost**:
A purchased, time-bound visibility boost, gated by subscription tier.

## Trust & Safety

Reports, moderation actions, COD-abuse tracking, audit log.

**Report**:
A moderation report filed against any reportable entity (product, shop, review, message), using one shared reason taxonomy across all of them.

**AuditLogEntry**:
An immutable record of a sensitive action (verification, financial, order-status transitions). Append-only; not a true aggregate with invariants beyond immutability.
