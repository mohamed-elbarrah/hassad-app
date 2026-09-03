import { useCallback, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/utils";

export interface StreamToken {
  type: "token";
  content: string;
}

/** A tool invocation emitted by the assistant stream. */
export interface StreamToolCall {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
  callId: string;
}

export interface StreamToolResult {
  type: "tool_result";
  callId: string;
  result: unknown;
}

export interface StreamDone {
  type: "done";
  messageId: string;
}

export interface StreamError {
  type: "error";
  code: string;
  details: Record<string, unknown>;
}

export type StreamEvent =
  | StreamToken
  | StreamToolCall
  | StreamToolResult
  | StreamDone
  | StreamError;

interface UseAiStreamResult {
  send: (conversationId: string, content: string) => Promise<void>;
  cancel: () => void;
  isStreaming: boolean;
}

type EventData = Record<string, unknown>;

function isRecord(value: unknown): value is EventData {
  return typeof value === "object" && value !== null;
}

function stringField(data: EventData, field: string): string | undefined {
  return typeof data[field] === "string" ? data[field] : undefined;
}

function parseEvent(eventType: string, data: unknown): StreamEvent | undefined {
  if (!isRecord(data)) return undefined;
  if (eventType === "token") {
    const content = stringField(data, "content");
    return content === undefined ? undefined : { type: "token", content };
  }
  if (eventType === "tool_call") {
    const tool = stringField(data, "tool");
    const callId = stringField(data, "callId");
    return tool && callId && isRecord(data.args)
      ? { type: "tool_call", tool, args: data.args, callId }
      : undefined;
  }
  if (eventType === "tool_result") {
    const callId = stringField(data, "callId");
    return callId === undefined || !("result" in data)
      ? undefined
      : { type: "tool_result", callId, result: data.result };
  }
  if (eventType === "done") {
    const messageId = stringField(data, "messageId");
    return messageId === undefined ? undefined : { type: "done", messageId };
  }
  if (eventType === "error") {
    const code = stringField(data, "code");
    return code === undefined
      ? undefined
      : {
          type: "error",
          code,
          details: isRecord(data.details) ? data.details : {},
        };
  }
  return undefined;
}

export function useAiAssistantStream(
  onEvent: (event: StreamEvent) => void,
  onError?: (code: string) => void,
): UseAiStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (conversationId: string, content: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch(
          `${getApiBaseUrl()}/ai-assistant/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content }),
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          let code = "REQUEST_FAILED";
          try {
            const payload: unknown = await response.json();
            if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string") {
              code = payload.error.code;
            }
          } catch {
            // Use the stable fallback when the error response is not JSON.
          }
          throw new Error(code);
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error("REQUEST_FAILED");

        const decoder = new TextDecoder();
        let buffer = "";
        let eventType = "";
        const consume = (line: string) => {
          if (line === "") {
            eventType = "";
            return;
          }
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          if (!line.startsWith("data: ")) return;
          try {
            const event = parseEvent(eventType, JSON.parse(line.slice(6)));
            if (event) onEvent(event);
          } catch {
            // Ignore malformed SSE frames; a later valid frame can still finish the response.
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          lines.forEach(consume);
          if (done) break;
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        const code = error instanceof Error && error.message ? error.message : "REQUEST_FAILED";
        onError?.(code);
        onEvent({ type: "error", code, details: {} });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [onEvent, onError],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { send, cancel, isStreaming };
}
