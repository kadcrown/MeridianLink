# MeridianLink Security Specification

MeridianLink is designed with defense-in-depth security principles suitable for production deployment.

---

## 1. Server-Side Request Forgery (SSRF) Protection

When ingesting Amazon URLs, resolving short links, or running destination health checks:
- **Private IP Address Blocking**: Resolves destination hostnames and rejects private loopback (`127.0.0.0/8`, `::1`), RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), AWS IMDS metadata service (`169.254.169.254`), and local domains (`.localhost`, `.local`, `.internal`, `.lan`).
- **Domain Allowlisting**: Only recognized Amazon domain patterns and validated Amazon shorteners (`amzn.to`, `a.co`, `amzn.eu`, `amzn.asia`) are followed.
- **Strict Protocol Enforcement**: Non-HTTP/HTTPS protocols (`file://`, `ftp://`, `gopher://`, `dict://`) are rejected immediately.
- **Hop Limit**: Short link expansion enforces a maximum limit of 5 hops with SSRF re-validation on every redirect hop.

---

## 2. Owner-Only Authentication & Session Hardening

- **No Multi-Tenant Attack Surface**: Single owner workspace with no team invites, user registration, or permission escalation vectors.
- **Cryptographic Session Tokens**: Base64URL-encoded payloads signed with HMAC-SHA256 using `APP_SECRET`.
- **Constant-Time Verification**: Uses `crypto.timingSafeEqual` to prevent side-channel timing attacks during token signature verification.
- **Cookie Security**:
  - `HttpOnly`: Inaccessible to client JavaScript (XSS defense).
  - `SameSite: Lax`: Protects against Cross-Site Request Forgery (CSRF).
  - `Secure`: Transmitted only over HTTPS in production.
- **Brute-Force Rate Limiting**: In-memory rate limiting rejects IP addresses exceeding 10 failed login attempts in 5 minutes.

---

## 3. CSV Injection (Formula Injection) Prevention

When exporting analytics reports:
- Any cell string beginning with spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) is safely prefixed with an apostrophe (`'`).
- Internal double quotes are escaped according to RFC 4180 standards.

---

## 4. HTTP Security Headers

Configured via `next.config.mjs`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
