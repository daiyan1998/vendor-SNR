# A single COD payment may never span multiple vendor orders

When a cart spans multiple shops, each resulting `VendorOrder` gets its own independent COD confirmation — one COD payment is never split across or shared between multiple vendor orders. This preserves per-vendor accountability for undeliverable/no-show tracking (the COD-abuse baseline) and keeps each `VendorOrder`'s fulfillment and payment fully independent. Trade-off: a less seamless multi-vendor checkout UX — the customer confirms COD per shop, not once for the whole cart.
