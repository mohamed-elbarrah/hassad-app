import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AutomationService } from '../services/automation.service';
import { CreateAutomationRuleDto, ExecuteAutomationDto } from '../dto/automation.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('automation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('rules')
  @RequirePermissions('automation.create')
  createRule(@Body() dto: CreateAutomationRuleDto) {
    return this.automationService.createRule(dto);
  }

  @Get('rules')
  @RequirePermissions('automation.read')
  getRules() {
    return this.automationService.getRules();
  }

  // INTERNAL: triggers automation rule execution against a specific lead
  @Post('execute')
  @RequirePermissions('automation.execute')
  execute(@Body() dto: ExecuteAutomationDto) {
    return this.automationService.executeRule(dto);
  }
}
