import { describe, expect, it, vi } from "vitest";
import { AnnouncementStatus, IssueStatus } from "@prisma/client";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { CommunicationService } from "./communication.service";

function createService() {
  return new CommunicationService(
    {} as never,
    {} as never,
    {} as never,
  );
}

describe("CommunicationService announcement lifecycle", () => {
  it("returns only published announcements to users", async () => {
    const prisma = { announcement: { findMany: vi.fn().mockResolvedValue([]) } };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await service.getActiveAnnouncements("user-1", "ADMIN");

    expect(prisma.announcement.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: AnnouncementStatus.PUBLISHED }),
    }));
  });

  it("archives the current announcement atomically when publishing another", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "new", status: AnnouncementStatus.DRAFT, startsAt: null, expiresAt: null, publishedAt: null }]),
      announcement: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ id: "new", status: AnnouncementStatus.PUBLISHED, audiences: [] }),
      },
    };
    const prisma = {
      announcement: {
        findUnique: vi.fn().mockResolvedValue({ id: "new", status: AnnouncementStatus.DRAFT, startsAt: null }),
      },
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
      user: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(service.updateAnnouncementStatus("new", { status: AnnouncementStatus.PUBLISHED }))
      .resolves.toMatchObject({ status: AnnouncementStatus.PUBLISHED });
    expect(transaction.announcement.updateMany).toHaveBeenCalledWith({
      where: { status: AnnouncementStatus.PUBLISHED, id: { not: "new" } },
      data: { status: AnnouncementStatus.ARCHIVED, archivedAt: expect.any(Date) },
    });
  });

  it("rejects publishing an expired announcement without consuming the active slot", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{
        id: "expired",
        status: AnnouncementStatus.DRAFT,
        startsAt: null,
        expiresAt: new Date(Date.now() - 60_000),
        publishedAt: null,
      }]),
      announcement: { updateMany: vi.fn(), update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(service.updateAnnouncementStatus("expired", { status: AnnouncementStatus.PUBLISHED }))
      .rejects.toMatchObject({ response: { code: "ANNOUNCEMENT_EXPIRED" } });
    expect(transaction.announcement.updateMany).not.toHaveBeenCalled();
    expect(transaction.announcement.update).not.toHaveBeenCalled();
  });

  it("rejects scheduling an expired announcement even when its start date is in the future", async () => {
    const expiredAt = new Date(Date.now() - 60_000);
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{
        id: "expired-scheduled",
        status: AnnouncementStatus.DRAFT,
        startsAt: new Date(Date.now() + 60_000),
        expiresAt: expiredAt,
        publishedAt: null,
      }]),
      announcement: { update: vi.fn(), updateMany: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(service.updateAnnouncementStatus("expired-scheduled", { status: AnnouncementStatus.SCHEDULED }))
      .rejects.toMatchObject({ response: { code: "ANNOUNCEMENT_EXPIRED" } });
    expect(transaction.announcement.update).not.toHaveBeenCalled();
  });

  it("does not revive a published announcement that already expired while editing it", async () => {
    const expiredAt = new Date(Date.now() - 60_000);
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{
        id: "expired-published",
        status: AnnouncementStatus.PUBLISHED,
        expiresAt: expiredAt,
        publishedAt: new Date(Date.now() - 86_400_000),
      }]),
      announcementAudience: { deleteMany: vi.fn() },
      announcement: {
        update: vi.fn().mockImplementation(({ data }: { data: { status: AnnouncementStatus } }) => ({ id: "expired-published", ...data, audiences: [] })),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    const updated = await service.updateAnnouncement("expired-published", {
      title: "Updated title",
      body: "Updated body",
      type: "INFO" as never,
      audiences: ["ALL_STAFF"] as never,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(updated.status).toBe(AnnouncementStatus.ARCHIVED);
  });

  it("rejects an edit when the locked announcement was archived concurrently", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{
        id: "archived",
        status: AnnouncementStatus.ARCHIVED,
        expiresAt: null,
        publishedAt: new Date(),
      }]),
      announcementAudience: { deleteMany: vi.fn() },
      announcement: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(service.updateAnnouncement("archived", {
      title: "Updated title",
      body: "Updated body",
      type: "INFO" as never,
      audiences: ["ALL_STAFF"] as never,
    })).rejects.toMatchObject({ response: { code: "ANNOUNCEMENT_ARCHIVED" } });
    expect(transaction.announcement.update).not.toHaveBeenCalled();
  });

  it("archives expired active and scheduled announcements during scheduled activation", async () => {
    const prisma = {
      announcement: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await service.activateScheduledAnnouncements();

    expect(prisma.announcement.updateMany).toHaveBeenCalledWith({
      where: {
        status: { in: [AnnouncementStatus.SCHEDULED, AnnouncementStatus.PUBLISHED] },
        expiresAt: { lte: expect.any(Date) },
      },
      data: { status: AnnouncementStatus.ARCHIVED, archivedAt: expect.any(Date) },
    });
  });

  it("rechecks scheduled expiry after locking the row", async () => {
    const expiredAt = new Date(Date.now() - 1_000);
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "scheduled", startsAt: new Date(Date.now() - 60_000), expiresAt: expiredAt }]),
      announcement: { update: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      announcement: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findFirst: vi.fn().mockResolvedValue({ id: "scheduled", startsAt: new Date(Date.now() - 60_000), expiresAt: new Date(Date.now() + 60_000) }),
      },
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await service.activateScheduledAnnouncements();

    expect(transaction.announcement.update).toHaveBeenCalledWith({
      where: { id: "scheduled" },
      data: { status: AnnouncementStatus.ARCHIVED, archivedAt: expect.any(Date) },
    });
  });

  it("restores archived announcements as drafts instead of publishing them", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "restored", status: AnnouncementStatus.ARCHIVED, startsAt: null, expiresAt: null, publishedAt: null }]),
      announcement: {
        update: vi.fn().mockResolvedValue({ id: "restored", status: AnnouncementStatus.DRAFT }),
      },
    };
    const prisma = {
      announcement: {
        findUnique: vi.fn().mockResolvedValue({ id: "restored", status: AnnouncementStatus.ARCHIVED, startsAt: null }),
      },
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(service.updateAnnouncementStatus("restored", { status: AnnouncementStatus.DRAFT }))
      .resolves.toMatchObject({ status: AnnouncementStatus.DRAFT });
    expect(transaction.announcement.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: AnnouncementStatus.DRAFT, archivedAt: null, publishedAt: null }),
    }));
  });
});

describe("CommunicationService issue lifecycle", () => {
  it("rejects invalid status transitions using the locked current state", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "issue-1", status: IssueStatus.CLOSED }]),
      issueReport: { update: vi.fn() },
      issueHistory: { create: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(
      service.updateIssueStatus("issue-1", "admin-1", { status: IssueStatus.OPEN }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.issueReport.update).not.toHaveBeenCalled();
  });

  it("allows issue details only to the reporter", async () => {
    const prisma = {
      issueReport: {
        findUnique: vi.fn().mockResolvedValue({
          reporterId: "reporter-1",
          attachments: [],
          messages: [],
          history: [],
        }),
      },
    };
    const service = new CommunicationService(prisma as never, {} as never, {} as never);

    await expect(service.getIssue("issue-1", "other-user")).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.getIssue("issue-1", "reporter-1")).resolves.toMatchObject({ reporterId: "reporter-1" });
  });

  it("allows admins to message reports but blocks other users", async () => {
    const service = new CommunicationService(
      { issueMessage: { create: vi.fn().mockResolvedValue({}) } } as never,
      {} as never,
      {} as never,
    );
    vi.spyOn(service, "getIssue").mockResolvedValue({ reporterId: "reporter-1", status: IssueStatus.OPEN } as never);

    await expect(service.addIssueMessage("issue-1", "other-user", { content: "follow up" })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.addIssueMessage("issue-1", "admin-1", { content: "follow up" }, true)).resolves.toBeDefined();
  });

  it("rejects messages on closed issues", async () => {
    const service = createService();
    vi.spyOn(service, "getIssue").mockResolvedValue({
      status: IssueStatus.CLOSED,
      reporterId: "user-1",
    } as never);

    await expect(
      service.addIssueMessage("issue-1", "user-1", { content: "follow up" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts only internal announcement action paths", () => {
    const service = createService();
    const validateActionUrl = (service as unknown as { validateActionUrl: (value?: string) => string | undefined }).validateActionUrl.bind(service);
    expect(validateActionUrl("/portal/issues")).toBe("/portal/issues");
    expect(() => validateActionUrl("https://example.com")).toThrow(BadRequestException);
    expect(() => validateActionUrl("//example.com")).toThrow(BadRequestException);
  });
});
