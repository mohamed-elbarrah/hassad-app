import { describe, expect, it, vi } from "vitest";
import { CompareBusinessPeriodsTool } from "./semantic.tools";
import { SemanticIntelligenceService } from "../../semantic-intelligence/semantic-intelligence.service";

const period = (from: string, to: string) => ({
  from: new Date(from),
  to: new Date(to),
  fromIso: from,
  toIso: to,
});

describe("CompareBusinessPeriodsTool", () => {
  it("requires current and previous periods to have equal duration", async () => {
    const semantic = {
      parsePeriod: vi.fn()
        .mockReturnValueOnce(period("2026-01-01T00:00:00.000Z", "2026-01-04T00:00:00.000Z"))
        .mockReturnValueOnce(period("2025-01-01T00:00:00.000Z", "2025-01-03T00:00:00.000Z")),
      getBusinessOverview: vi.fn(),
    } as unknown as SemanticIntelligenceService;

    await expect(new CompareBusinessPeriodsTool(semantic).execute({
      current: { from: "2026-01-01", to: "2026-01-04" },
      previous: { from: "2025-01-01", to: "2025-01-03" },
    })).rejects.toMatchObject({ response: { code: "SEMANTIC_COMPARISON_PERIODS_MISMATCH" } });
    expect(semantic.getBusinessOverview).not.toHaveBeenCalled();
  });
});
