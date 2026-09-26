# VTEX BFF - Product Search Shelf Implementation

This project is a Backend-for-Frontend (BFF) developed with NestJS, specifically engineered to implement a resilient **Product Search Shelf** for VTEX Intelligent Search. It serves as the critical orchestration layer between a Next.js frontend and the VTEX API.

## 🏗 Architecture

The system implements a tiered architecture to ensure high availability and low latency:

**Next.js Frontend** $\rightarrow$ **NestJS BFF (GraphQL)** $\rightarrow$ **VTEX API (REST/GraphQL)**

### Core Implementation Details:
- **Resilience (Circuit Breaker)**: Uses `opossum` to monitor VTEX API health. If the API fails or slows down beyond thresholds, the circuit opens, and the BFF returns cached data or a graceful fallback, preventing the frontend from hanging.
- **Caching Strategy**: Implements a dual-layer caching mechanism (Redis for distributed state, In-memory for hot-path data) using `cache-manager`, significantly reducing the load on VTEX and improving Time-to-First-Byte (TTFB).
- **Data Normalization**: 
  - **Price Fixes**: Standardized prices as `Float` to ensure precision for currency formatting.
  - **Image Mapping**: Implemented a robust mapping logic that prioritizes item-level images but falls back to product-level images, ensuring no product is displayed without a visual.
- **Protocol Translation**: Maps frontend-friendly GraphQL queries to the specific requirements of the VTEX Search API.

## 🚀 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **API**: [Apollo Server / GraphQL](https://www.apollographql.com/)
- **Resilience**: [Opossum](https://github.com/nodeshift/opossum)
- **Caching**: `cache-manager` + Redis
- **HTTP Client**: Axios

## 🛠 How to Run

### Prerequisites
- Node.js (v18+)
- Redis (optional, for distributed caching)

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file in the root:
```env
VTEX_API_KEY=your_api_key
VTEX_ACCOUNT=your_account
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Development
```bash
npm run start:dev
```

## 📂 Key Components
- `src/search/search.service.ts`: The heart of the implementation. Handles VTEX communication, circuit breaking, and caching.
- `src/search/search.resolver.ts`: Defines the GraphQL schema and entry points for the Search Shelf.
- `src/search/dto/search-result.dto.ts`: Defines the normalized data structures returned to the frontend.
