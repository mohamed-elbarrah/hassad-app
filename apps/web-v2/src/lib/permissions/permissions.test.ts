import { describe, expect, it } from "vitest";

import { can } from "@/lib/permissions/permissions";

describe("can", () => {
  it("allows users with the required permission", () => {
    expect(can(["admin.users.read"], "admin.users.read")).toBe(true);
  });

  it("blocks users without the required permission", () => {
    expect(can(["admin.dashboard"], "admin.users.read")).toBe(false);
  });
});
