# Changelog

## [1.0.0] - 2026-09-26

### Added
- **Resilient Search Shelf**: Implemented the full end-to-end flow for the Product Search Shelf.
- **Circuit Breaker**: Integrated `opossum` in the BFF to handle VTEX API instability and prevent cascading failures.
- **Caching Layer**: Implemented Redis/In-memory caching to optimize response times and reduce API costs.

### Fixed
- **Price Precision**: Corrected `Price` type from `Int` to `Float` across GraphQL schemas and DTOs to support decimal values.
- **Image Resolution**: Updated image mapping logic to support both product-level and item-level images from VTEX.
- **GraphQL API**: Fixed the `count` parameter to be a `Float` in GraphQL queries to match VTEX requirements.
- **Prerendering Errors**: Resolved Next.js build/prerendering errors by wrapping async search components in `<Suspense>`.
