import { describe, expect, it } from "vitest";
import { ClientKind } from "@hassad/shared";
import { classifyCrmRecordKind } from "./crm-record-kind";

describe("classifyCrmRecordKind", () => {
  it("classifies a lead client as a lead", () => {
    expect(classifyCrmRecordKind({ kind: ClientKind.LEAD })).toBe("lead");
  });

  it("classifies a client as an order", () => {
    expect(classifyCrmRecordKind({ kind: ClientKind.CLIENT })).toBe("order");
  });

  it("defaults missing client kind to lead", () => {
    expect(classifyCrmRecordKind(null)).toBe("lead");
  });
});
