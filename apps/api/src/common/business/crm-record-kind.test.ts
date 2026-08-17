import { describe, expect, it } from "vitest";
import { classifyCrmRecordKind } from "./crm-record-kind";

describe("classifyCrmRecordKind", () => {
  it("classifies a client with no projects as a lead", () => {
    expect(classifyCrmRecordKind([])).toBe("lead");
  });

  it("classifies a client with an active project as an order", () => {
    expect(classifyCrmRecordKind([{ status: "ACTIVE" }])).toBe("order");
  });

  it("classifies a client with a completed project as an order", () => {
    expect(classifyCrmRecordKind([{ status: "COMPLETED" }])).toBe("order");
  });

  it("does not classify other project statuses as an order", () => {
    expect(
      classifyCrmRecordKind([
        { status: "AWAITING_REVIEW" },
        { status: "NEEDS_REVISION" },
        { status: "CANCELLED" },
      ]),
    ).toBe("lead");
  });
});
