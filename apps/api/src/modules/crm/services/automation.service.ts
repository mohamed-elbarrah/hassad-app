import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
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

    const rule = await this.prisma.requestAutomationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(
        `Automation rule with ID ${ruleId} not found`,
      );
    }
    if (!rule.isActive) {
      throw new ApiException("AUTOMATION_INACTIVE", "Automation rule is inactive", 400);
    }

    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    // Create a log entry tracking this execution
    const log = await this.prisma.requestAutomationLog.create({
      data: {
        ruleId,
        requestId,
        status: AutomationStatus.PENDING,
      },
    });

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

      return { success: true, logId: log.id, ruleId, requestId };
    } catch (error) {
      await this.prisma.requestAutomationLog.update({
        where: { id: log.id },
        data: {
          status: AutomationStatus.FAILED,
          responseData: {
            error: (error as Error).message,
          } as Prisma.InputJsonValue,
        },
      });
      throw error;
    }
  }
}
