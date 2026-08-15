# MeridianLink 🌐

> **Precision Geo-Routing and Localization Engine for Amazon Affiliates**

MeridianLink is a production-ready, personal-use smart-link management and localization service. It enables a single content creator or affiliate marketer to ingest Amazon product URLs, automatically extract ASINs and metadata, assign regional affiliate tracking IDs across 21 global Amazon marketplaces, deterministically route international visitors based on geolocation and device, serve accessible choice pages and weighted A/B split-tests, monitor destination health, and record privacy-first analytics.

---

## Key Features

- **21 Amazon Marketplaces Supported**: US, CA, UK, DE, FR, IT, ES, NL, SE, PL, BE, JP, IN, AU, BR, MX, SG, SA, AE, TR, EG.
- **Deterministic Geo-Routing**: Resolves visitor country from trusted reverse-proxy headers (`CF-IPCountry`, `X-Geo-Country`, `X-Vercel-IP-Country`, `Fly-Client-IP-Country`) with automatic fallback to nearest regional marketplace.
- **Hierarchical Affiliate Tags**: Account defaults $\rightarrow$ Group overrides $\rightarrow$ Link overrides.
- **URL Normalizer & Safe Parser**: Cleans tracking bloat, strips existing affiliate IDs, extracts 10-character ASINs, and expands short links with strict SSRF defenses.
- **Accessible Choice Pages (`/c/[slug]`)**: WCAG 2.2 AA compliant multi-store product landing pages with instant dark/light themes and FTC-compliant disclosures.
- **Weighted A/B Split Testing (`/r/[slug]`)**: Deterministic visitor assignment using rotating salted hashes without cookie tracking.
- **Link Health Center**: Automated availability monitoring, HTTP 404 detection, redirect loop prevention, and inline destination URL replacement.
- **Privacy-First Analytics**: No raw IP storage. Daily salted visitor hashing, bot & crawler classification, and pre-computed daily rollups for sub-second reports.
- **Single-Owner Security**: Bcrypt-hashed credentials, HTTP-only signed session tokens, rate-limited login, CSRF defenses, and CSV formula injection protection.

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+ (tested on Node 20 & 24)
- npm 9+

### Installation

```bash
# 1. Clone repository and install dependencies
npm install

# 2. Synchronize database schema & seed 30 days of realistic data
npx prisma db push
npm run prisma:seed

# 3. Launch development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

- **Owner Email**: `owner@meridianlink.local`
- **Owner Password**: `ChangeMeInProd123!`

---

## Testing Server-Side Redirects

MeridianLink provides server-side redirection at `/r/[slug]`. In local development, use the `__country` query parameter to simulate different visitor countries:

- **United States (Default)**: `http://localhost:3000/r/sony-xm5` $\rightarrow$ redirects to `amazon.com/dp/B09XS7JWHH?tag=meridian-20`
- **Canada Simulation**: `http://localhost:3000/r/sony-xm5?__country=CA` $\rightarrow$ redirects to `amazon.ca/dp/B09XS7JWHH?tag=meridian-ca-20`
- **United Kingdom Simulation**: `http://localhost:3000/r/sony-xm5?__country=GB` $\rightarrow$ redirects to `amazon.co.uk/dp/B09XS7JWHH?tag=meridiantech-uk-21`
- **Germany Simulation**: `http://localhost:3000/r/sony-xm5?__country=DE` $\rightarrow$ redirects to `amazon.de/dp/B09XS7JWHH?tag=meridian-de-21`

---

## Running Tests

```bash
# Run unit & integration tests (Vitest)
npm test

# Run End-to-End tests (Playwright)
npm run test:e2e
```

---

## Production Build & Docker

### Local Docker Compose (with PostgreSQL)

```bash
docker compose up --build -d
```

### Production Next.js Bundle

```bash
npm run build
npm run start
```

---

## Documentation

- [Architecture Overview](file:///ARCHITECTURE.md)
- [Security & SSRF Defenses](file:///SECURITY.md)
- [Privacy & Analytics Specification](file:///PRIVACY.md)
- [Deployment Guide](file:///DEPLOYMENT.md)
