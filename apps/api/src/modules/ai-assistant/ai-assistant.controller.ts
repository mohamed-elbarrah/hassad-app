import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { AiAssistantError, AiAssistantService } from "./ai-assistant.service";
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationListQueryDto,
} from "./dto/ai-assistant.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "../../common/decorators/current-user.decorator";

@Controller("ai-assistant")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiAssistantController {
  private readonly logger = new Logger(AiAssistantController.name);
  constructor(private readonly service: AiAssistantService) {}

  @Post("conversations")
  @RequirePermissions("admin.dashboard")
  async createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.service.createConversation(user.id, dto);
  }

  @Get("conversations")
  @RequirePermissions("admin.dashboard")
  async listConversations(
    @CurrentUser() user: JwtPayload,
    @Query() _query: ConversationListQueryDto,
  ) {
    return this.service.listConversations(user.id);
  }

  @Get("conversations/:id")
  @RequirePermissions("admin.dashboard")
  async getConversation(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.service.getConversation(id, user.id);
  }

  @Delete("conversations/:id")
  @RequirePermissions("admin.dashboard")
  async deleteConversation(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.service.deleteConversation(id, user.id);
  }

  @Post("conversations/:id/messages")
  @RequirePermissions("admin.dashboard")
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param("id") conversationId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    await this.service.getConversation(conversationId, user.id);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    const sendEvent = (event: string, data: Record<string, unknown>) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await this.service.generateWithTools(
        conversationId,
        user.id,
        dto.content,
      );
      for (const tc of result.toolCalls) {
        sendEvent("tool_call", {
          tool: tc.tool,
          args: tc.args,
          callId: tc.callId,
        });
        sendEvent("tool_result", { callId: tc.callId, result: tc.result });
      }
      for (const word of result.finalText.split(/(\s+)/)) {
        sendEvent("token", { content: word });
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      sendEvent("done", { messageId: result.messageId });
    } catch (err) {
      this.logger.error(
        `AI assistant request failed (${err instanceof AiAssistantError ? err.code : "AI_REQUEST_FAILED"})`,
      );
      if (err instanceof AiAssistantError) {
        sendEvent("error", { code: err.code, details: err.details });
      } else if (
        err &&
        typeof err === "object" &&
        "getResponse" in err &&
        typeof (err as { getResponse: () => unknown }).getResponse ===
          "function"
      ) {
        const response = (err as { getResponse: () => unknown }).getResponse();
        const body =
          typeof response === "object" && response !== null
            ? (response as Record<string, unknown>)
            : {};
        sendEvent("error", {
          code: typeof body.code === "string" ? body.code : "AI_REQUEST_FAILED",
          details:
            body.details && typeof body.details === "object"
              ? (body.details as Record<string, unknown>)
              : {},
        });
      } else {
        sendEvent("error", { code: "AI_REQUEST_FAILED", details: {} });
      }
    } finally {
      res.end();
    }
  }
}
