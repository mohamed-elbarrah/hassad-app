import { describe, expect, it, vi } from "vitest";
import { AiAssistantController } from "./ai-assistant.controller";
import { AiAssistantError } from "./ai-assistant.service";

describe("AiAssistantController SSE errors", () => {
  it("emits a stable code/details error payload", async () => {
    const service = {
      getConversation: vi.fn(async () => ({ id: "conversation-1" })),
      generateWithTools: vi.fn(async () => {
        throw new AiAssistantError("AI_TOOL_CALL_INVALID", {
          callId: "call_0_0",
        });
      }),
    };
    const writes: string[] = [];
    const response = {
      setHeader: vi.fn(),
      write: vi.fn((value: string) => writes.push(value)),
      end: vi.fn(),
    };
    const controller = new AiAssistantController(service as never);

    await controller.sendMessage(
      { id: "user-1" } as never,
      "conversation-1",
      { content: "حلل المبيعات" } as never,
      response as never,
    );

    expect(service.getConversation).toHaveBeenCalledWith(
      "conversation-1",
      "user-1",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/event-stream",
    );
    expect(writes).toContain(
      `event: error\ndata: ${JSON.stringify({
        code: "AI_TOOL_CALL_INVALID",
        details: { callId: "call_0_0" },
      })}\n\n`,
    );
    expect(response.end).toHaveBeenCalledOnce();
  });
});
