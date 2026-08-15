# MeridianLink Deployment Guide

MeridianLink can be deployed self-hosted with Docker, on Vercel, Fly.io, Railway, Render, or any Node.js container platform.

---

## 1. Docker Compose Deployment (Recommended for Self-Hosting)

### Step 1: Clone and Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: Set to your PostgreSQL connection string
- `OWNER_EMAIL`: Your login email address
- `OWNER_INITIAL_PASSWORD`: A secure password
- `APP_SECRET`: A 32+ character random string
- `NEXT_PUBLIC_APP_URL`: Your production URL (e.g. `https://links.yourdomain.com`)

### Step 2: Start Containers

```bash
docker compose up --build -d
```

The database schema will automatically initialize and the application will be available on port 3000.

---

## 2. Reverse Proxy Geolocation Setup

MeridianLink inspects HTTP headers provided by your CDN or reverse proxy to determine the visitor's country without external API calls:

| Reverse Proxy / CDN | Country Header | Configuration |
| :--- | :--- | :--- |
| **Cloudflare** | `CF-IPCountry` | Enabled by default on all Cloudflare zones |
| **Vercel** | `X-Vercel-IP-Country` | Added automatically on Edge/Serverless functions |
| **Fly.io** | `Fly-Client-IP-Country` | Added automatically to incoming requests |
| **AWS CloudFront** | `CloudFront-Viewer-Country` | Enable "CloudFront-Viewer-Country" in Origin Request Policy |
| **Fastly** | `Fastly-Client-IP-Country` | Available in VCL |

---

## 3. Scheduled Maintenance Job

To trigger retention pruning and scheduled link health checks automatically, configure a recurring curl request (e.g. via crontab or GitHub Actions scheduled workflow):

```bash
# Run hourly maintenance
0 * * * * curl -X GET https://links.yourdomain.com/api/cron -H "Authorization: Bearer YOUR_APP_SECRET"
```
