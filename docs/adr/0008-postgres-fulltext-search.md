# Postgres full-text search instead of a dedicated search engine at launch

V1 discovery/search uses Postgres full-text search (with trigram/typo-tolerance extensions as needed) rather than a dedicated search cluster (Elasticsearch/OpenSearch). No dedicated search infrastructure is justified at launch scale. The Catalog/Discovery split — `ShopListing` separate from `Product`, Discovery reading but never owning Catalog data — is deliberately kept swap-friendly so a future migration to a dedicated engine is additive rather than a full rewrite.
