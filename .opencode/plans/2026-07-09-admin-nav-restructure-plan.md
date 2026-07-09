# Admin Nav Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure admin nav from 7 flat sections (26 items) to 6 visually-grouped sections with collapsible sidebar headers.

**Architecture:** Two-file change: (1) `navigation.ts` reorganizes section config, (2) `DashboardSidebar.tsx` renders section labels with collapse/expand instead of a flat list.

**Tech Stack:** TypeScript, React, Next.js, Tailwind CSS

---

### Task 1: Restructure `navigation.ts`

**Files:**
- Modify: `apps/web/lib/navigation.ts`

- [ ] **Step 1: Restructure `adminNavSections`**

Replace the 7 current sections with 6 new sections:

Section الرئیسیة -> لوحة التحكم
Section إدارة المستخدمين -> المستخدمون, العملاء, الأدوار, الأقسام, بوابة العملاء
Section العمليات -> المشاريع, المهام, العقود, العروض الفنية, طلبات الخدمة, النزاعات
Section التسويق (NEW) -> الحملات, الاستراتيجيات التسويقية
Section المالية -> نظرة عامة, الفواتير, المدفوعات, الرواتب, الحسابات البنكية
Section الإعدادات والمراقبة -> إعدادات المنصة, الخدمات, العملات, قوالب الإشعارات, الأمان, الجلسات النشطة, سجل النشاطات, صحة النظام, المحادثات

Key changes from current:
- Remove الحملات and الاستراتيجيات التسويقية from العمليات (move to التسويق)
- Add بوابة العملات (`/dashboard/admin/portal`) with Globe icon to إدارة المستخدمين
- Add المحادثات (`/dashboard/admin/chat`) with MessageSquare icon to الإعدادات والمراقبة
- Add الأمان, الجلسات النشطة, سجل النشاطات, صحة النظام from old المراقبة section to الإعدادات والمراقبة
- Remove old المراقبة section entirely
- Keep المالية as-is with نظرة عامة as first item

Icon assignments:
- Portal: Globe (already imported)
- Chat: MessageSquare (already imported)
- Security: Shield (reuse, already imported)
- Sessions: Monitor (already imported)
- Audit Log: ScrollText (already imported)
- Health: Activity (already imported)

- [ ] **Step 2: Verify build**

Run: `npx turbo build --filter=web 2>&1 | tail -20`
Expected: Build succeeds, no TypeScript errors

---

### Task 2: Add section headers and collapsible groups to DashboardSidebar

**Files:**
- Modify: `apps/web/components/design-system/DashboardSidebar.tsx`

- [ ] **Step 1: Change rendering from flat list to grouped sections**

Current approach: `sections.flatMap(s => s.items)` produces one flat array → renders `<Link>` per item.

New approach: Process sections preserving group membership. Filter by role within each section, deduplicate URLs, then render:

```tsx
// After filtering by role, keep section grouping:
const processedSections = useMemo(() => {
  if (!user) return [];
  const role = user.role;
  const isAdmin = role === UserRole.ADMIN;
  const sections = isAdmin ? adminNavSections : roleNavSections;
  const seen = new Set<string>();

  return sections
    .map(section => ({
      label: section.label,
      items: section.items
        .filter(item => item.roles.includes(role))
        .flatMap(item => {
          if (item.items?.length) {
            return item.items.map(sub => ({ title: sub.title, url: sub.url, icon: item.icon }));
          }
          if (item.url) return [{ title: item.title, url: item.url, icon: item.icon }];
          return [];
        })
        .filter(item => {
          if (seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        }),
    }))
    .filter(section => section.items.length > 0);
}, [user]);
```

- [ ] **Step 2: Add collapsible state**

```tsx
const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

const toggleSection = (label: string) => {
  setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    return next;
  });
};
```

- [ ] **Step 3: Render section headers with collapse toggle in the nav**

Replace the current flat `<nav>` body that maps `visibleItems`:

```tsx
<nav className="flex-1 px-4 pt-2 space-y-1 overflow-y-auto">
  {processedSections.map((section) => {
    const isCollapsed = collapsedSections.has(section.label);
    return (
      <div key={section.label} className="mb-2">
        {/* Section header */}
        <button
          onClick={() => toggleSection(section.label)}
          className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-portal-note-text uppercase tracking-wider hover:text-natural-100 transition-colors rounded-lg"
        >
          <span>{section.label}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200 text-portal-note-text",
              isCollapsed && "-rotate-90",
            )}
          />
        </button>

        {/* Items */}
        {!isCollapsed && (
          <div className="space-y-0.5 mt-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.url, pathname);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm",
                    isActive
                      ? "bg-badge-gray-bg text-natural-100 font-bold"
                      : "text-portal-icon hover:text-natural-100",
                  )}
                >
                  <Icon className="shrink-0" style={{ width: 18, height: 18 }} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</nav>
```

Import `ChevronDown` from `lucide-react`.

Remove the old `visibleItems` useMemo (no longer needed) and its `linkBase`, `linkActive`, `linkInactive` constants (replaced by inline classes).

- [ ] **Step 4: Verify build**

Run: `npx turbo build --filter=web 2>&1 | tail -30`
Expected: Build succeeds

---

### Task 3: Final verification

- [ ] **Step 1: Full turbo build**

Run: `turbo build 2>&1 | tail -30`
Expected: All packages build successfully

- [ ] **Step 2: Verify no dead imports**

Check that no unused imports remain in `DashboardSidebar.tsx` after removing flat-list logic.
