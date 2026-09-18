# ShopListing modeled separately from canonical Product

`ShopListing` is its own aggregate root, referencing the canonical `Product` by ID only, rather than being nested inside it. `Product` is platform-owned and shared across many shops; `ShopListing` is vendor-owned and mutated far more frequently (price, stock) by a different actor. Nesting them would force every vendor's price change to load and lock the shared canonical product, creating write contention across unrelated shops selling the same item.
