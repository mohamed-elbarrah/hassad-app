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
    if (!conv) throw new NotFoundException("المحادثة غير موجودة");
    return conv;
  }

  async deleteConversation(id: string, userId: string) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id, userId } });
    if (!conv) throw new NotFoundException("المحادثة غير موجودة");
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

مثال:
<<<TOOL_CALL>>>
{"name": "getRevenueSummary", "args": {}}
<<<TOOL_CALL>>>

إذا لم تكن بحاجة لأداة، أجب مباشرة.`;
  }

  private buildSinglePrompt(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): string {
    const parts = [`[النظام]\n${systemPrompt}\n`];
    for (const m of messages) {
      let label: string;
      if (m.role === "user") {
        label = "المستخدم";
      } else if (m.role === "system") {
        label = "نتيجة الأداة";
      } else {
        label = "المساعد";
      }
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
        const errMsg = "عذراً، لا يوجد مزود ذكاء اصطناعي مفعل حالياً.";
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
        const errMsg = "عذراً، حدث خطأ في الاتصال بمزود الذكاء الاصطناعي.";
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
          content: "تم الحصول على جميع البيانات المطلوبة.",
        });
        break;
      }

      if (results.length > 0) {
        const resultSection = `[بيانات الأدوات]\n${results.join("\n")}`;
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

    const final = messages[messages.length - 1]?.content || "عذراً، لم أتمكن من معالجة طلبك.";
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
