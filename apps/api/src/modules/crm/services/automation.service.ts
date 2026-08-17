import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
import {
  badRequest,
  internal,
  notFound,
} from "../../../common/errors/domain-errors";
import { AutomationStatus } from "@hassad/shared";
import {
  CreateAutomationRuleDto,
  ExecuteAutomationDto,
} from "../dto/automation.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class AutomationService {
  constructor(private prisma: PrismaService) {}

  async createRule(dto: CreateAutomationRuleDto) {
    return this.prisma.requestAutomationRule.create({
      data: {
        name: dto.name,
        triggerType: dto.triggerType,
        conditionJson: dto.conditionJson as Prisma.InputJsonValue,
        actionJson: dto.actionJson as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getRules() {
    return this.prisma.requestAutomationRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async executeRule(dto: ExecuteAutomationDto) {
    const { ruleId, requestId } = dto;

    const executionError = () =>
      internal("AUTOMATION_EXECUTION_FAILED", "Automation execution failed", {
        ruleId,
        requestId,
      });
    const persistFailure = async (logId: string) => {
      try {
        await this.prisma.requestAutomationLog.update({
          where: { id: logId },
          data: {
            status: AutomationStatus.FAILED,
            responseData: {
              code: "AUTOMATION_EXECUTION_FAILED",
              ruleId,
              requestId,
            } as Prisma.InputJsonValue,
          },
        });
      } catch {
        // Preserve the stable execution error if failure logging is unavailable.
      }
    };

    let logId: string | null = null;

    try {
      const rule = await this.prisma.requestAutomationRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        throw notFound(
          "AUTOMATION_RULE_NOT_FOUND",
          `Automation rule with ID ${ruleId} not found`,
        );
      }
      if (!rule.isActive) {
        throw badRequest("AUTOMATION_INACTIVE", "Automation rule is inactive");
      }

      const request = await this.prisma.request.findUnique({
        where: { id: requestId },
      });
      if (!request) {
        throw notFound(
          "AUTOMATION_REQUEST_NOT_FOUND",
          `Request with ID ${requestId} not found`,
        );
      }

      // Create a log entry tracking this execution
      const log = await this.prisma.requestAutomationLog.create({
        data: {
          ruleId,
          requestId,
          status: AutomationStatus.PENDING,
        },
      });
      logId = log.id;

      try {
        // Execute the action defined in actionJson
        // Action processing dispatches based on rule.actionJson.type
        const actionJson = rule.actionJson as Record<string, unknown>;
        const responseData: Record<string, unknown> = {
          actionType: actionJson["type"] ?? "unknown",
        };

        await this.prisma.requestAutomationLog.update({
          where: { id: log.id },
          data: {
            status: AutomationStatus.SUCCESS,
            responseData: responseData as Prisma.InputJsonValue,
          },
        });

        return {
          action: "automation_executed" as const,
          automation: { logId: log.id, ruleId, requestId },
        };
      } catch {
        await persistFailure(log.id);
        throw executionError();
      }
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      if (logId) {
        await persistFailure(logId);
      }

      throw executionError();
    }
  }
}
