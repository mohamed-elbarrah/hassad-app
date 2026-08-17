import { describe, expect, it } from "vitest";

import {
  CRM_OVERVIEW_FIXTURE,
  buildOverviewLanes,
  filterOverviewRecords,
  matchesOverviewSearch,
} from "./crm-overview-data";

describe("crm-overview-data", () => {
  it("groups records into the four shared pipeline lanes and status sections", () => {
    const lanes = buildOverviewLanes(CRM_OVERVIEW_FIXTURE);

    expect(lanes).toHaveLength(4);
    expect(lanes[0].sections).toHaveLength(1);
    expect(lanes[1].sections).toHaveLength(3);
    expect(lanes[2].sections).toHaveLength(4);
    expect(lanes[3].sections).toHaveLength(4);
    expect(lanes[0].sections[0].items.some((item) => item.id === "rec-1")).toBe(true);
    expect(lanes[2].sections[1].items.some((item) => item.id === "rec-6")).toBe(true);
    expect(lanes[3].sections[3].items.some((item) => item.id === "rec-12")).toBe(true);
  });

  it("filters by lead and order record type", () => {
    expect(filterOverviewRecords(CRM_OVERVIEW_FIXTURE, "leads").every((record) => record.kind === "lead")).toBe(true);
    expect(filterOverviewRecords(CRM_OVERVIEW_FIXTURE, "orders").every((record) => record.kind === "order")).toBe(true);
    expect(filterOverviewRecords(CRM_OVERVIEW_FIXTURE, "all")).toHaveLength(CRM_OVERVIEW_FIXTURE.length);
  });

  it("matches search terms across the shared record fields", () => {
    expect(matchesOverviewSearch(CRM_OVERVIEW_FIXTURE[0], "northstar")).toBe(true);
    expect(matchesOverviewSearch(CRM_OVERVIEW_FIXTURE[5], "decision")).toBe(true);
    expect(matchesOverviewSearch(CRM_OVERVIEW_FIXTURE[0], "not a term")).toBe(false);
  });
});
