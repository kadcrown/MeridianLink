# MeridianLink Privacy Architecture

MeridianLink is engineered with a strict privacy-by-design posture that respects visitor privacy while delivering actionable attribution metrics.

---

## 1. Zero Raw IP Persistence

- Raw visitor IP addresses are **never stored** in the database.
- Unique visitor estimation uses a rotating daily salted hash:
  $$\text{Hash} = \text{HMAC-SHA256}(\text{Secret} + \text{UTC Date}, \text{IP} + \text{UserAgent})$$
- Because the secret salt rotates every UTC day, cross-day visitor tracking is cryptographically impossible.

---

## 2. Bot & Crawler Segregation

- Known web crawlers, search spiders (Googlebot, Bingbot, Yandex), social link previews (Twitterbot, Slackbot, Facebook), and uptime monitors are detected via User-Agent inspection.
- Bots are tracked under a separate counter (`botClicks`) and excluded from primary human click reporting.

---

## 3. Configurable Data Retention

- Raw click entries older than `DATA_RETENTION_DAYS` (default: 90 days) are automatically pruned by the cron maintenance job.
- Only aggregated daily rollups (`DailyAnalyticsRollup`) are retained long term, containing no personal data or user identifiers.
