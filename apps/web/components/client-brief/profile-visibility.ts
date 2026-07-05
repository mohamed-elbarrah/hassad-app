/**
 * profile-visibility.ts — Central visibility config for role-based profile views
 *
 * Single source of truth for what each role sees in the client brief.
 * Every component reads from here — no scattered if/else chains.
 *
 * Adding a new role? Add one row to each config.
 * Changing visibility for a role? Edit one array.
 */

import { UserRole } from "@hassad/shared";

// ── Sidebar fields ──────────────────────────────────────────────

export type SidebarField =
  | "email"
  | "phone"
  | "businessType"
  | "decisionMaker"
  | "workingHours"
  | "accountManager"
  | "createdAt";

export interface SidebarVisibility {
  /** Which detail fields to show below the header */
  fields: SidebarField[];
  /** Show "المسؤول: {name}" subtitle under the company name */
  showContactSubtitle: boolean;
}

export const SIDEBAR_VISIBILITY: Record<UserRole, SidebarVisibility> = {
  [UserRole.CLIENT]: {
    fields: ["businessType", "accountManager", "createdAt"],
    showContactSubtitle: false,
  },
  [UserRole.SALES]: {
    fields: [
      "email",
      "phone",
      "businessType",
      "decisionMaker",
      "workingHours",
      "accountManager",
      "createdAt",
    ],
    showContactSubtitle: true,
  },
  [UserRole.PM]: {
    fields: [
      "email",
      "phone",
      "businessType",
      "decisionMaker",
      "accountManager",
      "createdAt",
    ],
    showContactSubtitle: true,
  },
  [UserRole.MARKETING]: {
    fields: ["businessType", "accountManager", "createdAt"],
    showContactSubtitle: false,
  },
  [UserRole.ACCOUNTANT]: {
    fields: ["email", "phone", "businessType", "accountManager", "createdAt"],
    showContactSubtitle: false,
  },
  [UserRole.EMPLOYEE]: {
    fields: ["businessType", "accountManager", "createdAt"],
    showContactSubtitle: false,
  },
  [UserRole.ADMIN]: {
    fields: [
      "email",
      "phone",
      "businessType",
      "decisionMaker",
      "workingHours",
      "accountManager",
      "createdAt",
    ],
    showContactSubtitle: true,
  },
};

// ── Profile sections (main grid) ───────────────────────────────

export type ProfileSectionKey =
  | "personalInfo"
  | "product"
  | "audience"
  | "journey"
  | "campaign"
  | "performance"
  | "visual";

export const PROFILE_SECTION_VISIBILITY: Record<UserRole, ProfileSectionKey[]> =
  {
    [UserRole.CLIENT]: ["personalInfo", "product", "visual"],
    [UserRole.SALES]: [
      "product",
      "audience",
      "journey",
      "campaign",
      "performance",
      "visual",
    ],
    [UserRole.PM]: ["personalInfo", "product", "visual"],
    [UserRole.MARKETING]: [
      "product",
      "audience",
      "journey",
      "campaign",
      "performance",
      "visual",
    ],
    [UserRole.ACCOUNTANT]: [],
    [UserRole.EMPLOYEE]: ["product", "visual"],
    [UserRole.ADMIN]: [
      "personalInfo",
      "product",
      "audience",
      "journey",
      "campaign",
      "performance",
      "visual",
    ],
  };

// ── KPI visibility ─────────────────────────────────────────────

export type KpiKey =
  | "totalProjects"
  | "activeProjects"
  | "completedProjects"
  | "cancelledProjects"
  | "contractValue"
  | "totalPaid";

export const KPI_VISIBILITY: Record<UserRole, KpiKey[]> = {
  [UserRole.CLIENT]: [],
  [UserRole.SALES]: [
    "totalProjects",
    "activeProjects",
    "completedProjects",
    "cancelledProjects",
    "contractValue",
    "totalPaid",
  ],
  [UserRole.PM]: [
    "totalProjects",
    "activeProjects",
    "completedProjects",
    "cancelledProjects",
  ],
  [UserRole.MARKETING]: [],
  [UserRole.ACCOUNTANT]: ["contractValue", "totalPaid"],
  [UserRole.EMPLOYEE]: [],
  [UserRole.ADMIN]: [
    "totalProjects",
    "activeProjects",
    "completedProjects",
    "cancelledProjects",
    "contractValue",
    "totalPaid",
  ],
};
