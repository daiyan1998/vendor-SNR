# No platform money custody — commission ledger decoupled from payment

Vendors Hub never holds, moves, or takes custody of customer funds in V1. All money flows directly customer → vendor, via COD or the vendor's own online payment channel. Commission owed by vendors is tracked in a per-vendor financial ledger (`VendorLedger`) but collected out-of-band via a periodic weekly invoice — never deducted from a platform-held balance. This single decision is why V1 needs no PCI-DSS or payment-institution licensing at launch. The trade-off: commission collection depends on vendors actually paying their invoice, with no enforcement mechanism yet defined for non-payment.

**Considered Options:** Platform-held escrow/split-settlement is the conventional marketplace pattern, but was rejected as requiring merchant-of-record and payment-licensing overhead not viable before product-market fit.
