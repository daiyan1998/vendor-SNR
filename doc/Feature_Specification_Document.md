# Feature Specification Document

# Vendors Hub — Feature Specification Document (V1 / MVP)

**Status:** Foundation document for Product/Project Specification
**Scope:** Reflects all decisions locked through Design Rounds 1–6
**Convention used throughout:**

- 🟢 **MVP (V1)** — must exist at launch
- 🔵 **Phase 2 / Future** — explicitly deferred, not built at launch
- ⚪ **TBD** — not yet decided; flagged so it is never silently assumed

---

## 0. Product Vision

Vendors Hub is a **multivendor marketplace for verified physical shops** — not a generic ecommerce platform. Its purpose is to digitize physical markets, malls, shops, and supermarkets into an online marketplace **while preserving the relationship between the physical vendor and the customer**.

**Core constraint (MVP):** Online-only sellers are not eligible. A vendor must operate a verified physical shop.

**Launch strategy:** Marketplace-first, single-city launch, architected for eventual multi-city and multi-country operation. Supply-side (vendor) onboarding is the initial operational priority, since a customer marketplace has no value without verified shops and inventory.

---

## 1. Business Model 🟢 MVP

### 1.1 Revenue Streams

- **Vendor subscriptions** (tiered — see §14)
- **Transaction commissions** (per order item — see §13)
- **Paid boosting** (shop/product visibility — see §14.3)

Pricing, exact commission rates, billing cycles, and taxes on these are ⚪ **TBD** (business/finance decision, not a product-design blocker).

### 1.2 Marketplace Position

Vendors Hub acts as an **intermediary marketplace**. Vendors remain the underlying sellers of record for their products. The exact legal "merchant of record" classification is ⚪ **TBD** and must not be assumed in contracts or UI copy until finalized.

### 1.3 Money Custody — Core Architectural Decision

**Vendors Hub does not hold or move customer funds in V1.** All money flows directly customer → vendor, via either:

- Cash/pay-at-store (COD), or
- The vendor's own online payment channel

Commission owed by vendors is **tracked** in a financial ledger but **collected out-of-band** via a periodic invoice (see §13.3), not deducted from a marketplace-held balance. This is a deliberate separation:

> **Financial ledger existing ≠ Vendors Hub having custody of the money.**
> 

This single decision is why no PSP-marketplace licensing, escrow, or merchant-of-record payment infrastructure is required for V1.

---

## 2. Organizational Model 🟢 MVP

### 2.1 Structure

```
User (central identity)
 ├── Individual Shop (directly owned)
 └── Business
      ├── Shop A
      ├── Shop B
      └── Shop C
```

- A user has **no fixed global role**. Identity is central; capabilities come from **memberships** (shop staff membership, business ownership, admin role, etc.), allowing the same person to act in different capacities across different shops.
- An individual may own a shop directly, or a business may own multiple shops.
- Staff membership is modeled at the **shop level**, independent of any single fixed employment record — a staff member may belong to multiple shops simultaneously.

### 2.2 Customer Relationship Ownership

The canonical customer relationship belongs to the **shop**, not to an individual salesperson:

```
Customer → Shop → Salesperson (not: Customer → Salesperson)
```

This underpins messaging (§10), reviews (§11), and staff departure handling.

### 2.3 Staff Lifecycle

- **Invitation-based onboarding**: An Owner/Manager invites a person (existing or new platform user) by phone/email; the person must **accept** before membership activates. This preserves the "central identity" model — a person's account isn't owned or created by the shop.
- **Departure**: When staff leave, access is immediately revoked, but historical work (conversations, orders, bargains they handled) remains attached to the **shop**, not deleted or reassigned. Archival/access UX for viewing this history is ⚪ **TBD**.

---

## 3. Authorization (RBAC) 🟢 MVP

### 3.1 Roles

**Vendor-side:** Shop Owner, Shop Manager, Salesperson
**Admin-side:** Super Admin, Admin, Moderator

### 3.2 Permission Model

```
Role permissions + Individual/shop-specific overrides = Effective permissions
```

RBAC alone is insufficient — the system supports **per-user or per-shop overrides** on top of role defaults (e.g., granting a specific Salesperson bargain-acceptance rights without promoting them to Manager).

### 3.3 Locked V1 Permission Matrix

| Action | Salesperson | Shop Manager | Shop Owner |
| --- | --- | --- | --- |
| Create/edit products & prices | ❌ | ✅ | ✅ |
| Manage inventory | ✅ | ✅ | ✅ |
| Accept/counter bargains | ❌ (unless overridden) | ✅ | ✅ |
| Reject order items | ✅ | ✅ | ✅ |
| Approve returns / issue refunds | ❌ | ✅ | ✅ |
| Create V2V requests | ❌ | ✅ | ✅ |
| Approve/accept V2V requests | ❌ | ✅ | ✅ |
| Manage staff (invite/remove) | ❌ | ❌ | ✅ |
| View financial ledger | ❌ | ✅ (view only) | ✅ (full) |
| Manage shop settings | ❌ | ❌ | ✅ |
| Respond to customer messages | ✅ (if granted) | ✅ | ✅ |

Any ❌ can be flipped to ✅ per-user via the override system, at Owner discretion. A complete exhaustive permission list beyond this table (e.g., fine-grained analytics access) is ⚪ **TBD**.

---

## 4. Authentication & Account Security 🟢 MVP

- **Primary method:** Phone number + OTP (matches regional norms and doubles as a verified delivery-notification channel). Email is optional/secondary.
- **Sessions:** Persistent per device until manually logged out or revoked; users get a "manage devices" view to revoke sessions remotely. No forced periodic re-authentication in V1.
- **Account recovery:** OTP-only; there is **no mandatory secondary recovery channel** in V1. Losing access to the registered phone number requires manual, admin-assisted support recovery.
- **MFA, social login, advanced device-risk detection:** 🔵 **Phase 2** — not required for launch.

---

## 5. Shop Verification 🟢 MVP

### 5.1 Flow

```
Application → Automated checks → Human review → Approved / Rejected
```

### 5.2 States (locked V1 model)

```
Pending → Verified / Rejected
Verified → Revoked (with mandatory audit trail)
Rejected → Resubmit or Appeal
```

**Decision:** V1 uses a **binary + Pending** model (not a multi-tier Basic/Full verification scheme). The doc's original "multi-level verification" concept is preserved as an *extensible* state design, but tier semantics (what a "Basic" vs "Full" verified shop unlocks) are ⚪ **TBD** and deferred — inventing tier meaning now would preempt undecided trust/ranking design.

### 5.3 Verification Unit

Verification is performed **per shop**, not per business. A business with multiple shops must verify each shop independently — this prevents a fraudulent branch from inheriting legitimacy from a clean sibling shop, and keeps revocation scoped correctly.

### 5.4 Evidence

Includes business licenses, physical-location proof, owner documentation. Exact document requirements by country: ⚪ **TBD**.

---

## 6. Product Catalog 🟢 MVP

### 6.1 Hybrid Model

```
Global/Catalog Product (canonical)
        +
Shop Listing (vendor-specific: price, availability, stock, media)
```

A product concept exists independently of any shop; each shop creates its own listing against it. Exact field-level ownership split between canonical and shop-specific data: ⚪ **TBD**.

### 6.2 Scope

- V1 supports **new products only** — used/refurbished workflows are 🔵 **Phase 2**.
- V1 supports **product variants** (size, color, model). Exact variant architecture (how combinations, pricing-per-variant, and variant-level inventory interact): ⚪ **TBD**.

---

## 7. Inventory 🟢 MVP

- **Ownership:** Inventory belongs to the shop. V2V coordination (§12) does not create platform-owned shared inventory.
- **Tracking mode:** Per-listing vendor choice between:
    - **Exact quantity tracking**, or
    - **Availability-only** (vendor manually sets a label: *In stock / Limited availability / Available / Out of stock*)
    This choice is **not gated by subscription tier** — it's an operational preference open to every vendor.
- **Customer-facing visibility:** Customers never see exact quantities (e.g., never "7 units remaining"), only the availability label above.
- **Out-of-stock listings remain visible** on the platform. Exact behavior around purchaseability, waitlists, and auto-hiding: ⚪ **TBD**.

---

## 8. Discovery & Search 🟢 MVP

### 8.1 Discovery Directions (both supported)

- **Product-first:** Search → Product → Shops selling it
- **Shop-first:** Market/Shop → Shop → Products

### 8.2 Search Architecture (V1)

- **Engine:** Postgres full-text search (with trigram/typo-tolerance extensions as needed). No dedicated search cluster (Elasticsearch/OpenSearch) at launch — deferred until catalog scale or ranking sophistication requires it.
- **Language:** Bengali-language listing entry and search matching are treated as launch-necessary given the initial market, using Postgres text-search configuration. Full cross-script transliteration and typo-tolerance parity between English/Bengali: 🔵 **Phase 2**.
- **Image-based/visual search:** 🔵 **Phase 2** (depends on undecided AI infrastructure, §16).

### 8.3 Marketplace Ranking

How organic relevance interacts with paid boosting is ⚪ **TBD** — flagged as a required Priority-2 decision before launch, since boosting (a committed revenue feature) cannot ship without a defined ranking interaction rule.

---

## 9. Bargaining 🟢 MVP (partially specified)

### 9.1 Model

Structured offer/counter-offer, opt-in per listing (default **off**):

```
Customer → Offer → Vendor → Counter-offer → Customer → ...
```

### 9.2 Locked Mechanics

- **Enablement:** Vendor must explicitly enable bargaining per listing; not on by default.
- **Negotiator roles:** Shop Owner and Shop Manager can respond to bargains by default; a Salesperson can be individually granted this via the RBAC override system (§3.2).
- **Offer expiration:** Each offer or counter-offer auto-expires after **24 hours** if the other party doesn't respond.
- **Discount floor:** Entirely vendor-controlled per listing — the platform does not enforce a maximum discount percentage.
- **Quantity bargaining:** Not supported in V1 — bargaining sets a single-unit price only; quantity is chosen separately at checkout. Quantity-tiered bargaining is 🔵 **Phase 2**.
- **Conversion to purchase:** An accepted offer creates a **time-limited, customer-specific price** (valid 24–48 hours) attached to that customer + product. It does **not** permanently alter the public listing price.
- **Bargaining lives inside the shop's chat thread** (§10) as structured offer message-types, not a separate disconnected flow.

### 9.3 Still Open

Whether bargaining can apply to every product category (vs. certain categories only) beyond the opt-in mechanism, and how bargain history is surfaced in analytics: ⚪ **TBD**.

---

## 10. Messaging 🟢 MVP

- **Structure:** One conversation thread per **customer–shop pair** (not per staff member). Any staff member with messaging permission can respond within that thread.
- **Rationale:** Preserves the locked rule that the customer relationship belongs to the shop, not an individual — a thread survives staff turnover.
- **Bargaining integration:** Offers/counter-offers appear as structured message types inside this same thread (§9.2).
- Attachments, blocking, reporting, retention policy, and read receipts: ⚪ **TBD** (moderation *categories* for reported messages are locked — see §15.1).

---

## 11. Product & Shop Reviews 🟢 MVP

- **Eligibility:** Verified-purchase only — a customer may review a product/shop only after that order-item reaches `Completed` state (§13.1). This is both an anti-fraud gate and a business decision.
- **Scope:** Each completed order-item triggers **one review flow** capturing two things:
    1. A **product rating/text**, attached to the canonical Product.
    2. A **shop-service rating** (delivery, communication, accuracy), attached to the Shop.
    This is lighter-weight than two fully separate review systems, while still preserving both dimensions the original plan called for.
- **Publication:** Reviews publish **immediately** on submission; no pre-moderation queue. Bad-faith reviews are handled via the report-and-takedown flow (§15.1), not pre-screening.
- Detailed review moderation workflow and helpfulness/response features: ⚪ **TBD** / 🔵 **Phase 2**.

---

## 12. V2V Inventory Coordination 🟢 MVP

### 12.1 Purpose

Allows one shop to source inventory from another shop when it's short on stock, without exposing exact stock levels to customers.

### 12.2 Flow

```
Requesting Vendor
      ↓
System recommends a source vendor
      ↓
Requesting Vendor approves
      ↓
Source Vendor accepts
      ↓
(if no response) → Auto-expire after 24h → System recommends next-best candidate
```

### 12.3 Fulfillment Model

The **requesting vendor's shop** sells to and fulfills the end customer. The source vendor supplies inventory *to the requesting vendor*, not directly to the customer — this is not vendor-to-customer drop-shipping. It preserves the "customer relationship belongs to the shop they ordered from" rule; the customer never sees that two shops were involved.

### 12.4 Visibility

Customers never see underlying exact V2V inventory levels at either shop.

Operational rules beyond this (pricing between vendors, rejection reasons, repeated failure handling): ⚪ **TBD**.

---

## 13. Orders, Payments & Financial Ledger 🟢 MVP

### 13.1 Order-Item State Machine (locked)

```
Pending → Confirmed → Processing → Ready → Shipped/PickedUp → Delivered → Completed
```

Side branches:

- **Rejected** — reachable from `Pending` or `Confirmed` (vendor-initiated, item-level, not whole-order)
- **Cancelled** — reachable from `Pending` only (customer-initiated self-cancel)
- **ReturnRequested → ReturnApproved/ReturnDenied → Returned/Refunded** — reachable from `Completed`, within the return window (§13.5)
- **Disputed** — reachable from `ReturnRequested` if either party objects

**Cancellation rule:** Customer can self-cancel only while `Pending`. Once a vendor confirms, the customer must go through the return process instead; the vendor may still reject/cancel up to `Shipped`.

### 13.2 Cart & Checkout

- **Multi-vendor cart:** a single cart can contain items from multiple shops.
- **Unified checkout, separate vendor orders:**

```
Checkout Session → Vendor Order A, Vendor Order B, Vendor Order C
```

Each vendor order progresses independently through its own state machine and its own payment/delivery choice.

- **Per-vendor-order delivery method**, selected independently for each vendor order in the cart.
- **Item-level rejection**: a vendor can reject individual items without rejecting the whole order; a rejected item automatically releases its inventory reservation.

### 13.3 Payment (V1)

- **Supported methods:** (a) COD / pay-at-store, and (b) vendor-specific online payment (i.e., whatever payment flow the individual vendor provides).
- **No multi-vendor COD**: if a cart spans multiple vendors, each vendor order has its own independent payment flow — one COD payment never represents multiple vendors.
- **No platform-held funds, no split payments, no escrow, no marketplace payment gateway in V1** (§1.3).
- **No saved payment methods stored by the platform** — since the platform never takes custody of funds, it has no reason to hold tokenized card data; any storage is the vendor's own responsibility on their own payment page.
- **Payment abstraction:** the order/financial domain is architected so it is not tightly coupled to any single payment provider, enabling future settlement infrastructure without a redesign. No specific provider is selected for V1.

### 13.4 Commission & Financial Ledger

- A **vendor financial ledger** exists from day one as an accounting record, independent of whether Vendors Hub holds any money.
- **Commission is calculated per order item.**
- **Commission is provisional** until the return/dispute window closes, after which it becomes final.
- **Collection mechanism:** Since the platform never touches customer money, vendor-owed commission is collected via a **periodic (weekly) invoice**, kept separate from subscription billing (different cadence and purpose — usage-based vs. fixed recurring).
- Exact commission formula (treatment of discounts, shipping, taxes, refunds): ⚪ **TBD**.

### 13.5 Customer Protection, Returns & Refunds

- **Baseline rule:** Platform sets **minimum** protection rules; vendors may offer stronger protection, never weaker.
- **Return window:** 7 days after delivery (platform minimum; vendors may extend, not shorten).
- **Locked return-reason taxonomy** and fault mapping:

| Reason | Fault | Refund Outcome |
| --- | --- | --- |
| Defective | Vendor | Full refund incl. delivery fee |
| Wrong item | Vendor | Full refund incl. delivery fee |
| Not as described | Vendor | Full refund incl. delivery fee |
| Damaged in transit | Vendor | Full refund incl. delivery fee |
| Changed mind / remorse | Customer | Customer may bear return shipping; vendor may apply a restocking fee at their discretion |
- **Refund timing:** For vendor-online-payment orders, refund is issued **after** the returned item is received and inspected (fraud protection). COD orders have no pre-paid amount to refund except any prepaid delivery-fee portion.
- **Partial refunds (multi-item order, partial return):** Delivery fee is **not** refunded for customer-remorse returns; it **is** refunded in full for the affected item's share when the return reason is vendor-fault.
- **Dispute escalation:** If customer and vendor disagree, the case **auto-escalates to Admin/Moderator** after 3 days of vendor inactivity, or immediately if either party explicitly disputes the outcome.
- Full evidence requirements, replacement-vs-refund policy, and detailed dispute workflow UI: ⚪ **TBD**.

### 13.6 Order History & Auditability

- **Order status history is immutable**, recording status, timestamp, and acting party for every transition.
- **Sensitive order and financial operations are auditable** (see §15.3 for what "auditable" will eventually capture in detail — currently locked in principle, not in field-level structure).

---

## 14. Subscriptions & Boosting 🟢 MVP

### 14.1 Tiers

Basic, Professional, Premium (concept locked; pricing ⚪ **TBD**).

### 14.2 V1 Tier Levers (locked)

Only these three levers are tier-gated in V1 — analytics depth and commission-rate discounts by tier are explicitly **not** part of V1 (deferred, since they require the not-yet-built analytics and commission systems):

| Tier | Listing Cap | Staff Seats | Boosting Access | Price |
| --- | --- | --- | --- | --- |
| Basic | 20 | 1 | ❌ | Free |
| Professional | 200 | 5 | ✅ | ⚪ TBD |
| Premium | Unlimited | Unlimited | ✅ + priority in organic ranking ties | ⚪ TBD |

Trial periods, grace periods, upgrade/downgrade rules, and failed-payment handling: ⚪ **TBD**.

### 14.3 Boosting

Paid boosting is a confirmed monetization feature. Its mechanics (how a boost is purchased, what exactly it affects in ranking, duration, pricing) are ⚪ **TBD** — flagged as a required decision before the ranking algorithm (§8.3) can be finalized, since the two are interdependent.

---

## 15. Trust & Safety 🟢 MVP (baseline only)

### 15.1 Moderation

A single shared report-reason taxonomy applies across all reportable entity types (products, shops, reviews, messages):

> **Counterfeit/Fake, Misleading listing, Inappropriate content, Spam, Harassment, Fraud/Scam**
> 

Reports route to the **Moderator** role queue. Detailed moderation workflow (queue prioritization, suspension escalation ladder, appeals for moderation actions): ⚪ **TBD**.

### 15.2 Fraud & Risk — V1 Baseline

Full fraud/risk system is 🔵 **Phase 2**, but one baseline rule ships at launch:

> A customer with **3 vendor-marked-undeliverable or no-show COD orders within a rolling 30-day window** has COD disabled on their account (must use vendor online payment or store pickup). Appeal is available via support.
> 

### 15.3 Audit System

**Principle locked:** sensitive order and financial operations must be auditable. **Not yet locked:** the exact audit event schema (actor, before/after values, IP/device capture, retention period, export capability). ⚪ **TBD**.

---

## 16. Explicitly Deferred to Phase 2 / Future 🔵

The following are confirmed as part of Vendors Hub's long-term product vision but are **explicitly out of V1 scope** to keep launch focused on the core commerce loop:

| Feature | Reason for Deferral |
| --- | --- |
| **Jobs** (vendors posting job openings) | Adjacent classifieds feature, not core to the physical-shop marketplace loop |
| **To-Let** (commercial space listings) | Same as above |
| **AI product photography / image generation / enhancement** | Depends on undecided provider, cost, moderation, and abuse-prevention infrastructure |
| **AI / image-based visual search** | Same dependency as above |
| **Product video** | Requires transcoding/CDN/storage decisions not needed to validate the core loop |
| **Used/refurbished product listings** | V1 is new-products-only |
| **Courier API integration** | V1 delivery is manual vendor-entered tracking info only |
| **Multi-vendor COD** | Explicitly excluded even long-term unless revisited |
| **Platform-held funds / escrow / split settlement** | Requires MoR/licensing decisions not made |
| **Tiered shop verification (Basic/Full)** | V1 uses binary verified/unverified; tiering deferred |
| **Store-pickup time slots** | V1 uses simple "Ready for pickup" status only |
| **Delivery proof-of-delivery (photo/signature)** | Deferred; disputes handled case-by-case by admin instead |
| **Mandatory secondary account-recovery channel / MFA** | V1 is OTP-only |
| **Elasticsearch/OpenSearch, distance-based ranking, sponsored search results** | Deferred until scale/complexity justifies it |
| **Mobile native apps** | Roadmap item; native vs. React Native, and customer/vendor/admin app split, undecided |
| **Recommendations, voice search, AR, POS synchronization, competitive pricing tools** | Long-term roadmap ideas, not V1 requirements |

---

## 17. Feature Dependency Map (key relationships)

- **Shop Verification** must precede a shop being allowed to create listings or receive orders.
- **RBAC + Overrides** governs every write-action across Catalog, Bargaining, Orders, V2V, and Staff management — no feature below it can be built without it.
- **Order-Item State Machine (§13.1)** is the backbone that Returns, Disputes, Reviews (eligibility gate), Commission finalization, and Notifications all key off of.
- **Bargaining** depends on Messaging (shares the same thread) and on RBAC overrides (who may negotiate).
- **V2V Coordination** depends on Inventory model and produces no customer-visible change to the order flow (fulfillment stays single-shop from the customer's perspective).
- **Reviews** depend on the order reaching `Completed` — cannot be designed independently of the order state machine.
- **Commission Ledger** depends on the order-item state machine (provisional → final transition tied to the return window closing) and is fully decoupled from Payment (§1.3/§13.3), by design.
- **Boosting** and **Marketplace Ranking** are mutually dependent and remain jointly ⚪ **TBD** — neither should be finalized without the other.
- **Subscription tiers** gate Boosting access, Listing count, and Staff seats only — no other feature currently reads subscription tier.

---

## 18. Consolidated TBD Register

For traceability, every open item flagged throughout this document, in one place:

1. Merchant-of-record legal/financial classification
2. Commission rate, subscription pricing, billing cycles, taxes on platform fees
3. Product/shop-listing field-level ownership split
4. Variant architecture (combinations, per-variant pricing/inventory)
5. Out-of-stock behavior (purchaseability, waitlists, auto-hide)
6. Verification document requirements by country
7. Verification tiering (post-V1 concept)
8. Return evidence requirements; replacement-vs-refund policy; full dispute workflow UI
9. Exact commission formula (discounts, shipping, tax treatment)
10. Trial/grace periods, upgrade/downgrade, failed-payment handling for subscriptions
11. Boosting purchase mechanics and pricing
12. Marketplace ranking algorithm (organic vs. boosted interaction)
13. Full moderation workflow (escalation ladder, appeals)
14. Full fraud/risk system beyond the V1 COD baseline rule
15. Audit event schema (fields captured, retention, export)
16. Messaging: attachments, blocking, reporting detail, retention policy
17. Analytics metrics for customer/vendor/admin dashboards
18. Admin console workflows (verification queue, dispute console, reconciliation view)
19. Complete data model (field-level schema)
20. Regional legal/compliance beyond the 3-document launch floor (ToS, Vendor Agreement, Privacy Policy)
21. Bengali/multilingual search parity beyond basic FTS matching
22. Mobile app strategy (native vs. React Native, app split)

---

*This document reflects the state of design decisions as of Round 6. It is intended as the foundation for the full Product/Project Specification and should be revisited as each TBD item above is resolved in future design rounds.*