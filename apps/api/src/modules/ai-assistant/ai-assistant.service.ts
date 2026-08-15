import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiProviderRegistry } from "../ai/services/ai-provider-registry.service";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { ToolResult } from "./tools/tool.interface";
import { AiAssistantArea, AiMessageRole } from "@hassad/shared";

export interface ToolCallEvent {
  name: string;
  args: Record<string, unknown>;
  result: ToolResult;
}

export interface GenerateResult {
  finalText: string;
  toolCalls: ToolCallEvent[];
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
      data: {
        userId,
        title: data.title,
        areas,
        preferences: {},
      },
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
    if (!conv) throw new NotFoundException("Conversation not found");
    return conv;
  }

  async deleteConversation(id: string, userId: string) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id, userId } });
    if (!conv) throw new NotFoundException("Conversation not found");
    return this.prisma.aiConversation.update({
      where: { id }, data: { isActive: false },
    });
  }

  async saveMessage(
    conversationId: string,
    role: AiMessageRole,
    content: string | null,
    toolCalls?: Record<string, unknown>[],
  ) {
    return this.prisma.aiMessage.create({
      data: {
        conversationId,
        role,
        content,
        toolCalls: toolCalls ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
      },
    });
  }

  buildSystemPrompt(areas: AiAssistantArea[]): string {
    const tools = this.toolRegistry.getDefinitions(areas);
    const toolDescriptions = tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    return `You are the Hassad business operations assistant. Help administrators with reports, recommendations, and analysis based on real data.

Available areas: ${areas.join(", ")}

Important rules:
1. Respond in English.
2. Be concise and useful.
3. Use the available tools when the user requests data or statistics.
4. Never invent numbers or data.
5. Use one tool per response whenever possible.
6. After receiving tool data, provide a clear and concise answer. Do not repeat a tool call.
7. If you have the requested data, answer directly without additional tools.

Available tools:
${toolDescriptions}

Tool-call format (include only these two lines with no extra text):
<<<TOOL_CALL>>>
{"name": "toolName", "args": {}}
<<<TOOL_CALL>>>

Example:
<<<TOOL_CALL>>>
{"name": "getRevenueSummary", "args": {}}
<<<TOOL_CALL>>>

If no tool is needed, answer directly.`;
  }

  private buildSinglePrompt(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): string {
    const parts = [`[System]\n${systemPrompt}\n`];
    for (const m of messages) {
      let label: string;
      if (m.role === "user") {
        label = "User";
      } else if (m.role === "system") {
        label = "Tool result";
      } else {
        label = "Assistant";
      }
      parts.push(`[${label}]\n${m.content}`);
    }
    parts.push("[Assistant]\n");
    return parts.join("\n");
  }

  async generateWithTools(
    conversationId: string,
    userId: string,
    userMessage: string,
  ): Promise<GenerateResult> {
    await this.saveMessage(conversationId, AiMessageRole.USER, userMessage);
    const conv = await this.getConversation(conversationId, userId);
    const areas = conv.areas as AiAssistantArea[];

    const systemPrompt = this.buildSystemPrompt(areas);
    const allMessages = conv.messages.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content || "",
    }));

    const toolCalls: ToolCallEvent[] = [];
    const maxToolLoops = 3;
    const messages = [...allMessages];
    const executedToolKeys = new Set<string>();

    for (let loop = 0; loop < maxToolLoops; loop++) {
      const prompt = this.buildSinglePrompt(systemPrompt, messages);

      const provider = this.providerRegistry.getPrimary();
      if (!provider) {
        this.logger.warn("No AI provider available");
        const errMsg = "Sorry, no AI provider is currently active.";
        messages.push({ role: "assistant", content: errMsg });
        break;
      }

      const maxTokens = Math.min(
        (provider as any).config?.maxTokens ?? 2048,
        4096,
      );

      let result;
      try {
        result = await provider.generateText(prompt, {
          temperature: 0.7,
          maxTokens,
        });
      } catch (err) {
        this.logger.error("AI generation failed", err);
        const errMsg = "Sorry, an error occurred while connecting to the AI provider.";
        messages.push({ role: "assistant", content: errMsg });
        break;
      }

      const toolCallRegex = /<<<TOOL_CALL>>>\s*(\{[\s\S]*?\})\s*<<<TOOL_CALL>>>/g;
      const allMatches = [...result.text.matchAll(toolCallRegex)];

      if (allMatches.length === 0) {
        messages.push({ role: "assistant", content: result.text });
        break;
      }

      const cleanText = result.text.replace(toolCallRegex, "").trim();

      let allParsed = true;
      const results: string[] = [];
      for (const match of allMatches) {
        try {
          const parsed = JSON.parse(match[1]);
          const toolName = parsed.name;
          const toolArgs = parsed.args || {};
          const toolKey = `${toolName}:${JSON.stringify(toolArgs)}`;

          if (executedToolKeys.has(toolKey)) {
            this.logger.warn(`Skipping duplicate tool call: ${toolKey}`);
            continue;
          }
          executedToolKeys.add(toolKey);

          this.logger.log(`Tool call: ${toolName}`);

          const callResult = await this.toolRegistry.executeTool(
            toolName,
            toolArgs as Record<string, unknown>,
          );
          toolCalls.push({
            name: toolName,
            args: toolArgs as Record<string, unknown>,
            result: callResult,
          });

          results.push(`${toolName}: ${callResult.summary}`);
        } catch (parseErr) {
          this.logger.warn("Failed to parse tool call", parseErr);
          allParsed = false;
        }
      }

      if (results.length === 0 && !cleanText) {
        messages.push({
          role: "assistant",
          content: "All requested data has been retrieved.",
        });
        break;
      }

      if (results.length > 0) {
        const resultSection = `[Tool data]\n${results.join("\n")}`;
        messages.push({ role: "system", content: resultSection });
        for (const r of results) {
          await this.saveMessage(conversationId, AiMessageRole.SYSTEM, r);
        }
      }

      if (cleanText) {
        messages.push({ role: "assistant", content: cleanText });
      }

      if (!allParsed || results.length === 0) {
        break;
      }
    }

    const final = messages[messages.length - 1]?.content || "Sorry, I could not process your request.";
    await this.saveMessage(conversationId, AiMessageRole.ASSISTANT, final, [
      ...toolCalls.map((tc) => ({
        name: tc.name,
        args: tc.args,
        result: tc.result,
      })),
    ]);
    return { finalText: final, toolCalls };
  }
}
