# Deploying MeridianLink on Dokploy

This guide explains how to deploy **MeridianLink** to your server using **Dokploy** (via GitHub auto-deploy or Docker Compose).

---

## Method 1: Deploy from GitHub (Recommended)

### Step 1: Create an Application in Dokploy
1. Log in to your **Dokploy Dashboard**.
2. Create a new **Project** (e.g. `Affiliate Tools`) or open an existing one.
3. Click **Create Service** &rarr; Select **Application**.
4. Set Name: `meridianlink`.

### Step 2: Connect the GitHub Repository
1. Under **Source**, select **GitHub**.
2. Connect repository: `kadcrown/MeridianLink`.
3. Branch: `main` (or your preferred deployment branch).
4. Build Type: **Dockerfile** (Dokploy will automatically use the optimized multi-stage `Dockerfile`).

### Step 3: Configure Environment Variables
In Dokploy's **Environment** tab, add:

```env
# Required Production Secrets
DATABASE_URL=file:/app/prisma/dev.db
OWNER_EMAIL=owner@yourdomain.com
OWNER_INITIAL_PASSWORD=YourStrongPasswordHere123!
APP_SECRET=generate_a_random_32_character_hex_or_alphanumeric_secret_here

# Public Domain (Used for generating short redirect URLs)
NEXT_PUBLIC_APP_URL=https://links.yourdomain.com

# Geo & Privacy Headers
TRUSTED_PROXY_HEADERS=CF-IPCountry,X-Geo-Country,X-Vercel-IP-Country,Fly-Client-IP-Country
DATA_RETENTION_DAYS=90
NODE_ENV=production
PORT=3000
```

### Step 4: Add Persistent Volume (For Database Storage)
In Dokploy's **Volumes** / **Storage** tab:
- **Mount Path**: `/app/prisma`
- **Volume Name**: `meridianlink_data`
*(This ensures your SQLite database, smart links, and encrypted credentials persist across container restarts and redeployments).*

### Step 5: Configure Domain & SSL
1. Under the **Domains** tab in Dokploy:
   - Host: `links.yourdomain.com`
   - Port: `3000`
   - HTTPS / SSL: Enable **Let's Encrypt / Automatic SSL**.
2. Click **Deploy**.

---

## Method 2: Deploy via Docker Compose on Dokploy

1. In Dokploy, click **Create Service** &rarr; Select **Compose**.
2. Paste the contents of `docker-compose.yml`:
3. Click **Deploy**.

---

## Post-Deployment Checklist

1. **Owner Login**:
   - Open `https://links.yourdomain.com/login`
   - Log in with `OWNER_EMAIL` and `OWNER_INITIAL_PASSWORD`.
2. **Configure Amazon Creators API**:
   - Go to **Platform Settings** (`/settings`) &rarr; Click **Edit Credentials**.
   - Enter your Amazon OAuth 2.0 Client ID and Client Secret.
3. **Add Regional Affiliate Tags**:
   - Go to **Amazon Store Tags** (`/affiliates`) and enter your tracking IDs for US, CA, UK, DE, JP, etc.
4. **Install Browser Extension / WordPress Plugin**:
   - Download the packages from **Integrations** (`/integrations`).
