import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiProviderRegistry } from "../ai/services/ai-provider-registry.service";
import type { AiResult } from "../ai/adapters/provider.interface";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { ToolResult } from "./tools/tool.interface";
import { AiAssistantArea, AiMessageRole } from "@hassad/shared";

export class AiAssistantError extends Error {
  constructor(
    public readonly code: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = "AiAssistantError";
  }
}

export interface ToolCallEvent {
  tool: string;
  args: Record<string, unknown>;
  callId: string;
  result: ToolResult;
}

export interface GenerateResult {
  finalText: string;
  toolCalls: ToolCallEvent[];
  messageId: string;
}

/** Keep tool payloads useful to the model without allowing unbounded prompt growth. */
export const MAX_TOOL_CONTEXT_CHARS = 16_000;
export const MAX_PROMPT_HISTORY_MESSAGES = 24;
export const MAX_PROMPT_HISTORY_CHARS = 32_000;
export const PROMPT_TRUNCATION_MARKER =
  "[سجل المحادثة السابق مختصر بسبب حد السياق]";
export const TOOL_RESULTS_TRUNCATION_MARKER =
  "[نتائج أدوات إضافية مختصرة بسبب حد السياق]";

export function serializeToolContext(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AiAssistantError("AI_TOOL_RESULT_INVALID", {
      reason: "DATA_OBJECT_REQUIRED",
    });
  }
  let serialized: string;
  try {
    const candidate = JSON.stringify(data);
    if (typeof candidate !== "string") throw new Error("JSON_RESULT_UNDEFINED");
    serialized = candidate;
    // Round-trip validation prevents passing non-JSON values or malformed data onward.
    JSON.parse(serialized);
  } catch {
    throw new AiAssistantError("AI_TOOL_RESULT_INVALID", {
      reason: "DATA_NOT_SERIALIZABLE",
    });
  }
  if (serialized.length <= MAX_TOOL_CONTEXT_CHARS) return serialized;
  let preview = serialized.slice(0, MAX_TOOL_CONTEXT_CHARS);
  let bounded = JSON.stringify({ truncated: true, serializedPreview: preview });
  while (bounded.length > MAX_TOOL_CONTEXT_CHARS && preview.length > 0) {
    preview = preview.slice(0, Math.floor(preview.length * 0.9));
    bounded = JSON.stringify({ truncated: true, serializedPreview: preview });
  }
  return bounded;
}

export function boundToolResults(results: string[]): string {
  if (results.length === 0) return "";
  const first = results[0];
  // Always retain a bounded representation of the first result. Previously a
  // single oversized result caused the whole tool payload to disappear.
  const firstBudget =
    results.length > 1
      ? MAX_TOOL_CONTEXT_CHARS - TOOL_RESULTS_TRUNCATION_MARKER.length - 1
      : MAX_TOOL_CONTEXT_CHARS;
  let firstResult = first;
  if (firstResult.length > firstBudget) {
    const marker = "[بيانات النتيجة مختصرة]";
    firstResult = `${first.slice(0, Math.max(0, firstBudget - marker.length - 1))}\n${marker}`;
  }
  const output = [firstResult];
  let length = firstResult.length;
  for (const result of results.slice(1)) {
    if (
      length + 1 + result.length + TOOL_RESULTS_TRUNCATION_MARKER.length + 1 >
      MAX_TOOL_CONTEXT_CHARS
    )
      break;
    output.push(result);
    length += 1 + result.length;
  }
  if (output.length < results.length)
    output.push(TOOL_RESULTS_TRUNCATION_MARKER);
  return output.join("\n").slice(0, MAX_TOOL_CONTEXT_CHARS);
}

/** Select a recent context while retaining the current user turn and newest tool result. */
export function boundPromptHistory(
  messages: Array<{ role: string; content: string }>,
) {
  if (messages.length === 0) return messages;
  const currentUserIndex = messages.reduce(
    (latest, message, index) => (message.role === "user" ? index : latest),
    -1,
  );
  if (currentUserIndex < 0) return messages.slice(-MAX_PROMPT_HISTORY_MESSAGES);
  const mandatory = new Set<number>([currentUserIndex]);
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "system") {
      mandatory.add(i);
      break;
    }
  }
  const selected = new Set<number>(mandatory);
  for (
    let i = messages.length - 1;
    i >= 0 && selected.size < MAX_PROMPT_HISTORY_MESSAGES;
    i--
  )
    selected.add(i);
  const ordered = [...selected].sort((a, b) => a - b);
  const current = messages[currentUserIndex];
  let history = ordered.map((index) => messages[index]);
  let chars = history.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  while (chars > MAX_PROMPT_HISTORY_CHARS && history.length > 1) {
    const removable = history.findIndex(
      (message) => message !== current && message.role !== "system",
    );
    if (removable < 0) break;
    chars -= history[removable].content.length;
    history.splice(removable, 1);
  }
  if (history.length < messages.length || chars > MAX_PROMPT_HISTORY_CHARS) {
    const marker = { role: "system", content: PROMPT_TRUNCATION_MARKER };
    history = [marker, ...history.filter((message) => message !== marker)];
  }
  return history;
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private prisma: PrismaService,
    private providerRegistry: AiProviderRegistry,
    private toolRegistry: ToolRegistryService,
  ) {}

  async createConversation(
    userId: string,
    data: { title?: string; areas: AiAssistantArea[] },
  ) {
    const areas = data.areas.length === 0 ? [AiAssistantArea.ALL] : data.areas;
    return this.prisma.aiConversation.create({
      data: { userId, title: data.title, areas, preferences: {} },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  async listConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getConversation(id: string, userId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id, userId, isActive: true },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conv) {
      throw new NotFoundException({
        code: "AI_CONVERSATION_NOT_FOUND",
        details: { conversationId: id },
      });
    }
    return conv;
  }

  async deleteConversation(id: string, userId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id, userId },
    });
    if (!conv) {
      throw new NotFoundException({
        code: "AI_CONVERSATION_NOT_FOUND",
        details: { conversationId: id },
      });
    }
    return this.prisma.aiConversation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** Saves only to an active conversation owned by the authenticated user. */
  async saveMessage(
    conversationId: string,
    userId: string,
    role: AiMessageRole,
    content: string | null,
    toolCalls?: Record<string, unknown>[],
  ) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId, isActive: true },
      select: { id: true },
    });
    if (!conversation) {
      throw new NotFoundException({
        code: "AI_CONVERSATION_NOT_FOUND",
        details: { conversationId },
      });
    }
    return this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role,
        content,
        toolCalls: toolCalls
          ? JSON.parse(JSON.stringify(toolCalls))
          : undefined,
      },
    });
  }

  buildSystemPrompt(areas: AiAssistantArea[]): string {
    const tools = this.toolRegistry.getDefinitions(areas);
    const toolDescriptions = tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");
    return `أنت مساعد ذكي لمنصة "حصاد" لإدارة الأعمال. دورك مساعدة المدير بالتقارير والنصائح والتحليلات بناءً على بيانات حقيقية.

المجالات المتاحة: ${areas.join(", ")}

قواعد مهمة:
1. تحدث باللغة العربية الفصحى
2. كن موجزاً ومفيداً
3. إذا طلب المستخدم بيانات أو إحصائيات، استخدم الأدوات المتاحة
4. لا تخترع أرقاماً أو بيانات
5. استخدم أداة واحدة فقط لكل رد إن أمكن
6. بعد الحصول على بيانات الأداة: قدّم إجابة مفهومة ومختصرة للمستخدم. لا تستخدم أداة مكررة.
7. إذا حصلت على البيانات المطلوبة، أجب مباشرة بدون استخدام أدوات إضافية

الأدوات المتاحة:
${toolDescriptions}

صيغة استخدام الأداة (أدرج السطرين فقط بدون نص إضافي):
<<<TOOL_CALL>>>
{"name": "اسم_الأداة", "args": {}}
<<<TOOL_CALL>>>

إذا لم تكن بحاجة لأداة، أجب مباشرة.`;
  }

  private buildSinglePrompt(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): string {
    const parts = [`[النظام]\n${systemPrompt}\n`];
    for (const m of messages) {
      const label =
        m.role === "user"
          ? "المستخدم"
          : m.role === "system"
            ? "نتيجة الأداة"
            : "المساعد";
      parts.push(`[${label}]\n${m.content}`);
    }
    parts.push("[المساعد]\n");
    return parts.join("\n");
  }

  async generateWithTools(
    conversationId: string,
    userId: string,
    userMessage: string,
  ): Promise<GenerateResult> {
    // Resolve ownership before the first write (and saveMessage checks it again for every write).
    const conv = await this.getConversation(conversationId, userId);
    await this.saveMessage(
      conversationId,
      userId,
      AiMessageRole.USER,
      userMessage,
    );
    const areas = conv.areas as AiAssistantArea[];
    const systemPrompt = this.buildSystemPrompt(areas);
    const allMessages = conv.messages.map((m) => ({
      role:
        m.role === AiMessageRole.USER
          ? "user"
          : m.role === AiMessageRole.SYSTEM
            ? "system"
            : "assistant",
      content: m.content || "",
    }));
    const toolCalls: ToolCallEvent[] = [];
    const messages = [...allMessages, { role: "user", content: userMessage }];
    const executedToolKeys = new Set<string>();

    for (let loop = 0; loop < 3; loop++) {
      let result: AiResult;
      try {
        result = await this.providerRegistry.generateWithFallback(
          this.buildSinglePrompt(systemPrompt, boundPromptHistory(messages)),
          {
            temperature: 0.7,
            maxTokens: 2048,
          },
        );
      } catch (err) {
        this.logger.error("AI generation failed", err);
        throw new AiAssistantError("AI_PROVIDER_UNAVAILABLE", {});
      }

      const regex = /<<<TOOL_CALL>>>\s*(\{[\s\S]*?\})\s*<<<TOOL_CALL>>>/g;
      const matches = [...result.text.matchAll(regex)];
      if (matches.length === 0) {
        messages.push({ role: "assistant", content: result.text });
        break;
      }
      const cleanText = result.text.replace(regex, "").trim();
      const results: string[] = [];
      for (let index = 0; index < matches.length; index++) {
        let parsed: { name?: unknown; args?: unknown };
        try {
          parsed = JSON.parse(matches[index][1]);
        } catch {
          throw new AiAssistantError("AI_TOOL_CALL_INVALID", {
            callId: `call_${loop}_${index}`,
          });
        }
        if (typeof parsed.name !== "string" || !parsed.name) {
          throw new AiAssistantError("AI_TOOL_CALL_INVALID", {
            callId: `call_${loop}_${index}`,
          });
        }
        const toolArgs =
          parsed.args && typeof parsed.args === "object"
            ? (parsed.args as Record<string, unknown>)
            : {};
        const toolKey = `${parsed.name}:${JSON.stringify(toolArgs)}`;
        if (executedToolKeys.has(toolKey)) continue;
        executedToolKeys.add(toolKey);
        const callId = `call_${loop}_${index}`;
        const callResult = await this.toolRegistry.executeTool(
          parsed.name,
          toolArgs,
          areas,
        );
        toolCalls.push({
          tool: parsed.name,
          args: toolArgs,
          callId,
          result: callResult,
        });
        const serializedData = serializeToolContext(callResult.data);
        results.push(
          `${parsed.name}: ${callResult.summary}\nبيانات الأداة (JSON): ${serializedData}`,
        );
      }
      if (results.length) {
        messages.push({
          role: "system",
          content: `[بيانات الأدوات]\n${boundToolResults(results)}`,
        });
        for (const summary of results)
          await this.saveMessage(
            conversationId,
            userId,
            AiMessageRole.SYSTEM,
            summary,
          );
      }
      if (cleanText) messages.push({ role: "assistant", content: cleanText });
      if (!cleanText && !results.length) break;
    }

    const final =
      [...messages].reverse().find((message) => message.role === "assistant")
        ?.content || "";
    const message = await this.saveMessage(
      conversationId,
      userId,
      AiMessageRole.ASSISTANT,
      final,
      toolCalls.map(({ tool, args, callId, result }) => ({
        tool,
        args,
        callId,
        result,
      })),
    );
    return { finalText: final, toolCalls, messageId: message.id };
  }
}
