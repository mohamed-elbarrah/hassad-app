# Portal Button Unification Plan

## Goal

Fix hover colors and add cursor-pointer to all portal buttons, while keeping control in **one place** (`PortalActionButton.tsx`). Only use `className` overrides for truly custom styling.

---

## Root Cause

1. `PortalActionButton` never sets `cursor-pointer` — Firefox won't show a pointer hand
2. Several cards override the `outline` variant hover, dropping the intended `hover:text-secondary-500`
3. Native `<button>` elements in pagination, filters, and dropdown modals lack both hover states and cursors

---

## Changes

### 1. `PortalActionButton.tsx` — Centralize cursor

**What:** Add `cursor-pointer` to the base className string.

**Current (line 87-90):**

```tsx
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        "gap-1 rounded-xl font-medium shrink-0",
        className,
      )}
```

**New:**

```tsx
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        "gap-1 rounded-xl font-medium shrink-0 cursor-pointer",
        className,
      )}
```

**Effect:** Every `PortalActionButton` instance gets pointer cursor automatically.

---

### 2. `DashboardCard.tsx` — Remove conflicting hover override

**What:** Remove `hover:bg-neutral-100` override so the `outline` variant controls hover.

**Current (line 33):**

```tsx
className =
  "text-[18px] font-medium  text-portal-icon border-[1.5px] border-portal-card-border rounded-[10px] px-5 py-5 hover:bg-neutral-100";
```

**New:**

```tsx
className =
  "text-[18px] font-medium text-portal-icon border-[1.5px] border-portal-card-border rounded-[10px] px-5 py-5";
```

**Why:** The `outline` variant already has `hover:bg-badge-gray-bg hover:text-secondary-500`. The override was dropping the text-color shift.

---

### 3. `ActionItemCard.tsx` — Remove conflicting hover override

**What:** Remove `hover:bg-neutral-100` from the secondary button.

**Current (line 48):**

```tsx
className =
  "flex-1 text-[16px] font-semibold text-action-gray-text border-[1.5px] border-portal-card-border rounded-[16px] hover:bg-neutral-100";
```

**New:**

```tsx
className =
  "flex-1 text-[16px] font-semibold text-action-gray-text border-[1.5px] border-portal-card-border rounded-[16px]";
```

**Why:** Same as DashboardCard — let the `outline` variant handle hover.

---

### 4. `PortalNotificationsDropdown.tsx` — Fix modal action buttons

**What:** Add hover states and cursor to the two inline `<button>` elements in the notification detail modal.

**Primary action button (line 531-542):**
**Current:**

```tsx
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white"
                  style={{
                    backgroundColor: "#121936",
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: "24px",
                  }}
                  onClick={handleNavigate}
                >
```

**New:**

```tsx
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white cursor-pointer transition-colors hover:bg-[#1a234a]"
                  style={{
                    backgroundColor: "#121936",
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: "24px",
                  }}
                  onClick={handleNavigate}
                >
```

**Close button (line 545-555):**
**Current:**

```tsx
              <button
                className="px-5 py-2.5 rounded-2xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1.5px solid #E1E4EA",
                  color: "#525866",
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: "24px",
                }}
                onClick={() => setSelectedNotification(null)}
              >
```

**New:**

```tsx
              <button
                className="px-5 py-2.5 rounded-2xl cursor-pointer transition-colors hover:bg-badge-gray-bg"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1.5px solid #E1E4EA",
                  color: "#525866",
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: "24px",
                }}
                onClick={() => setSelectedNotification(null)}
              >
```

---

### 5. `PortalPagination.tsx` — Add cursor to native buttons

**What:** Add `cursor-pointer` and `disabled:cursor-not-allowed` to both pagination buttons.

**Previous button (line 20):**
**Current:**

```tsx
className =
  "inline-flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg disabled:opacity-50";
```

**New:**

```tsx
className =
  "inline-flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
```

**Next button (line 33):**
**Current:**

```tsx
className =
  "inline-flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg disabled:opacity-50";
```

**New:**

```tsx
className =
  "inline-flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
```

---

### 6. `PortalFilterPills.tsx` — Add cursor to filter pills

**What:** Add `cursor-pointer` to the base className of each pill button.

**Current (line 33-37):**

```tsx
            className={cn(
              "h-12 rounded-2xl border-[1.5px] px-5 text-base font-medium shadow-none transition-colors",
              isActive
                ? "border-secondary-500 bg-secondary-500 text-white hover:bg-secondary-600 hover:text-white"
                : "border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
            )}
```

**New:**

```tsx
            className={cn(
              "h-12 rounded-2xl border-[1.5px] px-5 text-base font-medium shadow-none transition-colors cursor-pointer",
              isActive
                ? "border-secondary-500 bg-secondary-500 text-white hover:bg-secondary-600 hover:text-white"
                : "border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
            )}
```

---

## Files to Change (7 total)

| File                                                         | Change                                               |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `apps/web/components/portal/PortalActionButton.tsx`          | Add `cursor-pointer` to base className               |
| `apps/web/components/portal/ActionItemCard.tsx`              | Remove `hover:bg-neutral-100` override               |
| `apps/web/components/portal/DashboardCard.tsx`               | Remove `hover:bg-neutral-100` override               |
| `apps/web/components/portal/PortalNotificationsDropdown.tsx` | Add hover + cursor to modal buttons                  |
| `apps/web/components/portal/PortalPagination.tsx`            | Add `cursor-pointer` + `disabled:cursor-not-allowed` |
| `apps/web/components/portal/PortalFilterPills.tsx`           | Add `cursor-pointer`                                 |

---

## Verification

After applying changes, run:

```bash
npx turbo run build --filter=web
```

There should be no build errors. Visual verification: hover over any portal button — it should show a pointer cursor and smooth color transition.
