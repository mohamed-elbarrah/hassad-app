import { describe, expect, it } from "vitest";

import {
  currentUser,
  employees,
  workspaceNavigation,
} from "@/lib/fixtures/first-slice";
import { can } from "@/lib/permissions/permissions";

describe("first slice fixtures", () => {
  it("keeps employee routes unique", () => {
    const ids = employees.map((employee) => employee.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks inaccessible navigation entries through permissions", () => {
    const navItems = workspaceNavigation.flatMap((group) => group.items);
    const blockedItems = navItems.filter(
      (item) => !can(currentUser.permissions, item.permission)
    );

    expect(blockedItems.map((item) => item.href)).toEqual([
      "/admin/clients",
      "/admin/projects",
      "/admin/finance/invoices",
    ]);
  });
});
