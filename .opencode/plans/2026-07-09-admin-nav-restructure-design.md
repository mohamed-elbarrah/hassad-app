# Admin Navigation Restructure

## Problem

The admin dashboard sidebar shows 26+ nav items in a single flat list with no visual grouping. This creates confusion:

1. **العمليات (Operations) is a dumping ground** — 8 unrelated items including campaigns (marketing) and marketing strategies (marketing) alongside projects, tasks, contracts, etc.
2. **Marketing has no dedicated section** — campaigns and strategies are buried.
3. **Chat has no nav item** — page exists but is hidden from navigation.
4. **Portal has no nav item** — page exists but is hidden.
5. **Section labels exist in config but are never rendered** — the sidebar flat-maps all items, so no visual grouping.

## Scope

Two files only:
- `apps/web/lib/navigation.ts` — restructure sections
- `apps/web/components/design-system/DashboardSidebar.tsx` — add section headers + collapse/expand

No page files are moved. All URLs remain the same. Leads detail pages (`/dashboard/admin/leads/[id]`) are untouched.

## Navigation Structure

### Section 1: الرئيسية
| Item | URL |
|------|-----|
| لوحة التحكم | `/dashboard/admin` |

### Section 2: إدارة المستخدمين
| Item | URL | Notes |
|------|-----|-------|
| المستخدمون | `/dashboard/admin/users` | Staff only (post-fix) |
| العملاء | `/dashboard/admin/clients` | Unified (clients + leads tabs) |
| الأدوار | `/dashboard/admin/roles` | |
| الأقسام | `/dashboard/admin/departments` | |
| بوابة العملاء | `/dashboard/admin/portal` | NEW — was hidden |

### Section 3: العمليات
| Item | URL | Notes |
|------|-----|-------|
| المشاريع | `/dashboard/admin/projects` | |
| المهام | `/dashboard/admin/tasks` | |
| العقود | `/dashboard/admin/contracts` | |
| العروض الفنية | `/dashboard/admin/proposals` | |
| طلبات الخدمة | `/dashboard/admin/requests` | |
| النزاعات | `/dashboard/admin/disputes` | |

**Removed:** الحملات, الاستراتيجيات التسويقية → moved to التسويق

### Section 4: التسويق (NEW)
| Item | URL | Notes |
|------|-----|-------|
| الحملات | `/dashboard/admin/campaigns` | Moved from العمليات |
| الاستراتيجيات التسويقية | `/dashboard/admin/marketing/strategies` | Moved from العمليات |

### Section 5: المالية
| Item | URL | Notes |
|------|-----|-------|
| نظرة عامة | `/dashboard/admin/finance` | |
| الفواتير | `/dashboard/admin/finance/invoices` | |
| المدفوعات | `/dashboard/admin/finance/payments` | |
| الرواتب | `/dashboard/admin/finance/payroll` | |
| الحسابات البنكية | `/dashboard/admin/finance/bank-accounts` | |

### Section 6: الإعدادات والمراقبة
| Item | URL | Notes |
|------|-----|-------|
| إعدادات المنصة | `/dashboard/admin/settings` | |
| الخدمات | `/dashboard/admin/services` | |
| العملات | `/dashboard/admin/currency` | |
| قوالب الإشعارات | `/dashboard/admin/notification-templates` | |
| الأمان | `/dashboard/admin/security` | Moved from المراقبة |
| الجلسات النشطة | `/dashboard/admin/sessions` | Moved from المراقبة |
| سجل النشاطات | `/dashboard/admin/audit-log` | Moved from المراقبة |
| صحة النظام | `/dashboard/admin/health` | Moved from المراقبة |
| المحادثات | `/dashboard/admin/chat` | NEW — was hidden |

## Sidebar Changes

### Current behavior
```tsx
sections.flatMap(s => s.items).filter(...) // flat list, one link per item
```

### New behavior
- Render section labels as visual headers with distinct styling (small uppercase text, muted color, padding)
- Each section is collapsible: clicking the header toggles visibility of its items
- Default: all sections expanded on first load
- Collapse state stored in local state (per session, lost on page reload)
- Active item highlighting works as before

### Visual design
```
الرئيسية ▼
  لوحة التحكم

إدارة المستخدمين ▼
  المستخدمون
  العملاء
  ...

العمليات ▼
  المشاريع
  ...
```

## Data Flow

No API changes. No database changes. No new API endpoints.

## Migration

1. Edit `navigation.ts` to restructure 7 sections → 6, rearrange items, add new items
2. Edit `DashboardSidebar.tsx` to render section labels with collapse/expand
3. Verify `turbo build` passes
4. No URL breaks — all page files stay in place
