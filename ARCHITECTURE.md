# MeridianLink Architecture Overview

MeridianLink is designed with a strict separation between core domain logic, infrastructure adapters, and UI presentation layers.

```
                         [ Visitor HTTP Request ]
                                    │
                                    ▼
                          /r/[slug] Edge Handler
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     │                              │                              │
     ▼                              ▼                              ▼
GeoIP Resolver             UserAgent & Bot Detector        Prisma Query Cache
(Proxy Headers)            (Device/OS/Browser/Spiders)     (SmartLink + Overrides)
     │                              │                              │
     └──────────────────────────────┼──────────────────────────────┘
                                    │
                                    ▼
                       Deterministic Routing Engine
                     (Priority-Based Fallback Solver)
                                    │
     ┌──────────────────────────────┴──────────────────────────────┐
     │                                                             │
     ▼                                                             ▼
Tag Injector & Formatter                                Async Click Collector
(Account -> Group -> Link)                             (Salted Hash + Daily Rollup)
     │                                                             │
     ▼                                                             ▼
HTTP 302/307 Redirect                                   Prisma DailyRollup DB
```

---

## 1. Destination Resolution Priority

For any incoming redirect request, the destination is resolved following strict deterministic rules:

1. **Manual Destination Override**: Explicit URL configured by owner for the visitor's specific country or marketplace.
2. **PA-API Catalog Match**: Verified regional item match from authorized Amazon Product Advertising API adapter.
3. **ASIN Domain Transfer**: Same ASIN mapped to the regional Amazon top-level domain (e.g. `B09XS7JWHH` on `amazon.ca`).
4. **Keyword Search Fallback**: Amazon regional search query URL using sanitized product title keywords (`/s?k=...`).
5. **Original / Default Destination**: The creator's original submitted product link with default marketplace tag.

---

## 2. Affiliate Tag Hierarchy

Affiliate tracking IDs are resolved in cascading priority:
1. **Link-Level Override**: Tag specifically assigned to this SmartLink for a given marketplace.
2. **Group-Level Override**: Tag configured on the link's group (e.g. `meridiantech-uk-21` for the "Tech Gear" group).
3. **Account-Level Default**: Default tag configured in the 21-marketplace matrix (e.g. `meridian-20` for US).

---

## 3. Database & Rollup Aggregation

To avoid linear slowdowns from scanning millions of raw click events during report generation, MeridianLink implements an upsert-on-write daily rollup engine:
- Every click updates a unique compound record: `date_smartLinkId_country_device_os_browser_marketplace`.
- Dashboard queries and charts read directly from `DailyAnalyticsRollup`, guaranteeing sub-10ms query times regardless of historical database volume.
- Raw events in `ClickEvent` are pruned after `DATA_RETENTION_DAYS` (default 90 days).
