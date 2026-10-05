import { describe, expect, it, vi } from "vitest";
import { IssueStatus } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";
import { CommunicationService } from "./communication.service";

function createService() {
  return new CommunicationService(
    {} as never,
    {} as never,
    {} as never,
  );
}

describe("CommunicationService issue lifecycle", () => {
  it("rejects invalid status transitions", async () => {
    const service = createService();
    vi.spyOn(service, "getIssue").mockResolvedValue({ status: IssueStatus.CLOSED } as never);

    await expect(
      service.updateIssueStatus("issue-1", "admin-1", { status: IssueStatus.OPEN }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects messages on closed issues", async () => {
    const service = createService();
    vi.spyOn(service, "getIssue").mockResolvedValue({
      status: IssueStatus.CLOSED,
      reporterId: "user-1",
      assignedToId: null,
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
