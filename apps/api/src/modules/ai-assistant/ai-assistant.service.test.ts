import { describe, expect, it } from "vitest";
import {
  boundPromptHistory,
  boundToolResults,
  serializeToolContext,
  MAX_PROMPT_HISTORY_CHARS,
  MAX_TOOL_CONTEXT_CHARS,
  PROMPT_TRUNCATION_MARKER,
  TOOL_RESULTS_TRUNCATION_MARKER,
} from "./ai-assistant.service";

describe("AI prompt context bounds", () => {
  it("truncates old history while retaining the current turn and latest tool result", () => {
    const messages = [
      ...Array.from({ length: 30 }, (_, index) => ({
        role: "user",
        content: `old-${index}`,
      })),
      { role: "user", content: "current question" },
      { role: "system", content: "latest tool result" },
    ];
    const bounded = boundPromptHistory(messages);
    expect(bounded.map((message) => message.content)).toContain(
      "current question",
    );
    expect(bounded.map((message) => message.content)).toContain(
      "latest tool result",
    );
    expect(bounded.map((message) => message.content)).toContain(
      PROMPT_TRUNCATION_MARKER,
    );
    expect(bounded.length).toBeLessThanOrEqual(27); // 24 recent messages plus marker/mandatory turns
  });

  it("keeps prompt history within the history character budget when removable turns exist", () => {
    const bounded = boundPromptHistory([
      ...Array.from({ length: 10 }, () => ({
        role: "assistant",
        content: "x".repeat(10_000),
      })),
      { role: "user", content: "current" },
      { role: "system", content: "tool data" },
    ]);
    expect(
      bounded.reduce((total, message) => total + message.content.length, 0),
    ).toBeLessThanOrEqual(
      MAX_PROMPT_HISTORY_CHARS + PROMPT_TRUNCATION_MARKER.length,
    );
  });
});

describe("tool result context bounds", () => {
  it("serializes oversized tool data as bounded marker/data", () => {
    const serialized = serializeToolContext({
      payload: "x".repeat(MAX_TOOL_CONTEXT_CHARS * 2),
    });
    const parsed = JSON.parse(serialized);
    expect(parsed.truncated).toBe(true);
    expect(parsed.serializedPreview).toBeTruthy();
    expect(serialized.length).toBeLessThanOrEqual(MAX_TOOL_CONTEXT_CHARS);
  });

  it("retains bounded data and an explicit marker when the first result is oversized", () => {
    const bounded = boundToolResults([
      "first-result-" + "x".repeat(MAX_TOOL_CONTEXT_CHARS * 2),
      "second-result",
    ]);
    expect(bounded.length).toBeLessThanOrEqual(MAX_TOOL_CONTEXT_CHARS);
    expect(bounded).toContain("[بيانات النتيجة مختصرة]");
    expect(bounded).toContain(TOOL_RESULTS_TRUNCATION_MARKER);
  });
});
