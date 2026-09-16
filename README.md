# VTEX BFF POC

A production-ready Backend-for-Frontend (BFF) developed with NestJS to optimize and secure queries for VTEX Intelligent Search.

## 🚀 Features

- **GraphQL API**: Simplified interface for product searches.
- **Distributed Caching**: Redis integration to reduce VTEX API latency and costs.
- **Fault Tolerance**: Circuit Breaker (Opossum) to prevent cascading failures when VTEX is unstable.
- **Security**: 
  - Rate limiting to prevent API abuse.
  - CORS configuration for domain restriction.
- **Observability**: Health check endpoint (`/health`) for infrastructure monitoring.

## 🛠 Tech Stack

- **Framework**: NestJS
- **API**: GraphQL (Apollo Server)
- **Cache**: Redis
- **HTTP Client**: Axios
- **Language**: TypeScript

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn
- Redis (running locally or via Docker)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SamuelRodriguess/poc-bff-vtex.git
   cd poc-bff-vtex
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Environment Setup:
   Create a `.env` file in the root directory:
   ```env
   VTEX_API_KEY=your_api_key
   VTEX_ACCOUNT_NAME=your_account_name
   PORT=3000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   CACHE_TTL=600
   ALLOWED_ORIGINS=http://localhost:3000
   RATE_LIMIT_LIMIT=100
   RATE_LIMIT_TTL=60
   ```

4. Run the application:
   ```bash
   yarn run dev
   ```

## 📡 Endpoints

- **GraphQL Playground**: `http://localhost:3000/graphql`
- **Health Check**: `http://localhost:3000/health`

## 🧪 Scripts

- `yarn run build`: Build the project for production.
- `yarn run start:prod`: Run the built project.
- `yarn run test`: Run unit tests.
