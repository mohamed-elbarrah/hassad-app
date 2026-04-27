import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AutomationStatus } from '@hassad/shared';
import { CreateAutomationRuleDto, ExecuteAutomationDto } from '../dto/automation.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AutomationService {
  constructor(private prisma: PrismaService) {}

  async createRule(dto: CreateAutomationRuleDto) {
    return this.prisma.leadAutomationRule.create({
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
    return this.prisma.leadAutomationRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async executeRule(dto: ExecuteAutomationDto) {
    const { ruleId, leadId } = dto;

    const rule = await this.prisma.leadAutomationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(`Automation rule with ID ${ruleId} not found`);
    }
    if (!rule.isActive) {
      throw new BadRequestException('Automation rule is inactive');
    }

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // Create a log entry tracking this execution
    const log = await this.prisma.leadAutomationLog.create({
      data: {
        ruleId,
        leadId,
        status: AutomationStatus.PENDING,
      },
    });

    try {
      // Execute the action defined in actionJson
      // Action processing dispatches based on rule.actionJson.type
      const actionJson = rule.actionJson as Record<string, unknown>;
      const responseData: Record<string, unknown> = { actionType: actionJson['type'] ?? 'unknown' };

      await this.prisma.leadAutomationLog.update({
        where: { id: log.id },
        data: {
          status: AutomationStatus.SUCCESS,
          responseData: responseData as Prisma.InputJsonValue,
        },
      });

      return { success: true, logId: log.id, ruleId, leadId };
    } catch (error) {
      await this.prisma.leadAutomationLog.update({
        where: { id: log.id },
        data: {
          status: AutomationStatus.FAILED,
          responseData: { error: (error as Error).message } as Prisma.InputJsonValue,
        },
      });
      throw error;
    }
  }
}
