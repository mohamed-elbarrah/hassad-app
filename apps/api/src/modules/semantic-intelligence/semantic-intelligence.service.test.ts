import { describe, expect, it } from "vitest";
import { SemanticIntelligenceService } from "./semantic-intelligence.service";

function service() {
  return new SemanticIntelligenceService({} as never);
}

describe("SemanticIntelligenceService", () => {
  it("normalizes date-only periods to UTC half-open timestamps", () => {
    const period = service().parsePeriod({ from: "2026-01-01", to: "2026-01-02" });
    expect(period.fromIso).toBe("2026-01-01T00:00:00.000Z");
    expect(period.toIso).toBe("2026-01-02T00:00:00.000Z");
  });

  it("rejects missing timezone, offsets, invalid calendar dates, reversed, and overlong periods", () => {
    expect(() => service().parsePeriod({ from: "2026-01-01T00:00:00", to: "2026-01-02T00:00:00Z" })).toThrow();
    expect(() => service().parsePeriod({ from: "2026-01-01T00:00:00+03:00", to: "2026-01-02T00:00:00Z" })).toThrow();
    expect(() => service().parsePeriod({ from: "2026-02-31", to: "2026-03-02" })).toThrow();
    expect(() => service().parsePeriod({ from: "2026-01-03", to: "2026-01-02" })).toThrow();
    expect(() => service().parsePeriod({ from: "2025-01-01", to: "2026-01-03" })).toThrow();
  });

  it("does not invent a percent change for a zero denominator", () => {
    expect(SemanticIntelligenceService.compare(12, 0)).toEqual({
      current: 12,
      previous: 0,
      delta: 12,
      percentChange: null,
    });
  });
});
