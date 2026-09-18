# V1 ships as a modular monolith with a URL-versioned REST API

Vendors Hub V1 is architected as a single modular-monolith deployable — application-layer boundaries mirror the bounded contexts internally, cross-context consistency goes through domain events, but the system ships as one deployable — exposing a REST API versioned by URL path, not as separate microservices per context. This minimizes operational overhead before product-market fit is established, while still keeping context boundaries enforceable via internal module boundaries.

**Considered Options:** Splitting into microservices per bounded context was the alternative, rejected as premature given no proven scale requirement yet (performance/SLA targets are still an open question).
