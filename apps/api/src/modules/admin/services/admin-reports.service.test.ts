import { describe, expect, it, vi } from "vitest";
import { AdminReportsService } from "./admin-reports.service";

describe("AdminReportsService report snapshots", () => {
  it("uses inclusive Sunday-to-Saturday bounds for weekly snapshots", async () => {
    const create = vi.fn(async (args: { data: Record<string, unknown> }) => ({
      id: "snapshot-1",
      ...args.data,
    }));
    const prisma = {
      reportSnapshot: {
        findFirst: vi.fn(async () => null),
        create,
      },
    };
    const kpiService = { getSalesKpis: vi.fn(async () => ({ leads: 2 })) };
    const service = new AdminReportsService(
      prisma as never,
      kpiService as never,
      {} as never,
    );
    vi.spyOn(service, "getSalesReport").mockResolvedValue({
      totalLeads: 2,
    } as never);

    await service.saveSnapshot("sales", "WEEKLY", new Date(2026, 8, 16, 12));

    const data = create.mock.calls[0][0].data;
    expect(prisma.reportSnapshot.findFirst).toHaveBeenCalledWith({
      where: {
        reportType: "sales",
        period: "WEEKLY",
        periodStart: new Date(2026, 8, 13),
      },
    });
    const expectedFrom = new Date(2026, 8, 13).toISOString();
    const expectedTo = new Date(2026, 8, 19, 23, 59, 59, 999).toISOString();
    expect(kpiService.getSalesKpis).toHaveBeenCalledWith(
      expectedFrom,
      expectedTo,
    );
    expect(data.periodStart).toEqual(new Date(2026, 8, 13));
    expect(data.periodEnd).toEqual(new Date(2026, 8, 19, 23, 59, 59, 999));
    expect(service.getSalesReport).toHaveBeenCalledWith(
      expectedFrom,
      expectedTo,
    );
  });

  it("returns an existing snapshot without recomputing or creating it", async () => {
    const existing = { id: "existing", reportType: "sales", period: "DAILY" };
    const prisma = {
      reportSnapshot: {
        findFirst: vi.fn(async () => existing),
        create: vi.fn(),
      },
    };
    const service = new AdminReportsService(
      prisma as never,
      { getSalesKpis: vi.fn() } as never,
      {} as never,
    );
    const report = vi.spyOn(service, "getSalesReport");

    await expect(
      service.saveSnapshot("sales", "DAILY", new Date(2026, 8, 16, 12)),
    ).resolves.toBe(existing);
    expect(report).not.toHaveBeenCalled();
    expect(prisma.reportSnapshot.create).not.toHaveBeenCalled();
  });
});
