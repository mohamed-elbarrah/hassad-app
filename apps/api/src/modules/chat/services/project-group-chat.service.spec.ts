import { describe, expect, it, vi } from "vitest";
import { ConversationParticipantSource } from "@prisma/client";
import { ProjectGroupChatService } from "./project-group-chat.service";

describe("ProjectGroupChatService task reassignment membership", () => {
  it("returns only an automatically removed former assignee for post-commit eviction", async () => {
    const conversationParticipant = {
      findFirst: vi
        .fn()
        .mockResolvedValueOnce({ id: "participant-1" })
        .mockResolvedValueOnce(null),
    };
    const prisma = {
      conversation: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: "conversation-1", isActive: true }),
      },
      conversationParticipant,
    };
    const service = new ProjectGroupChatService(prisma as never, {} as never);
    vi.spyOn(service, "syncParticipants").mockResolvedValue(null as never);

    await expect(
      service.syncParticipantsForTaskReassignment(
        "project-1",
        "former-assignee",
      ),
    ).resolves.toEqual(["former-assignee"]);
    expect(conversationParticipant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          source: ConversationParticipantSource.AUTO,
          userId: "former-assignee",
          isActive: true,
        }),
      }),
    );
  });

  it("does not evict a manual chat member", async () => {
    const conversationParticipant = {
      findFirst: vi.fn().mockResolvedValue(null),
    };
    const prisma = {
      conversation: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: "conversation-1", isActive: true }),
      },
      conversationParticipant,
    };
    const service = new ProjectGroupChatService(prisma as never, {} as never);
    vi.spyOn(service, "syncParticipants").mockResolvedValue(null as never);

    await expect(
      service.syncParticipantsForTaskReassignment("project-1", "manual-member"),
    ).resolves.toEqual([]);
  });

  it("does not evict a participant who remains active through another project role", async () => {
    const conversationParticipant = {
      findFirst: vi
        .fn()
        .mockResolvedValueOnce({ id: "participant-2" })
        .mockResolvedValueOnce({ id: "participant-2" }),
    };
    const prisma = {
      conversation: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: "conversation-1", isActive: true }),
      },
      conversationParticipant,
    };
    const service = new ProjectGroupChatService(prisma as never, {} as never);
    vi.spyOn(service, "syncParticipants").mockResolvedValue(null as never);

    await expect(
      service.syncParticipantsForTaskReassignment(
        "project-1",
        "still-a-member",
      ),
    ).resolves.toEqual([]);
  });

  it("emits a socket-room removal event for a committed membership removal", async () => {
    const emit = vi.fn();
    const service = new ProjectGroupChatService(
      {
        conversation: {
          findUnique: vi.fn().mockResolvedValue({ id: "conversation-1" }),
        },
      } as never,
      { emit } as never,
    );

    await service.publishParticipantRemovals("project-1", ["former-assignee"]);

    expect(emit).toHaveBeenCalledWith("chat.participantRemoved", {
      conversationId: "conversation-1",
      userId: "former-assignee",
    });
  });
});
