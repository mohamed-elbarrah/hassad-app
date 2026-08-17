import { useCallback, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/utils";

export interface StreamToken {
  type: "token";
  content: string;
}

export interface StreamToolCall {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
  callId: string;
}

export interface StreamToolResult {
  type: "tool_result";
  callId: string;
  result: Record<string, unknown>;
}

export interface StreamDone {
  type: "done";
  messageId: string;
}

export interface StreamError {
  type: "error";
  message: string;
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

export function useAiAssistantStream(
  onEvent: (event: StreamEvent) => void,
  onError?: (error: string) => void,
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
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (eventType === "token") {
                  onEvent({ type: "token", content: data.content });
                } else if (eventType === "tool_call") {
                  onEvent({
                    type: "tool_call",
                    tool: data.tool,
                    args: data.args,
                    callId: data.callId,
                  });
                } else if (eventType === "tool_result") {
                  onEvent({
                    type: "tool_result",
                    callId: data.callId,
                    result: data.result,
                  });
                } else if (eventType === "done") {
                  onEvent({ type: "done", messageId: data.messageId });
                } else if (eventType === "error") {
                  onEvent({ type: "error", message: data.message });
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          onError?.(err.message || "حدث خطأ في الاتصال");
          onEvent({ type: "error", message: err.message || "حدث خطأ في الاتصال" });
        }
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
