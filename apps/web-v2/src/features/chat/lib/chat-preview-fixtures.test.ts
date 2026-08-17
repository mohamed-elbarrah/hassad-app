import { describe, expect, it } from "vitest";

import {
  chatPreviewScenarios,
  getChatPreviewScenario,
} from "@/features/chat/lib/chat-preview-fixtures";

describe("chat preview fixtures", () => {
  it("keeps scenario identifiers unique", () => {
    const ids = chatPreviewScenarios.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all required message statuses across preview scenarios", () => {
    const statuses = new Set(
      chatPreviewScenarios.flatMap((scenario) =>
        scenario.conversations.flatMap((conversation) =>
          conversation.messages.map((message) => message.status).filter(Boolean)
        )
      )
    );

    expect(statuses).toEqual(
      new Set(["sending", "sent", "delivered", "seen", "failed"])
    );
  });

  it("exposes locked and unrestricted capabilities for future adapters", () => {
    const locked = getChatPreviewScenario("dispute-escalation-thread");
    const unrestricted = getChatPreviewScenario("direct-active");

    expect(locked.conversations[0]?.capabilitySet.compose).toBe(false);
    expect(unrestricted.conversations[0]?.capabilitySet.edit).toBe(true);
  });
});
