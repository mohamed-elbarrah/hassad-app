/**
 * tab-visibility.ts — Role-based tab visibility for the client detail page
 *
 * Defines which tabs each role can see. Follows the same config-driven
 * pattern as `profile-visibility.ts` in the client-brief module.
 *
 * Adding a new role? Add one row.
 * Changing tab visibility for a role? Edit one array.
 */

import { UserRole } from "@hassad/shared";

export type ClientDetailTab = "overview" | "projects" | "finance" | "activity";

export interface TabConfig {
  /** Unique value for the tab */
  value: ClientDetailTab;
  /** Display label in the tab bar */
  label: string;
  /** Permission key required by the tab's API calls (for error handling) */
  requiredPermission?: string;
}

/** All available tabs with their metadata */
export const ALL_TABS: TabConfig[] = [
  { value: "overview", label: "نظرة عامة" },
  { value: "projects", label: "المشاريع", requiredPermission: "projects.read" },
  { value: "finance", label: "المالية", requiredPermission: "finance.read" },
  { value: "activity", label: "النشاط" },
];

/**
 * Which tabs each role can see.
 * Roles not listed here default to ADMIN's visibility.
 */
export const TAB_VISIBILITY: Partial<Record<UserRole, ClientDetailTab[]>> = {
  [UserRole.SALES]: ["overview", "activity"],
  [UserRole.PM]: ["overview", "projects", "activity"],
  [UserRole.MARKETING]: ["overview", "activity"],
  [UserRole.ACCOUNTANT]: ["overview", "finance", "activity"],
  [UserRole.EMPLOYEE]: ["overview", "projects", "activity"],
  [UserRole.ADMIN]: ["overview", "projects", "finance", "activity"],
  [UserRole.CLIENT]: ["overview", "projects", "finance", "activity"],
};

/** Get visible tabs for a given role */
export function getVisibleTabs(role: UserRole): TabConfig[] {
  const visibleValues = TAB_VISIBILITY[role] ?? TAB_VISIBILITY[UserRole.ADMIN]!;
  return ALL_TABS.filter((tab) => visibleValues.includes(tab.value));
}
