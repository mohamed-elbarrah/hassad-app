import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { AiAnalyzeDto } from '../dto/ai.dto';
import { AiSuggestionStatus } from '@hassad/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @RequirePermissions('ai.analyze')
  analyze(@CurrentUser() user: any, @Body() dto: AiAnalyzeDto) {
    return this.aiService.analyze(user.id, dto);
  }

  @Get('logs/:id')
  @RequirePermissions('ai.read')
  getLog(@Param('id') id: string) {
    return this.aiService.getLog(id);
  }

  @Get('suggestions')
  @RequirePermissions('ai.read')
  getSuggestions() {
    return this.aiService.getSuggestions();
  }

  @Post('suggestions/:id/accept')
  @RequirePermissions('ai.manage_suggestions')
  acceptSuggestion(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aiService.updateSuggestionStatus(id, user.id, AiSuggestionStatus.ACCEPTED);
  }

  @Post('suggestions/:id/reject')
  @RequirePermissions('ai.manage_suggestions')
  rejectSuggestion(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aiService.updateSuggestionStatus(id, user.id, AiSuggestionStatus.REJECTED);
  }
}
